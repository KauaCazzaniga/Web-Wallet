import { describe, it, expect } from 'vitest';
import { gerarChaveTransacao } from './categorizador';

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
