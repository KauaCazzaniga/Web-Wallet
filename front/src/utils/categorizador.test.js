import { describe, it, expect } from 'vitest';
import { gerarChaveTransacao, resolverCategoria, sugerirCategoria, CATEGORIAS_IMPORTACAO } from './categorizador';

describe('gerarChaveTransacao', () => {
  it('gera chave com formato data::valor::descricao', () => {
    const chave = gerarChaveTransacao({ data: '2024-01-15', valor: 100, descricao: 'Mercado' });
    expect(chave).toBe('2024-01-15::100.00::mercado');
  });

  it('normaliza acentos na descrição', () => {
    const a = gerarChaveTransacao({ data: '2024-01-15', valor: 50, descricao: 'Farmácia Drogasil' });
    const b = gerarChaveTransacao({ data: '2024-01-15', valor: 50, descricao: 'Farmacia Drogasil' });
    expect(a).toBe(b);
  });

  it('é case-insensitive', () => {
    const a = gerarChaveTransacao({ data: '2024-02-01', valor: 200, descricao: 'UBER' });
    const b = gerarChaveTransacao({ data: '2024-02-01', valor: 200, descricao: 'uber' });
    expect(a).toBe(b);
  });

  it('torna valor negativo igual ao positivo (abs)', () => {
    const a = gerarChaveTransacao({ data: '2024-03-10', valor: -300, descricao: 'Aluguel' });
    const b = gerarChaveTransacao({ data: '2024-03-10', valor: 300, descricao: 'Aluguel' });
    expect(a).toBe(b);
  });

  it('trunca data para YYYY-MM-DD', () => {
    const a = gerarChaveTransacao({ data: '2024-04-05T12:00:00Z', valor: 10, descricao: 'Café' });
    const b = gerarChaveTransacao({ data: '2024-04-05', valor: 10, descricao: 'Café' });
    expect(a).toBe(b);
  });

  it('produz chaves diferentes para transações distintas', () => {
    const a = gerarChaveTransacao({ data: '2024-01-01', valor: 100, descricao: 'Padaria' });
    const b = gerarChaveTransacao({ data: '2024-01-01', valor: 101, descricao: 'Padaria' });
    const c = gerarChaveTransacao({ data: '2024-01-02', valor: 100, descricao: 'Padaria' });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });

  it('lida com valores falsy sem lançar', () => {
    expect(() => gerarChaveTransacao({ data: null, valor: null, descricao: null })).not.toThrow();
    expect(() => gerarChaveTransacao({})).not.toThrow();
  });
});

// ── resolverCategoria ─────────────────────────────────────────────────────────

describe('resolverCategoria', () => {
  it('retorna "Assinaturas Online" para assinaturas.netflix', () => {
    expect(resolverCategoria('assinaturas.netflix')).toBe('Assinaturas Online');
  });

  it('retorna "Assinaturas Online" para qualquer assinaturas.*', () => {
    ['assinaturas.spotify', 'assinaturas.disneyplus', 'assinaturas.max',
     'assinaturas.amazonprime', 'assinaturas.chatgptplus', 'assinaturas.outros']
      .forEach(cat => expect(resolverCategoria(cat)).toBe('Assinaturas Online'));
  });

  it('retorna label legível para gastos_fixos.aluguel', () => {
    expect(resolverCategoria('gastos_fixos.aluguel')).toBe('Aluguel / Financiamento');
  });

  it('retorna label legível para gastos_fixos.energia', () => {
    expect(resolverCategoria('gastos_fixos.energia')).toBe('Energia elétrica');
  });

  it('retorna categoria inalterada para categorias regulares', () => {
    expect(resolverCategoria('Alimentação')).toBe('Alimentação');
    expect(resolverCategoria('Transporte')).toBe('Transporte');
    expect(resolverCategoria('Assinaturas Online')).toBe('Assinaturas Online');
  });

  it('retorna string vazia para entrada falsy', () => {
    expect(resolverCategoria(null)).toBe('');
    expect(resolverCategoria(undefined)).toBe('');
    expect(resolverCategoria('')).toBe('');
  });
});

// ── CATEGORIAS_IMPORTACAO ─────────────────────────────────────────────────────

describe('CATEGORIAS_IMPORTACAO', () => {
  it('contém "Assinaturas Online" como entrada única de assinatura', () => {
    expect(CATEGORIAS_IMPORTACAO).toContain('Assinaturas Online');
  });

  it('não contém nenhuma entrada assinaturas.*', () => {
    expect(CATEGORIAS_IMPORTACAO.filter(c => c.startsWith('assinaturas.'))).toHaveLength(0);
  });

  it('ainda contém categorias regulares e gastos_fixos.*', () => {
    expect(CATEGORIAS_IMPORTACAO).toContain('Alimentação');
    expect(CATEGORIAS_IMPORTACAO).toContain('gastos_fixos.aluguel');
    expect(CATEGORIAS_IMPORTACAO).toContain('gastos_fixos.energia');
  });
});

// ── sugerirCategoria — streaming ──────────────────────────────────────────────

describe('sugerirCategoria — serviços de streaming', () => {
  const casos = [
    ['Netflix',              'NETFLIX.COM'],
    ['Spotify',              'Spotify Premium'],
    ['Amazon Prime',         'Amazon Prime Video'],
    ['Disney+',              'Disney+ assinatura mensal'],
    ['HBO Max',              'hbo max plano'],
    ['YouTube Premium',      'YouTube Premium recorrente'],
    ['Apple Music',          'APPLE MUSIC'],
    ['ChatGPT / OpenAI',     'ChatGPT Plus OpenAI'],
    ['Adobe Creative Cloud', 'adobe creative cloud'],
    ['Google One',           'Google One armazenamento'],
    ['Globoplay',            'Globoplay mensal'],
    ['Deezer',               'deezer premium'],
  ];

  casos.forEach(([nome, descricao]) => {
    it(`sugere "Assinaturas Online" para ${nome}`, () => {
      expect(sugerirCategoria(descricao)).toBe('Assinaturas Online');
    });
  });

  it('não sugere "Assinaturas Online" para gastos_fixos', () => {
    expect(sugerirCategoria('conta de luz CPFL')).not.toBe('Assinaturas Online');
    expect(sugerirCategoria('aluguel mensal')).not.toBe('Assinaturas Online');
  });
});

// ── lógica de agrupamento gastosAtuais (replica Dashboard.jsx) ────────────────

describe('lógica de agrupamento gastosAtuais', () => {
  const agrupar = (transacoes) => {
    const result = {};
    transacoes.forEach(t => {
      if (t.tipo === 'despesa') {
        const cat = String(t.categoria || '').startsWith('assinaturas.')
          ? 'Assinaturas Online'
          : t.categoria;
        result[cat] = (result[cat] || 0) + Number(t.valor || 0);
      }
    });
    return result;
  };

  it('agrupa netflix + spotify sob "Assinaturas Online"', () => {
    const txs = [
      { tipo: 'despesa', categoria: 'assinaturas.netflix', valor: 39.90 },
      { tipo: 'despesa', categoria: 'assinaturas.spotify', valor: 21.90 },
      { tipo: 'despesa', categoria: 'Alimentação',         valor: 150.00 },
    ];
    const r = agrupar(txs);
    expect(r['Assinaturas Online']).toBeCloseTo(61.80);
    expect(r['Alimentação']).toBeCloseTo(150.00);
    expect(r['assinaturas.netflix']).toBeUndefined();
    expect(r['assinaturas.spotify']).toBeUndefined();
  });

  it('mantém gastos_fixos.* como chaves originais (gfGastos não quebra)', () => {
    const txs = [
      { tipo: 'despesa', categoria: 'gastos_fixos.aluguel', valor: 1500.00 },
      { tipo: 'despesa', categoria: 'assinaturas.netflix',  valor: 39.90 },
    ];
    const r = agrupar(txs);
    expect(r['gastos_fixos.aluguel']).toBeCloseTo(1500.00);
    expect(r['Assinaturas Online']).toBeCloseTo(39.90);
  });

  it('ignora receitas no agrupamento', () => {
    const txs = [
      { tipo: 'receita', categoria: 'Salário',             valor: 5000.00 },
      { tipo: 'despesa', categoria: 'assinaturas.netflix', valor: 39.90 },
    ];
    const r = agrupar(txs);
    expect(r['Salário']).toBeUndefined();
    expect(r['Assinaturas Online']).toBeCloseTo(39.90);
  });
});
