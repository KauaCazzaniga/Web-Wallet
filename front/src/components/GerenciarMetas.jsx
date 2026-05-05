// Componente: GerenciarMetas
// Responsabilidade: modal de gerenciamento de metas de gastos por categoria e gastos fixos
// Depende de: useFinance, gastosFixos, api

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { X, Trash2, Plus, Sparkles } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { GASTOS_FIXOS, GASTOS_FIXOS_PREFIX } from '../constants/gastosFixos';
import api from '../services/api';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const ModalOverlay = styled.div`
  position: fixed; inset: 0; background-color: rgba(15,23,42,0.7);
  display: flex; align-items: center; justify-content: center; z-index: 100;
`;
const ModalContent = styled.div`
  background: var(--dash-surface); padding: 2rem; border-radius: 1rem;
  width: 100%; max-width: 450px;
  max-height: 90vh; overflow-y: auto;
  border: 1px solid var(--dash-border);
  box-shadow: var(--dash-shadow); animation: ${fadeIn} 0.2s ease;
`;
const ModalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;
  h3 { font-size: 1.125rem; font-weight: 600; color: var(--dash-heading); }
  button { background: none; border: none; cursor: pointer; color: var(--dash-muted); padding: 0.25rem; border-radius: 0.25rem; &:hover { color: var(--dash-heading); } }
`;
const ModalFooter = styled.div`
  display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;
  button {
    padding: 0.5rem 1.25rem; border-radius: 0.5rem; font-weight: 500;
    cursor: pointer; border: none; font-size: 0.875rem; transition: all 0.15s;
  }
  .cancel { background: var(--dash-surface-muted); color: var(--dash-text); &:hover { filter: brightness(1.04); } }
  .save   { background: linear-gradient(135deg, #06b6d4 0%, var(--dash-primary) 52%, #4f46e5 100%); color: #fff; &:hover { filter: brightness(1.05); } }
`;
const GoalItem = styled.div`
  display: flex; align-items: center; gap: 12px; width: 100%;
  padding: 0.85rem 1rem; background: var(--dash-surface-muted); border: 1px solid var(--dash-border);
  border-radius: 0.75rem; margin-bottom: 0.65rem;
  box-shadow: var(--dash-soft-shadow);
  .goal-info {
    display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; justify-content: space-between; width: 100%;
  }
  span { font-size: 0.95rem; white-space: nowrap; color: var(--dash-heading); }
  input {
    width: 7rem; padding: 0.6rem 0.8rem; border: 1px solid var(--dash-border-strong);
    border-radius: 0.625rem; font-size: 0.875rem; outline: none; background: var(--dash-input-bg);
    color: var(--dash-heading); -webkit-text-fill-color: var(--dash-heading); flex-shrink: 0;
    &:focus { border-color: var(--dash-primary); box-shadow: 0 0 0 3px rgba(59,130,246,0.14); }
  }
  button { color: #ef4444; border: none; background: none; cursor: pointer; padding: 0.35rem; border-radius: 0.375rem; flex-shrink: 0; &:hover { background: #fef2f2; } }
`;
const FormGroup = styled.div`
  display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.875rem;
  label { font-size: 0.75rem; font-weight: 600; color: var(--dash-muted-strong); text-transform: uppercase; letter-spacing: 0.03em; }
  select {
    padding: 0.7rem 0.875rem; border: 1px solid var(--dash-border); border-radius: 0.5rem;
    font-size: 0.875rem; outline: none; background: var(--dash-input-bg); transition: all 0.15s;
    color: var(--dash-heading); -webkit-text-fill-color: var(--dash-heading); appearance: none;
    &:focus { border-color: var(--dash-primary); background: var(--dash-surface); box-shadow: 0 0 0 3px rgba(59,130,246,0.14); }
    option { color: var(--dash-heading); background: var(--dash-surface); }
  }
`;

const competenciaHoje = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
};

const CAT_ICONS = {
  "Alimentação": "🍔", "Transporte": "🚗",
  "Lazer": "🎉", "Saúde": "💊", "Salário": "💰", "Investimentos": "📈", "Outros": "📦",
};
const CATS = Object.keys(CAT_ICONS);

/**
 * @param {{ mesSelecionado: string, notify: (msg: string, type?: string) => void }} props
 */
export default function GerenciarMetas({ mesSelecionado, notify }) {
  const { metas, gastosFixosMetas, salvarMetas } = useFinance();

  const [open, setOpen]             = useState(false);
  const [goalDrafts, setGoalDrafts] = useState({});
  const [gfDrafts, setGfDrafts]     = useState({});
  const [newGoal, setNewGoal]       = useState({ categoria: 'Alimentação', valor: '' });
  const draftsInitialized           = useRef(false);

  // Inicializa os drafts UMA VEZ ao abrir o modal — não re-sincroniza enquanto aberto
  // para não sobrescrever edições em andamento do usuário.
  useEffect(() => {
    if (!open) { draftsInitialized.current = false; return; }
    if (draftsInitialized.current) return;
    setGoalDrafts(
      Object.fromEntries(Object.entries(metas).map(([k, v]) => [k, String(v)]))
    );
    const gfInit = {};
    GASTOS_FIXOS.forEach(({ key }) => { gfInit[key] = String(gastosFixosMetas[key] || '0'); });
    setGfDrafts(gfInit);
    draftsInitialized.current = true;
  }, [open, metas, gastosFixosMetas]);

  const handleGoalDraftChange = (cat, value) => {
    setGoalDrafts(prev => ({ ...prev, [cat]: value }));
  };

  const handleAddGoal = () => {
    if (!newGoal.valor || Number(newGoal.valor) <= 0)
      return notify('Informe um valor válido', 'error');
    setGoalDrafts(prev => ({ ...prev, [newGoal.categoria]: newGoal.valor }));
    setNewGoal({ categoria: 'Alimentação', valor: '' });
  };

  const handleRemoveGoal = (cat) => {
    setGoalDrafts(prev => { const next = { ...prev }; delete next[cat]; return next; });
  };

  /**
   * Salva no contexto (localStorage) e sincroniza com o backend.
   */
  const handleSaveAllGoals = async () => {
    // 1. Sanitizar metas normais
    const novasMetas = {};
    Object.entries(goalDrafts).forEach(([k, v]) => {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) novasMetas[k] = n;
    });
    if (newGoal.valor && Number(newGoal.valor) > 0)
      novasMetas[newGoal.categoria] = Number(newGoal.valor);

    // 2. Sanitizar gastos fixos
    const novosGfMetas = {};
    Object.entries(gfDrafts).forEach(([k, v]) => {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) novosGfMetas[k] = n;
    });

    // 3. Fonte primária: localStorage via contexto
    salvarMetas(novasMetas, novosGfMetas);

    // 4. Sincronização secundária: backend
    try {
      const limitesFlat = { ...novasMetas };
      Object.entries(novosGfMetas).forEach(([k, v]) => { limitesFlat[GASTOS_FIXOS_PREFIX + k] = v; });
      const comp = mesSelecionado || competenciaHoje();
      await api.put(`/wallet/${comp}/limites`, { limites: limitesFlat });
    } catch {
      // Falha no backend não é crítica — localStorage já foi salvo
    }

    setOpen(false);
    setNewGoal({ categoria: 'Alimentação', valor: '' });
    notify('Metas atualizadas!');
  };

  const handleClose = () => setOpen(false);

  return (
    <>
      <span
        onClick={() => setOpen(true)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer',
          fontSize: '0.8rem', color: 'var(--dash-primary)', fontWeight: 500 }}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setOpen(true)}
      >
        <Sparkles size={14} />
        Gerenciar Metas
      </span>

      {open && (
        <ModalOverlay onClick={e => e.target === e.currentTarget && handleClose()}>
          <ModalContent>
            <ModalHeader>
              <h3>Gerenciar Metas</h3>
              <button onClick={handleClose}><X size={18} /></button>
            </ModalHeader>

            {/* Metas de categorias normais */}
            <div style={{ marginBottom: '1.25rem' }}>
              {Object.keys(goalDrafts).length === 0
                ? <p style={{ fontSize: '0.875rem', color: 'var(--dash-muted)', textAlign: 'center', padding: '0.75rem 0' }}>
                    Nenhuma meta definida ainda.
                  </p>
                : Object.entries(goalDrafts).map(([cat, val]) => (
                  <GoalItem key={cat}>
                    <div className="goal-info">
                      <span>{CAT_ICONS[cat] || '📦'} <strong>{cat}</strong></span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={val}
                        onChange={e => handleGoalDraftChange(cat, e.target.value)}
                        aria-label={`Meta da categoria ${cat}`}
                      />
                    </div>
                    <button onClick={() => handleRemoveGoal(cat)} title="Remover">
                      <Trash2 size={14} />
                    </button>
                  </GoalItem>
                ))
              }
            </div>

            {/* Gastos fixos */}
            <div style={{ borderTop: '1px solid var(--dash-border)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--dash-muted-strong)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                🔗 Gastos Fixos
              </p>
              {GASTOS_FIXOS.map(({ key, label, icon }) => (
                <GoalItem key={key}>
                  <div className="goal-info">
                    <span>{icon} <strong>{label}</strong></span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={gfDrafts[key] || '0'}
                      onChange={e => setGfDrafts(prev => ({ ...prev, [key]: e.target.value }))}
                      aria-label={`Meta de ${label}`}
                    />
                  </div>
                </GoalItem>
              ))}
            </div>

            {/* Adicionar nova meta */}
            <div style={{ borderTop: '1px solid var(--dash-border)', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--dash-muted-strong)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Adicionar nova meta
              </p>
              <FormGroup>
                <label>Categoria</label>
                <select value={newGoal.categoria} onChange={e => setNewGoal({ ...newGoal, categoria: e.target.value })}>
                  {CATS.filter(c => c !== 'Salário').map(c =>
                    <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>
                  )}
                </select>
              </FormGroup>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="R$ Limite mensal"
                  value={newGoal.valor}
                  onChange={e => setNewGoal({ ...newGoal, valor: e.target.value })}
                  style={{
                    flex: 1, padding: '0.7rem 0.875rem', border: '1px solid var(--dash-border)',
                    borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none',
                    background: 'var(--dash-input-bg)', color: 'var(--dash-heading)',
                    WebkitTextFillColor: 'var(--dash-heading)',
                  }}
                />
                <button
                  onClick={handleAddGoal}
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4 0%, var(--dash-primary) 52%, #4f46e5 100%)',
                    color: '#fff', border: 'none', borderRadius: '0.5rem',
                    padding: '0 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  }}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <ModalFooter>
              <button className="cancel" onClick={handleClose}>Fechar</button>
              <button className="save" onClick={handleSaveAllGoals}>Salvar tudo</button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
}
