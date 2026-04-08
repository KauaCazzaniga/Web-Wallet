const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export const GEMINI_SYSTEM_PROMPT = `Você é um parser especializado em extratos bancários brasileiros.
Sua única função é extrair transações e retornar JSON válido.
Nunca explique. Nunca adicione texto fora do JSON.

Analise o extrato e retorne EXATAMENTE neste formato:
{
  "banco": "nome do banco ou null",
  "periodo": { "inicio": "YYYY-MM-DD ou null", "fim": "YYYY-MM-DD ou null" },
  "transacoes": [
    {
      "data": "YYYY-MM-DD",
      "descricao": "descrição limpa e legível",
      "valor": 0.00,
      "tipo": "receita | despesa",
      "valor_original": "texto exato do extrato"
    }
  ],
  "total_transacoes": 0,
  "observacoes": "inconsistências encontradas ou null"
}

REGRAS:
- Ignore saldos, cabeçalhos, rodapés e totais
- Débito / pagamento / compra / saque = despesa (valor negativo)
- Crédito / depósito / salário / pix recebido = receita (valor positivo)
- Normalize valores: "1.250,00" → 1250.00
- Se a data estiver incompleta, infira pelo contexto do extrato`;

const limparJson = (texto = '') => {
  const semBlocos = String(texto || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const inicio = semBlocos.indexOf('{');
  const fim = semBlocos.lastIndexOf('}');

  if (inicio >= 0 && fim > inicio) {
    return semBlocos.slice(inicio, fim + 1);
  }

  return semBlocos;
};

const extrairTextoResposta = (payload) =>
  payload?.candidates?.[0]?.content?.parts
    ?.map((parte) => parte?.text || '')
    .join('')
    .trim() || '';

const extrairErroDaApi = (payload) => {
  if (payload?.error?.message) return payload.error.message;
  if (payload?.promptFeedback?.blockReason) {
    return `A resposta da IA foi bloqueada: ${payload.promptFeedback.blockReason}`;
  }
  if (payload?.candidates?.length === 0) {
    return 'A IA não retornou candidatos para este extrato.';
  }
  return null;
};

const normalizarValor = (valor) => {
  if (typeof valor === 'number') return valor;
  if (typeof valor !== 'string') return Number(valor || 0);

  return Number(
    valor
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, ''),
  );
};

const normalizarResposta = (data) => {
  const erroApi = extrairErroDaApi(data);
  if (erroApi) {
    throw new Error(erroApi);
  }

  const bruto = limparJson(extrairTextoResposta(data));
  if (!bruto) {
    throw new Error('A IA não retornou conteúdo utilizável para este extrato.');
  }

  const json = JSON.parse(bruto);
  const transacoes = Array.isArray(json?.transacoes) ? json.transacoes : [];

  return {
    banco: json?.banco || null,
    periodo: {
      inicio: json?.periodo?.inicio || null,
      fim: json?.periodo?.fim || null,
    },
    transacoes: transacoes
      .map((transacao) => ({
        data: String(transacao?.data || '').slice(0, 10),
        descricao: String(transacao?.descricao || '').trim(),
        valor: Math.abs(normalizarValor(transacao?.valor)),
        tipo: transacao?.tipo === 'receita' ? 'receita' : 'despesa',
        valor_original: String(transacao?.valor_original || '').trim(),
      }))
      .filter((transacao) =>
        transacao.data &&
        /^\d{4}-\d{2}-\d{2}$/.test(transacao.data) &&
        transacao.descricao &&
        Number.isFinite(transacao.valor),
      ),
    total_transacoes: Number(json?.total_transacoes || 0),
    observacoes: json?.observacoes || null,
  };
};

const chamarGemini = async (texto, apiKey) => {
  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: GEMINI_SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: texto }],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(extrairErroDaApi(data) || 'Falha ao processar o extrato com a IA.');
  }

  return data;
};

export const parseBankStatement = async (
  textoExtraido,
  apiKey = import.meta.env.VITE_GEMINI_API_KEY,
) => {
  if (!apiKey) {
    throw new Error('Configure VITE_GEMINI_API_KEY para usar a importação de extratos.');
  }

  let ultimaFalha = null;

  for (let tentativa = 0; tentativa < 2; tentativa += 1) {
    try {
      const resposta = await chamarGemini(textoExtraido, apiKey);
      const normalizada = normalizarResposta(resposta);

      if (!normalizada.transacoes.length) {
        throw new Error('Nenhuma transação identificada neste extrato');
      }

      return {
        ...normalizada,
        total_transacoes: normalizada.transacoes.length,
      };
    } catch (error) {
      ultimaFalha = error;

      const mensagem = String(error?.message || '');
      if (
        tentativa === 1 ||
        mensagem.includes('VITE_GEMINI_API_KEY') ||
        mensagem.includes('bloqueada') ||
        mensagem.includes('API key') ||
        mensagem.includes('permission') ||
        mensagem.includes('quota')
      ) {
        break;
      }
    }
  }

  if (ultimaFalha?.message === 'Nenhuma transação identificada neste extrato') {
    throw ultimaFalha;
  }

  throw new Error(ultimaFalha?.message || 'Não foi possível retornar a análise da IA.');
};
