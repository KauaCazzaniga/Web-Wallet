import { describe, it, expect } from 'vitest';
import { resolveCatDisplay, CAT_ICONS, CATS } from './dashboardUtils';

// ── CAT_ICONS ─────────────────────────────────────────────────────────────────

describe('CAT_ICONS', () => {
  it('inclui "Assinaturas Online" com ícone 📱', () => {
    expect(CAT_ICONS['Assinaturas Online']).toBe('📱');
  });

  it('CATS inclui "Assinaturas Online"', () => {
    expect(CATS).toContain('Assinaturas Online');
  });
});

// ── resolveCatDisplay ─────────────────────────────────────────────────────────

describe('resolveCatDisplay', () => {
  it('resolve assinaturas.netflix → label "Assinaturas Online" e ícone 📱', () => {
    const r = resolveCatDisplay('assinaturas.netflix');
    expect(r.label).toBe('Assinaturas Online');
    expect(r.icon).toBe('📱');
  });

  it('resolve assinaturas.spotify → "Assinaturas Online"', () => {
    const r = resolveCatDisplay('assinaturas.spotify');
    expect(r.label).toBe('Assinaturas Online');
    expect(r.icon).toBe('📱');
  });

  it('resolve qualquer assinaturas.* → "Assinaturas Online"', () => {
    ['assinaturas.disneyplus', 'assinaturas.max', 'assinaturas.outros'].forEach(cat => {
      const r = resolveCatDisplay(cat);
      expect(r.label).toBe('Assinaturas Online');
      expect(r.icon).toBe('📱');
    });
  });

  it('resolve gastos_fixos.aluguel → label e ícone corretos', () => {
    const r = resolveCatDisplay('gastos_fixos.aluguel');
    expect(r.label).toBe('Aluguel / Financiamento');
    expect(r.icon).toBe('🏠');
  });

  it('resolve gastos_fixos.energia corretamente', () => {
    const r = resolveCatDisplay('gastos_fixos.energia');
    expect(r.label).toBe('Energia elétrica');
    expect(r.icon).toBe('💡');
  });

  it('resolve categorias regulares corretamente', () => {
    expect(resolveCatDisplay('Alimentação').label).toBe('Alimentação');
    expect(resolveCatDisplay('Alimentação').icon).toBe('🍔');
    expect(resolveCatDisplay('Transporte').icon).toBe('🚗');
    expect(resolveCatDisplay('Lazer').icon).toBe('🎉');
  });

  it('usa ícone fallback 📦 para categoria desconhecida', () => {
    const r = resolveCatDisplay('CategoriaEstranha');
    expect(r.label).toBe('CategoriaEstranha');
    expect(r.icon).toBe('📦');
  });
});
