import api from '../services/api';

const GEMINI_MODEL  = 'gemini-2.5-flash';
const GROQ_MODEL    = 'llama-3.3-70b-versatile';
const MISTRAL_MODEL = 'mistral-large-latest';

const GEMINI_MAX_TENTATIVAS = 2;
const GEMINI_BACKOFF_INICIAL = 1200;
const GEMINI_RETRY_STATUS = new Set([503]);
const AI_CHUNK_SIZE = 90;
const AI_SINGLE_CALL_LINE_LIMIT = 120;
const GEMINI_DELAY_LOTE_MS = 600;
const AI_MAX_INPUT_CHARS = 18000;
const LOCAL_PARSE_RATIO_MIN = 0.55;
const LOCAL_PARSE_MIN_TRANSACTIONS = 4;

// Endpoints de IA chamados via proxy no backend (chaves nunca chegam ao browser)
const DATE_AT_START_REGEX = /^(\d{2}[/-]\d{2}(?:[/-]\d{4})?)/;
const MONEY_REGEX = /-?\d[\d.]*,\d{2}-?/g;
const HAS_MONEY_REGEX = /-?\d[\d.]*,\d{2}-?/;

const PROVIDERS = {
  gemini: {
    id: 'gemini',
    nome: 'Gemini',
    model: GEMINI_MODEL,
    delayLoteMs: GEMINI_DELAY_LOTE_MS,
  },
  groq: {
    id: 'groq',
    nome: 'Groq',
    model: GROQ_MODEL,
    delayLoteMs: 0,
  },
  mistral: {
    id: 'mistral',
    nome: 'Mistral',
    model: MISTRAL_MODEL,
    delayLoteMs: 0,
  },
};

const DESPESA_KEYWORDS = [
  'debito',
  'compra',
  'pagamento',
  'saque',
  'tarifa',
  'pix enviado',
  'pix pagar',
  'pix transferido',
  'pagto',
  'boleto',
];

const RECEITA_KEYWORDS = [
  'credito',
  'deposito',
  'salario',
  'pix recebido',
  'transferencia recebida',
  'estorno',
  'liquido de vencimento',
  'credito de salario',
  'remuneracao aplicacao automatica',
  'rendimentos',
  'recebido',
];

const RUIDO_EXTRATO_PATTERNS = [
  /^extrato_pf_/i,
  /^balp_/i,
  /^pagina:\s*\d+(?:\/\d+)?$/i,
  /^saldo em \d{2}[/-]\d{2}/i,
  /^movimenta[cç][aã]o(\s|$)/i,
  /^santander(\s|$)/i,
  /^(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\/20\d{2}$/i,
];

const IGNORED_LINE_PATTERNS = [
  /^(data|descricao|descrição|hist[oó]rico|docto|documento|situa[cç][aã]o|cr[eé]dito|d[eé]bito|saldo)(\s|$)/i,
  /^extrato(\s|$)/i,
  /^lan[cç]amentos?(\s|$)/i,
  /^resumo(\s|$)/i,
  /^p[aá]gina\s+\d+/i,
  /^saldo (anterior|atual|do dia)/i,
  /^total(\s|$)/i,
  /^ag[eê]ncia(\s|$)/i,
  /^conta(\s|$)/i,
];

export const GEMINI_SYSTEM_PROMPT = `Voce e um parser especializado em extratos bancarios brasileiros.
Sua unica funcao e extrair transacoes e retornar JSON valido.
Nunca explique. Nunca adicione texto fora do JSON.

Analise o extrato e retorne EXATAMENTE neste formato:
{
  "banco": "nome do banco ou null",
  "periodo": { "inicio": "YYYY-MM-DD ou null", "fim": "YYYY-MM-DD ou null" },
  "transacoes": [
    {
      "data": "YYYY-MM-DD",
      "descricao": "descricao limpa e legivel",
      "valor": 0.00,
      "tipo": "receita | despesa",
      "valor_original": "texto exato do extrato"
    }
  ],
  "total_transacoes": 0,
  "observacoes": "inconsistencias encontradas ou null"
}

REGRAS:
- Ignore saldos, cabecalhos, rodapes e totais
- Debito / pagamento / compra / saque = despesa
- Credito / deposito / salario / pix recebido = receita
- Em extratos com colunas "Credito", "Debito" e "Saldo", use apenas a coluna de credito ou debito como valor da transacao
- Nunca use a coluna "Saldo" como valor da transacao
- Campos como "Docto", "Documento", "Situacao" e codigos internos nao sao valor
- Em "Extrato Consolidado Inteligente" / Santander, ignore "Resumo", "Saldo em 30/11", "Saldo em 31/12" e demais blocos de fechamento
- Em extratos Santander, linhas logo abaixo da movimentacao podem complementar a descricao da transacao anterior
- Em extratos Santander, uma nova movimentacao pode aparecer sem data no inicio quando repete a mesma data contabil da linha anterior
- Em extratos Santander, linhas como "30/11 FariaLimaComercio" abaixo de uma compra no debito fazem parte da descricao anterior, nao sao nova transacao
- Em extratos Santander, valores com "-" no final, como "49,90-", indicam despesa
- Em extratos Santander, termos como "LIQUIDO DE VENCIMENTO", "CREDITO DE SALARIO" e "REMUNERACAO APLICACAO AUTOMATICA" indicam receita
- Em extratos Santander, ignore ruidos como "Extrato_PF_A4_Inteligente", "BALP_", "Pagina: 2/8" e linhas apenas com "dezembro/2025"
- "tipo" deve ser apenas "receita" ou "despesa"
- "valor" deve ser sempre numerico e positivo
- Normalize valores: "1.250,00" -> 1250.00
- Se a data estiver incompleta, infira pelo contexto do extrato
- Se nao tiver certeza sobre uma linha, prefira ignorar
- Nao invente transacoes ausentes
- Nao agrupe multiplos lancamentos em uma unica transacao`;

const criarPromptExtrato = (texto) => `Extraia as transacoes do extrato abaixo.

RETORNE SOMENTE JSON VALIDO.
NUNCA escreva markdown.
NUNCA escreva explicacoes.
NUNCA troque o schema.

REGRAS IMPORTANTES:
- Preserve uma transacao por linha ou lancamento identificado
- "tipo" deve ser "receita" ou "despesa"
- "valor" deve ser numero positivo sem simbolo de moeda
- "data" deve estar em "YYYY-MM-DD"
- Use "valor_original" com o trecho bruto do extrato que originou a transacao
- Ignore saldo anterior, saldo atual, saldo do dia, total, limite, fatura, resumo e cabecalhos
- Se a linha tiver colunas de credito, debito e saldo, extraia o valor apenas de credito ou debito
- Ignore a coluna saldo mesmo quando ela tiver numero
- Ignore docto, documento, nsu, situacao e identificadores internos
- Em "Extrato Consolidado Inteligente" do Santander, o bloco "Conta Corrente / Movimentacao" contem as transacoes validas
- Em "Extrato Consolidado Inteligente" do Santander, linhas sem data podem ser novas transacoes do mesmo dia anterior
- Em "Extrato Consolidado Inteligente" do Santander, linhas com data mas sem valor podem ser complemento da descricao da transacao anterior
- Em "Extrato Consolidado Inteligente" do Santander, valores com "-" ao final, como "49,90-", sao despesas
- Em "Extrato Consolidado Inteligente" do Santander, "LIQUIDO DE VENCIMENTO", "CREDITO DE SALARIO" e "REMUNERACAO APLICACAO AUTOMATICA" sao receitas
- Ignore ruidos como "Extrato_PF_A4_Inteligente", "BALP_", "Pagina: 2/8" e linhas apenas com mes/ano
- Se nao tiver certeza sobre uma linha, prefira ignorar em vez de inventar

EXEMPLO:
Linha: "02/03/2026 DEBITO VISA ELECTRON BRASIL 28/02 CENTRO AUTOMOTIVO 113388 -165,71 544,61"
Saida esperada:
{
  "data": "2026-03-02",
  "descricao": "DEBITO VISA ELECTRON BRASIL 28/02 CENTRO AUTOMOTIVO",
  "valor": 165.71,
  "tipo": "despesa",
  "valor_original": "02/03/2026 DEBITO VISA ELECTRON BRASIL 28/02 CENTRO AUTOMOTIVO 113388 -165,71 544,61"
}

EXEMPLO SANTANDER:
Linhas:
"01/12 DEBITO VISA ELECTRON BRASIL 402388 49,90-"
"30/11 FariaLimaComercio"
"PIX RECEBIDO - 150,00"
"FCS CONSULTORIA COMERCIAL"
"02/12 LIQUIDO DE VENCIMENTO 011205 CNPJ 130,90"
Saidas esperadas:
[
  {
    "data": "2025-12-01",
    "descricao": "DEBITO VISA ELECTRON BRASIL FariaLimaComercio",
    "valor": 49.90,
    "tipo": "despesa"
  },
  {
    "data": "2025-12-01",
    "descricao": "PIX RECEBIDO FCS CONSULTORIA COMERCIAL",
    "valor": 150.00,
    "tipo": "receita"
  },
  {
    "data": "2025-12-02",
    "descricao": "LIQUIDO DE VENCIMENTO",
    "valor": 130.90,
    "tipo": "receita"
  }
]

EXTRATO:
"""${texto}"""`;

const criarEndpointGemini = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const esperar = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const criarErroHttp = (status, mensagem, provider) => {
  const erro = new Error(mensagem);
  erro.status = status;
  erro.provider = provider;
  return erro;
};

const criarErroConfiguracao = (provider) => {
  const erro = new Error(`Configure ${provider.envKey} para usar ${provider.nome} na importacao de extratos.`);
  erro.code = 'MISSING_API_KEY';
  erro.provider = provider.id;
  return erro;
};

const removerAcentos = (texto = '') =>
  String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalizarTextoBusca = (texto = '') =>
  removerAcentos(texto)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const normalizarEspacos = (texto = '') =>
  String(texto || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizarValor = (valor) => {
  if (typeof valor === 'number') return valor;
  if (typeof valor !== 'string') return Number(valor || 0);

  const texto = valor.trim();
  const negativoNoFim = texto.endsWith('-');
  const textoNormalizado = negativoNoFim ? `-${texto.slice(0, -1)}` : texto;

  return Number(
    textoNormalizado
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, ''),
  );
};

const inferirAnoReferencia = (texto = '') => {
  const anos = [...String(texto || '').matchAll(/\b(20\d{2})\b/g)]
    .map((match) => Number(match[1]))
    .filter((ano) => Number.isFinite(ano));

  if (!anos.length) return new Date().getFullYear();
  return anos.sort((a, b) => b - a)[0];
};

const normalizarData = (data, anoReferencia) => {
  const texto = String(data || '').trim();
  if (!texto) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return texto;
  }

  const dataBr = texto.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (dataBr) {
    const [, dia, mes, ano] = dataBr;
    return `${ano}-${mes}-${dia}`;
  }

  const dataCurta = texto.match(/^(\d{2})[/-](\d{2})$/);
  if (dataCurta) {
    const [, dia, mes] = dataCurta;
    return `${anoReferencia}-${mes}-${dia}`;
  }

  const fallback = new Date(texto);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback.toISOString().slice(0, 10);
  }

  return null;
};

const normalizarPeriodo = (periodo, anoReferencia) => ({
  inicio: normalizarData(periodo?.inicio, anoReferencia),
  fim: normalizarData(periodo?.fim, anoReferencia),
});

const inferirBanco = (texto = '') => {
  const normalizado = normalizarTextoBusca(texto);
  if (normalizado.includes('santander')) return 'Santander';
  return null;
};

const inferirPeriodoPorTransacoes = (transacoes = []) => {
  if (!transacoes.length) {
    return { inicio: null, fim: null };
  }

  const datas = transacoes
    .map((transacao) => transacao.data)
    .filter((data) => /^\d{4}-\d{2}-\d{2}$/.test(String(data || '')))
    .sort();

  return {
    inicio: datas[0] || null,
    fim: datas[datas.length - 1] || null,
  };
};

const valorTemSinalNegativo = (valorTexto = '') => {
  const texto = String(valorTexto || '').trim();
  return texto.startsWith('-') || texto.endsWith('-');
};

const inferirTipoPorConteudo = (descricao = '', valorTexto = '') => {
  const texto = normalizarTextoBusca(`${descricao} ${valorTexto}`);

  if (
    valorTemSinalNegativo(valorTexto) ||
    DESPESA_KEYWORDS.some((termo) => texto.includes(termo))
  ) {
    return 'despesa';
  }

  if (
    valorTexto.trim().startsWith('+') ||
    RECEITA_KEYWORDS.some((termo) => texto.includes(termo))
  ) {
    return 'receita';
  }

  return valorTemSinalNegativo(valorTexto) ? 'despesa' : 'receita';
};

const normalizarTipo = (tipo, transacao = {}) => {
  const texto = normalizarTextoBusca(tipo);

  if (['receita', 'entrada', 'credito', 'credit', 'income'].includes(texto)) {
    return 'receita';
  }

  if (['despesa', 'saida', 'debito', 'debit', 'expense'].includes(texto)) {
    return 'despesa';
  }

  return inferirTipoPorConteudo(
    transacao?.descricao || transacao?.valor_original || '',
    String(transacao?.valor || ''),
  );
};

const deduplicarTransacoes = (transacoes = []) => {
  const vistas = new Set();

  return transacoes.filter((transacao) => {
    const chave = [
      transacao.data,
      transacao.descricao,
      Number(transacao.valor || 0).toFixed(2),
      transacao.tipo,
    ].join('::');

    if (vistas.has(chave)) return false;
    vistas.add(chave);
    return true;
  });
};

const limparJson = (texto = '') => {
  const semBlocos = String(texto || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const inicioObjeto = semBlocos.indexOf('{');
  const fimObjeto = semBlocos.lastIndexOf('}');
  if (inicioObjeto >= 0 && fimObjeto > inicioObjeto) {
    return semBlocos.slice(inicioObjeto, fimObjeto + 1);
  }

  const inicioArray = semBlocos.indexOf('[');
  const fimArray = semBlocos.lastIndexOf(']');
  if (inicioArray >= 0 && fimArray > inicioArray) {
    return semBlocos.slice(inicioArray, fimArray + 1);
  }

  return semBlocos;
};

const repararJson = (texto = '') =>
  String(texto || '')
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3');

const extrairTextoGemini = (payload) =>
  payload?.candidates?.[0]?.content?.parts
    ?.map((parte) => parte?.text || '')
    .join('')
    .trim() || '';

const extrairTextoChatCompletions = (payload) => {
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((parte) => {
        if (typeof parte === 'string') return parte;
        return parte?.text || '';
      })
      .join('')
      .trim();
  }

  return '';
};

const extrairTextoResposta = (providerId, payload) =>
  providerId === 'gemini'
    ? extrairTextoGemini(payload)
    : extrairTextoChatCompletions(payload);

const extrairErroDaApi = (payload) => {
  if (payload?.error?.message) return payload.error.message;
  if (payload?.promptFeedback?.blockReason) {
    return `A resposta da IA foi bloqueada: ${payload.promptFeedback.blockReason}`;
  }
  if (payload?.candidates?.length === 0 || payload?.choices?.length === 0) {
    return 'A IA nao retornou candidatos para este extrato.';
  }
  return null;
};

const contemTrecho = (mensagem, trechos) => {
  const normalizada = String(mensagem || '').toLowerCase();
  return trechos.some((trecho) => normalizada.includes(trecho));
};

const traduzirMensagemErro = (erro) => {
  const mensagem = String(erro?.message || '');

  if (erro?.status === 429 || contemTrecho(mensagem, ['quota exceeded', 'rate limit', 'free_tier_requests'])) {
    return 'Limite de requisicoes atingido. Aguarde um momento e tente novamente.';
  }

  if (erro?.status === 503) {
    return 'A analise da IA esta temporariamente indisponivel. Tente novamente em alguns instantes.';
  }

  return mensagem;
};

const quebrarLinhas = (texto = '') =>
  String(texto || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((linha) => normalizarEspacos(linha))
    .filter(Boolean);

const pareceLinhaInstitucional = (linha = '') =>
  RUIDO_EXTRATO_PATTERNS.some((pattern) => pattern.test(linha));

const pareceLinhaDeTransacao = (linha = '') => {
  const texto = normalizarTextoBusca(linha);
  if (!texto || !HAS_MONEY_REGEX.test(linha)) return false;

  return [
    'debito',
    'credito',
    'pix ',
    'liquido de vencimento',
    'remuneracao aplicacao automatica',
    'deposito',
    'saque',
    'tarifa',
    'transferencia',
    'pagamento',
  ].some((termo) => texto.includes(termo));
};

const linhaIgnoravel = (linha = '') => {
  const texto = normalizarEspacos(linha);
  if (!texto) return true;
  if (pareceLinhaInstitucional(texto)) return true;
  if (pareceLinhaDeTransacao(texto)) return false;
  return IGNORED_LINE_PATTERNS.some((pattern) => pattern.test(texto));
};

const extrairValoresMonetarios = (linha = '') =>
  [...String(linha || '').matchAll(MONEY_REGEX)].map((match) => ({
    texto: match[0],
    index: match.index ?? -1,
  }));

const removerSufixosAdministrativos = (descricao = '') =>
  String(descricao || '')
    .replace(/\s+(pendente|processado|efetivado|cancelado)\s*$/i, '')
    .replace(/\s+\d{4,}\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const limparRuidoExtrato = (descricao = '') =>
  String(descricao || '')
    .replace(/\bExtrato_PF_[A-Za-z0-9_]+\b/gi, ' ')
    .replace(/\bBALP_[A-Za-z0-9_]+\b/gi, ' ')
    .replace(/\bPagina:\s*\d+(?:\/\d+)?\b/gi, ' ')
    .replace(/\b(conta corrente|movimentacao)\b/gi, ' ')
    .replace(/\b(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\/20\d{2}\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const linhaTemData = (linha = '') => DATE_AT_START_REGEX.test(linha);

const limparTrechoContinuidade = (linha = '') => {
  const texto = normalizarEspacos(linha);

  if (linhaTemData(texto) && !HAS_MONEY_REGEX.test(texto)) {
    return texto.replace(DATE_AT_START_REGEX, '').trim();
  }

  return texto;
};

const construirBlocosTransacao = (linhas = []) => {
  const blocos = [];
  let dataCorrente = null;

  linhas.forEach((linha) => {
    if (linhaIgnoravel(linha)) return;

    const texto = normalizarEspacos(linha);
    const matchData = texto.match(DATE_AT_START_REGEX);
    const temValor = HAS_MONEY_REGEX.test(texto);

    if (matchData && temValor) {
      dataCorrente = matchData[1];
      blocos.push({ dataBase: dataCorrente, linhas: [texto] });
      return;
    }

    if (!blocos.length) return;

    if (!matchData && temValor) {
      blocos.push({ dataBase: dataCorrente, linhas: [texto] });
      return;
    }

    const atual = blocos[blocos.length - 1];
    atual.linhas.push(limparTrechoContinuidade(texto));
  });

  return blocos
    .map((bloco) => ({
      ...bloco,
      linhas: bloco.linhas.map((linha) => normalizarEspacos(linha)).filter(Boolean),
    }))
    .filter((bloco) => bloco.dataBase && bloco.linhas.length);
};

const escolherValorDaTransacao = (valores = []) => {
  if (valores.length <= 1) return valores[0] || null;

  const semSaldo = valores.slice(0, -1);
  const valoresNaoZero = semSaldo.filter((token) => Math.abs(normalizarValor(token.texto)) > 0);

  if (!valoresNaoZero.length) return semSaldo[0] || null;
  if (valoresNaoZero.length === 1) return valoresNaoZero[0];

  const negativo = valoresNaoZero.find((token) => valorTemSinalNegativo(token.texto));
  return negativo || valoresNaoZero[valoresNaoZero.length - 1];
};

const limparDescricaoTransacao = (linhas = []) => {
  if (!linhas.length) return '';

  const [primeiraLinha, ...continuacoes] = linhas;
  const base = primeiraLinha.replace(DATE_AT_START_REGEX, '').trim();

  return removerSufixosAdministrativos(limparRuidoExtrato(
    [base, ...continuacoes]
      .join(' ')
      .replace(/\b\d{6,}(?=\s+-?\d[\d.]*,\d{2}-?)/g, ' ')
      .replace(/\bCNPJ\s+\d{11,18}\b/gi, ' ')
      .replace(MONEY_REGEX, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  ));
};

const parsearBlocoTransacao = (bloco, anoReferencia) => {
  const linhaLimpa = normalizarEspacos(bloco.linhas.join(' '));
  const dataBase = bloco.dataBase || linhaLimpa.match(DATE_AT_START_REGEX)?.[1];
  if (!dataBase) return null;

  const valores = extrairValoresMonetarios(linhaLimpa);
  if (!valores.length) return null;

  const valorToken = escolherValorDaTransacao(valores);
  if (!valorToken) return null;

  const descricao = limparDescricaoTransacao(bloco.linhas);
  const data = normalizarData(dataBase, anoReferencia);
  const valor = Math.abs(normalizarValor(valorToken.texto));

  if (!data || !descricao || !Number.isFinite(valor) || valor <= 0) {
    return null;
  }

  return {
    data,
    descricao,
    valor,
    tipo: inferirTipoPorConteudo(descricao, valorToken.texto),
    valor_original: linhaLimpa,
  };
};

const construirResultadoLocal = (textoCompleto) => {
  const linhasBase = quebrarLinhas(textoCompleto);
  const blocos = construirBlocosTransacao(linhasBase);
  const anoReferencia = inferirAnoReferencia(textoCompleto);
  const transacoes = deduplicarTransacoes(
    blocos
      .map((bloco) => parsearBlocoTransacao(bloco, anoReferencia))
      .filter(Boolean),
  );
  const periodo = inferirPeriodoPorTransacoes(transacoes);

  return {
    resultado: transacoes.length ? {
      banco: inferirBanco(textoCompleto),
      periodo,
      transacoes,
      total_transacoes: transacoes.length,
      observacoes: 'Transacoes extraidas pelo parser local do extrato.',
    } : null,
    estatisticas: {
      linhasBase: linhasBase.length,
      linhasCandidatas: blocos.length,
      transacoes: transacoes.length,
    },
  };
};

const aceitarResultadoLocal = ({ resultado, estatisticas }) => {
  if (!resultado?.transacoes?.length) return false;
  if (!estatisticas.linhasCandidatas) return true;

  const taxaLeitura = resultado.transacoes.length / estatisticas.linhasCandidatas;
  if (taxaLeitura >= LOCAL_PARSE_RATIO_MIN) return true;
  return resultado.transacoes.length >= 8 || (
    resultado.transacoes.length >= LOCAL_PARSE_MIN_TRANSACTIONS &&
    taxaLeitura >= 0.35
  );
};

const compactarTextoParaIA = (textoCompleto) => {
  const blocos = construirBlocosTransacao(quebrarLinhas(textoCompleto));
  const textoCompactado = blocos
    .map((bloco) => bloco.linhas.join(' '))
    .join('\n')
    .trim();
  const fallback = quebrarLinhas(textoCompleto)
    .filter((linha) => /\d{2}[/-]\d{2}/.test(linha) || HAS_MONEY_REGEX.test(linha))
    .join('\n')
    .trim();

  const textoFinal = textoCompactado || fallback;
  return textoFinal.slice(0, AI_MAX_INPUT_CHARS);
};

const validarTransacoesNormalizadas = (transacoes = []) => {
  if (!transacoes.length) {
    return { valido: false, motivo: 'Nenhuma transacao valida foi identificada.' };
  }

  const descricoesValidas = transacoes.filter((transacao) => transacao.descricao.length >= 3).length;
  if (!descricoesValidas) {
    return { valido: false, motivo: 'A IA retornou descricoes muito incompletas.' };
  }

  return { valido: true, motivo: null };
};

const normalizarRespostaDaIA = (providerId, payload) => {
  const erroApi = extrairErroDaApi(payload);
  if (erroApi) {
    throw new Error(erroApi);
  }

  const bruto = limparJson(extrairTextoResposta(providerId, payload));
  if (!bruto) {
    throw new Error('A IA nao retornou conteudo utilizavel para este extrato.');
  }

  let json;
  try {
    json = JSON.parse(bruto);
  } catch {
    try {
      json = JSON.parse(repararJson(bruto));
    } catch {
      throw new Error('Nao foi possivel interpretar este extrato. Tente outro arquivo.');
    }
  }

  if (Array.isArray(json)) {
    json = { transacoes: json };
  }

  const transacoesBrutas = Array.isArray(json?.transacoes) ? json.transacoes : [];
  const anoReferencia = inferirAnoReferencia(
    [json?.periodo?.inicio, json?.periodo?.fim, ...transacoesBrutas.map((transacao) => transacao?.data)]
      .filter(Boolean)
      .join(' '),
  );

  const transacoes = deduplicarTransacoes(
    transacoesBrutas
      .map((transacao) => {
        const data = normalizarData(transacao?.data, anoReferencia);
        const valor = Math.abs(normalizarValor(transacao?.valor));
        const descricao = normalizarEspacos(transacao?.descricao || '');
        const valorOriginal = normalizarEspacos(
          transacao?.valor_original || transacao?.linha_original || transacao?.descricao || '',
        );

        return {
          data,
          descricao,
          valor,
          tipo: normalizarTipo(transacao?.tipo, { ...transacao, descricao, valor_original: valorOriginal }),
          valor_original: valorOriginal,
        };
      })
      .filter((transacao) =>
        transacao.data &&
        /^\d{4}-\d{2}-\d{2}$/.test(transacao.data) &&
        transacao.descricao &&
        Number.isFinite(transacao.valor) &&
        transacao.valor > 0,
      ),
  );

  const validacao = validarTransacoesNormalizadas(transacoes);
  if (!validacao.valido) {
    const erro = new Error(validacao.motivo);
    erro.provider = providerId;
    throw erro;
  }

  return {
    banco: json?.banco || inferirBanco(bruto),
    periodo: (() => {
      const periodoNormalizado = normalizarPeriodo(json?.periodo, anoReferencia);
      if (periodoNormalizado.inicio || periodoNormalizado.fim) return periodoNormalizado;
      return inferirPeriodoPorTransacoes(transacoes);
    })(),
    transacoes,
    total_transacoes: transacoes.length,
    observacoes: json?.observacoes || null,
  };
};

const chamarGemini = async (texto) => {
  let atrasoAtual = GEMINI_BACKOFF_INICIAL;

  for (let tentativa = 1; tentativa <= GEMINI_MAX_TENTATIVAS; tentativa += 1) {
    try {
      const { data } = await api.post('/ai/gemini', {
        model: GEMINI_MODEL,
        payload: {
          system_instruction: { parts: [{ text: GEMINI_SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: criarPromptExtrato(texto) }] }],
          generationConfig: { temperature: 0, responseMimeType: 'application/json' },
        },
      });
      return data;
    } catch (err) {
      const status  = err.response?.status;
      const errData = err.response?.data;

      if (status === 429) {
        throw criarErroHttp(429, extrairErroDaApi(errData) || 'Limite de requisicoes atingido no Gemini.', 'gemini');
      }

      const erro = criarErroHttp(status || 502, extrairErroDaApi(errData) || 'Falha ao processar o extrato com o Gemini.', 'gemini');

      if (!GEMINI_RETRY_STATUS.has(status) || tentativa === GEMINI_MAX_TENTATIVAS) {
        throw erro;
      }

      await esperar(atrasoAtual);
      atrasoAtual *= 2;
    }
  }

  throw new Error('Nao foi possivel processar o extrato com o Gemini.');
};

const chamarChatProvider = async ({ model, texto, providerId }) => {
  try {
    const { data } = await api.post(`/ai/${providerId}`, {
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: GEMINI_SYSTEM_PROMPT },
        { role: 'user', content: criarPromptExtrato(texto) },
      ],
    });
    return data;
  } catch (err) {
    const status  = err.response?.status;
    const errData = err.response?.data;
    throw criarErroHttp(
      status || 502,
      extrairErroDaApi(errData) || `Falha ao processar o extrato com ${PROVIDERS[providerId].nome}.`,
      providerId,
    );
  }
};

const chamarProvider = async (providerId, texto) => {
  if (providerId === 'gemini') {
    return chamarGemini(texto);
  }

  if (providerId === 'groq') {
    return chamarChatProvider({
      model: GROQ_MODEL,
      texto,
      providerId: 'groq',
    });
  }

  return chamarChatProvider({
    model: MISTRAL_MODEL,
    texto,
    providerId: 'mistral',
  });
};

const parsearEmLotes = async (provider, linhas, apiKey) => {
  const lotes = [];
  for (let index = 0; index < linhas.length; index += AI_CHUNK_SIZE) {
    lotes.push(linhas.slice(index, index + AI_CHUNK_SIZE).join('\n'));
  }

  const transacoes = [];
  for (let index = 0; index < lotes.length; index += 1) {
    const resposta = await chamarProvider(provider.id, lotes[index]);
    const normalizada = normalizarRespostaDaIA(provider.id, resposta);
    transacoes.push(...normalizada.transacoes);

    if (provider.delayLoteMs && index < lotes.length - 1) {
      await esperar(provider.delayLoteMs);
    }
  }

  const deduplicadas = deduplicarTransacoes(transacoes);
  const validacao = validarTransacoesNormalizadas(deduplicadas);
  if (!validacao.valido) {
    throw new Error(validacao.motivo);
  }

  return {
    banco: null,
    periodo: { inicio: null, fim: null },
    transacoes: deduplicadas,
    total_transacoes: deduplicadas.length,
    observacoes: null,
  };
};

const processarComProvider = async (provider, textoCompactado) => {
  const linhas = textoCompactado.split('\n').filter((linha) => linha.trim());

  if (linhas.length <= AI_SINGLE_CALL_LINE_LIMIT) {
    const resposta = await chamarProvider(provider.id, textoCompactado);
    return normalizarRespostaDaIA(provider.id, resposta);
  }

  return parsearEmLotes(provider, linhas);
};

const tentarProvider = async (provider, textoCompactado, erros) => {
  try {
    return await processarComProvider(provider, textoCompactado);
  } catch (error) {
    error.provider = error.provider || provider.id;
    erros.push(error);
    return null;
  }
};

const criarErroFinal = (erros) => {
  const erroMistral = erros.findLast((erro) => erro?.provider === 'mistral');
  const erroGroq = erros.findLast((erro) => erro?.provider === 'groq');
  const erroGemini = erros.findLast((erro) => erro?.provider === 'gemini');
  const erroPrincipal = erroMistral || erroGroq || erroGemini || erros[erros.length - 1];

  if (erroPrincipal?.code === 'MISSING_API_KEY') {
    return new Error(
      'Chaves de IA não configuradas no servidor. Configure GEMINI_API_KEY, GROQ_API_KEY ou MISTRAL_API_KEY no backend.',
    );
  }

  return new Error(
    traduzirMensagemErro(erroPrincipal) || 'Nao foi possivel retornar a analise da IA.',
  );
};

const enriquecerObservacaoLocal = (observacaoAtual = '') => {
  if (!observacaoAtual) {
    return 'Parser local aplicado como fallback por confiabilidade e desempenho.';
  }

  return `${observacaoAtual} Parser local aplicado como fallback por confiabilidade e desempenho.`;
};

export const parseBankStatement = async (textoExtraido) => {
  const textoCompleto = String(textoExtraido || '').trim();
  if (!textoCompleto) {
    throw new Error('Nenhuma transacao identificada neste extrato');
  }

  const resultadoLocal = construirResultadoLocal(textoCompleto);
  if (aceitarResultadoLocal(resultadoLocal)) {
    return resultadoLocal.resultado;
  }

  const fallbackLocal = resultadoLocal.resultado;
  const textoCompactado = compactarTextoParaIA(textoCompleto);
  if (!textoCompactado) {
    if (fallbackLocal?.transacoes?.length) {
      return {
        ...fallbackLocal,
        observacoes: enriquecerObservacaoLocal(fallbackLocal.observacoes),
      };
    }

    throw new Error('Nenhuma transacao identificada neste extrato');
  }

  const erros = [];

  let resultado = await tentarProvider(PROVIDERS.gemini, textoCompactado, erros);

  if (!resultado) {
    const erroGemini = erros.findLast((erro) => erro?.provider === 'gemini');

    if (erroGemini?.status === 429) {
      resultado = await tentarProvider(PROVIDERS.groq, textoCompactado, erros);
    }

    if (!resultado) {
      resultado = await tentarProvider(PROVIDERS.mistral, textoCompactado, erros);
    }
  }

  if (resultado?.transacoes?.length) {
    return {
      ...resultado,
      total_transacoes: resultado.transacoes.length,
    };
  }

  if (fallbackLocal?.transacoes?.length) {
    return {
      ...fallbackLocal,
      observacoes: enriquecerObservacaoLocal(fallbackLocal.observacoes),
    };
  }

  throw criarErroFinal(erros);
};
