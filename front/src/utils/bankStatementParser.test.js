import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseBankStatement } from './bankStatementParser';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { post: vi.fn() },
}));

// ── Respostas mock ──────────────────────────────────────────────────────────

const TRANSACAO_VALIDA = {
  data: '2026-01-06',
  descricao: 'COMPRA SUPERMERCADO',
  valor: 250.00,
  tipo: 'despesa',
  valor_original: '06/01 COMPRA SUPERMERCADO 250,00',
};

const respGroq = () => ({
  choices: [{ message: { content: JSON.stringify({
    banco: 'Banco Teste',
    periodo: { inicio: '2026-01-01', fim: '2026-01-31' },
    transacoes: [TRANSACAO_VALIDA],
    total_transacoes: 1,
    observacoes: null,
  }) } }],
});

const respGemini = () => ({
  candidates: [{ content: { parts: [{ text: JSON.stringify({
    banco: 'Banco Teste',
    periodo: { inicio: '2026-01-01', fim: '2026-01-31' },
    transacoes: [TRANSACAO_VALIDA],
    total_transacoes: 1,
    observacoes: null,
  }) }] } }],
});

// ── Entradas de teste ────────────────────────────────────────────────────────

// Texto com apenas 1 transação detectável em 6 blocos candidatos.
// taxaLeitura = 1/6 ≈ 0.17 < 0.35 → aceitarResultadoLocal retorna false → força chamadas de IA.
// compactarTextoParaIA retorna texto não vazio (todas as linhas têm data + valor).
const TEXTO_AMBIGUO = [
  '01/01 150,00',               // sem descrição → descricao vazia → null
  '02/01 0,00',                 // valor zero → null
  '03/01 0,00',
  '04/01 0,00',
  '05/01 0,00',
  '06/01 COMPRA SUPERMERCADO 250,00',  // válida
].join('\n');

// Texto com muitas transações claras → parser local é suficiente.
const TEXTO_SANTANDER = [
  '01/12 DEBITO VISA ELECTRON 49,90- SALDO 450,10',
  '02/12 PIX RECEBIDO SALARIO 3000,00 SALDO 3450,10',
  '03/12 COMPRA SUPERMERCADO 150,00- SALDO 3300,10',
  '04/12 PAGAMENTO BOLETO 200,00- SALDO 3100,10',
  '05/12 COMPRA FARMACIA 80,00- SALDO 3020,10',
  '06/12 COMPRA RESTAURANTE 60,00- SALDO 2960,10',
  '07/12 PIX ENVIADO ALUGUEL 1200,00- SALDO 1760,10',
  '08/12 COMPRA COMBUSTIVEL 120,00- SALDO 1640,10',
].join('\n');

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Texto vazio ──────────────────────────────────────────────────────────────

describe('parseBankStatement — texto vazio ou invalido', () => {
  it('lanca erro para string vazia', async () => {
    await expect(parseBankStatement('')).rejects.toThrow('Nenhuma transacao identificada neste extrato');
  });

  it('lanca erro para undefined', async () => {
    await expect(parseBankStatement(undefined)).rejects.toThrow('Nenhuma transacao identificada neste extrato');
  });

  it('nao chama nenhuma API quando texto e vazio', async () => {
    await expect(parseBankStatement('')).rejects.toThrow();
    expect(api.post).not.toHaveBeenCalled();
  });
});

// ── Parser local suficiente ──────────────────────────────────────────────────

describe('parseBankStatement — parser local suficiente', () => {
  it('retorna resultado sem chamar API quando parser local tem confianca alta', async () => {
    const resultado = await parseBankStatement(TEXTO_SANTANDER);

    expect(api.post).not.toHaveBeenCalled();
    expect(resultado.transacoes.length).toBeGreaterThan(0);
  });

  it('resultado local possui campos esperados', async () => {
    const resultado = await parseBankStatement(TEXTO_SANTANDER);

    expect(resultado).toMatchObject({
      transacoes: expect.arrayContaining([
        expect.objectContaining({
          data: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          descricao: expect.any(String),
          valor: expect.any(Number),
          tipo: expect.stringMatching(/^(receita|despesa)$/),
        }),
      ]),
    });
  });
});

// ── Fallback de providers ────────────────────────────────────────────────────

describe('parseBankStatement — cadeia de fallback', () => {
  it('tenta Groq quando Gemini falha com erro nao-429 (comportamento novo)', async () => {
    api.post.mockImplementation((url) => {
      if (url.includes('gemini')) {
        return Promise.reject({ response: { status: 500, data: { error: 'Internal Server Error' } } });
      }
      return Promise.resolve({ data: respGroq() });
    });

    const resultado = await parseBankStatement(TEXTO_AMBIGUO);

    const urls = api.post.mock.calls.map(([url]) => url);
    expect(urls).toContain('/ai/gemini');
    expect(urls).toContain('/ai/groq');
    expect(resultado.transacoes.length).toBeGreaterThan(0);
  });

  it('tenta Groq quando Gemini falha com 429', async () => {
    api.post.mockImplementation((url) => {
      if (url.includes('gemini')) {
        return Promise.reject({ response: { status: 429, data: { error: 'Rate limit' } } });
      }
      return Promise.resolve({ data: respGroq() });
    });

    const resultado = await parseBankStatement(TEXTO_AMBIGUO);

    const urls = api.post.mock.calls.map(([url]) => url);
    expect(urls).toContain('/ai/groq');
    expect(resultado.transacoes.length).toBeGreaterThan(0);
  });

  it('nao chama Mistral quando Groq tem sucesso', async () => {
    api.post.mockImplementation((url) => {
      if (url.includes('gemini')) {
        return Promise.reject({ response: { status: 500, data: {} } });
      }
      if (url.includes('groq')) {
        return Promise.resolve({ data: respGroq() });
      }
      return Promise.resolve({ data: respGroq() });
    });

    await parseBankStatement(TEXTO_AMBIGUO);

    const urls = api.post.mock.calls.map(([url]) => url);
    expect(urls).not.toContain('/ai/mistral');
  });

  it('tenta Mistral quando Gemini e Groq falham', async () => {
    const respMistral = {
      choices: [{ message: { content: JSON.stringify({
        transacoes: [TRANSACAO_VALIDA],
      }) } }],
    };

    api.post.mockImplementation((url) => {
      if (url.includes('gemini') || url.includes('groq')) {
        return Promise.reject({ response: { status: 500, data: {} } });
      }
      return Promise.resolve({ data: respMistral });
    });

    const resultado = await parseBankStatement(TEXTO_AMBIGUO);

    const urls = api.post.mock.calls.map(([url]) => url);
    expect(urls).toContain('/ai/mistral');
    expect(resultado.transacoes.length).toBeGreaterThan(0);
  });

  it('nao chama Groq nem Mistral quando Gemini tem sucesso', async () => {
    api.post.mockResolvedValue({ data: respGemini() });

    await parseBankStatement(TEXTO_AMBIGUO);

    const urls = api.post.mock.calls.map(([url]) => url);
    expect(urls).not.toContain('/ai/groq');
    expect(urls).not.toContain('/ai/mistral');
  });

  it('retorna fallback local quando todos os providers falham mas parser local tem dados', async () => {
    api.post.mockRejectedValue({ response: { status: 502, data: {} } });

    // TEXTO_AMBIGUO tem 1 transação detectada pelo parser local
    const resultado = await parseBankStatement(TEXTO_AMBIGUO);

    expect(resultado.transacoes).toBeDefined();
    expect(resultado.transacoes.length).toBeGreaterThanOrEqual(1);
    // Observação indica que foi o parser local como fallback
    expect(resultado.observacoes).toContain('parser local');
  });
});
