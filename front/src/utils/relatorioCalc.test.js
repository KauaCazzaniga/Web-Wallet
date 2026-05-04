import { describe, it, expect } from 'vitest';
import {
  formatCurrencyBRL,
  listMonthsBetween,
  processarMeses,
  shiftMonthKey,
} from './relatorioCalc';

// ── formatCurrencyBRL ────────────────────────────────────────────────────────
describe('formatCurrencyBRL', () => {
  it('formata inteiro', () => {
    expect(formatCurrencyBRL(1000)).toMatch(/1\.000,00/);
  });

  it('arredonda float impreciso (0.1 + 0.2)', () => {
    expect(formatCurrencyBRL(0.1 + 0.2)).toBe(formatCurrencyBRL(0.3));
  });

  it('formata zero', () => {
    expect(formatCurrencyBRL(0)).toMatch(/0,00/);
  });

  it('formata negativo', () => {
    expect(formatCurrencyBRL(-50)).toMatch(/-.*50/);
  });

  it('aceita null/undefined sem lançar', () => {
    expect(() => formatCurrencyBRL(null)).not.toThrow();
    expect(() => formatCurrencyBRL(undefined)).not.toThrow();
  });
});

// ── listMonthsBetween ────────────────────────────────────────────────────────
describe('listMonthsBetween', () => {
  it('retorna array com meses no intervalo', () => {
    expect(listMonthsBetween('2024-01', '2024-03')).toEqual(['2024-01', '2024-02', '2024-03']);
  });

  it('retorna 1 elemento quando inicio == fim', () => {
    expect(listMonthsBetween('2024-06', '2024-06')).toEqual(['2024-06']);
  });

  it('retorna array mesmo quando inicio > fim (inverte)', () => {
    const result = listMonthsBetween('2024-03', '2024-01');
    expect(result).toEqual(['2024-01', '2024-02', '2024-03']);
  });

  it('retorna [] para strings inválidas', () => {
    expect(listMonthsBetween('', '')).toEqual([]);
    expect(listMonthsBetween(null, null)).toEqual([]);
  });

  it('atravessa virada de ano corretamente', () => {
    const result = listMonthsBetween('2023-11', '2024-02');
    expect(result).toEqual(['2023-11', '2023-12', '2024-01', '2024-02']);
  });
});

// ── shiftMonthKey ────────────────────────────────────────────────────────────
describe('shiftMonthKey', () => {
  it('avança meses', () => {
    expect(shiftMonthKey('2024-01', 2)).toBe('2024-03');
  });

  it('volta meses', () => {
    expect(shiftMonthKey('2024-03', -2)).toBe('2024-01');
  });

  it('atravessa virada de ano', () => {
    expect(shiftMonthKey('2023-12', 1)).toBe('2024-01');
    expect(shiftMonthKey('2024-01', -1)).toBe('2023-12');
  });
});

// ── processarMeses ───────────────────────────────────────────────────────────
describe('processarMeses', () => {
  const txReceita = (data, valor) => ({ data, valor, tipo: 'receita', categoria: 'Salário' });
  const txDespesa = (data, valor) => ({ data, valor, tipo: 'despesa', categoria: 'Alimentação' });

  it('retorna um item por mês no intervalo', () => {
    const result = processarMeses([], '2024-01', '2024-03');
    expect(result).toHaveLength(3);
    expect(result[0].mes).toBe('2024-01');
    expect(result[2].mes).toBe('2024-03');
  });

  it('agrega receitas e despesas corretamente', () => {
    const transacoes = [
      txReceita('2024-01-10', 3000),
      txDespesa('2024-01-15', 1500),
      txDespesa('2024-01-20', 500),
    ];
    const [jan] = processarMeses(transacoes, '2024-01', '2024-01');
    expect(jan.receita).toBe(3000);
    expect(jan.despesa).toBe(2000);
    expect(jan.saldo).toBe(1000);
  });

  it('primeiro mês não tem variação (varReceita e varDespesa são null)', () => {
    const transacoes = [txReceita('2024-01-10', 1000)];
    const [jan] = processarMeses(transacoes, '2024-01', '2024-02');
    expect(jan.varReceita).toBeNull();
    expect(jan.varDespesa).toBeNull();
    expect(jan.mesAnteriorLabel).toBeNull();
  });

  it('calcula variação percentual corretamente', () => {
    const transacoes = [
      txReceita('2024-01-10', 1000),
      txReceita('2024-02-10', 1500),
    ];
    const [, fev] = processarMeses(transacoes, '2024-01', '2024-02');
    expect(fev.varReceita).toBe(50); // +50%
  });

  it('acumula saldo entre meses', () => {
    const transacoes = [
      txReceita('2024-01-10', 1000),
      txReceita('2024-02-10', 500),
    ];
    const result = processarMeses(transacoes, '2024-01', '2024-02');
    expect(result[0].saldoAcumulado).toBe(1000);
    expect(result[1].saldoAcumulado).toBe(1500);
  });

  it('mês sem transações tem receita=0, despesa=0, saldo=0', () => {
    const result = processarMeses([], '2024-05', '2024-05');
    const [mai] = result;
    expect(mai.receita).toBe(0);
    expect(mai.despesa).toBe(0);
    expect(mai.saldo).toBe(0);
  });

  it('ignora transações fora do intervalo', () => {
    const transacoes = [txReceita('2024-03-10', 9999)];
    const result = processarMeses(transacoes, '2024-01', '2024-02');
    expect(result.every((m) => m.receita === 0)).toBe(true);
  });

  it('retorna lista vazia para intervalo inválido', () => {
    expect(processarMeses([], '', '')).toEqual([]);
  });
});
