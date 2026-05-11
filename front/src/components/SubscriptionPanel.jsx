// Componente: SubscriptionPanel
// Responsabilidade: painel acordeão de assinaturas no Dashboard — lista, resumo e ações
// Depende de: subscriptionService.js, assinaturas.js, SubscriptionCard, SubscriptionFormModal, LancarCobrancaModal

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { getSubscriptions, deleteSubscription } from '../services/subscriptionService';
import { formatCurrencyBRL } from '../utils/relatorioCalc';
import SubscriptionCard from './SubscriptionCard';
import SubscriptionFormModal from './SubscriptionFormModal';
import LancarCobrancaModal from './LancarCobrancaModal';

// ── Styled components ─────────────────────────────────────────────────────────

const Panel = styled.section`
  background: var(--dash-surface);
  border: 1px solid var(--dash-border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--dash-soft-shadow);
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--dash-primary-strong);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  background: ${(p) =>
    p.$open
      ? 'linear-gradient(90deg, rgba(29,78,216,.14) 0%, transparent 100%)'
      : 'transparent'};
  border-bottom: ${(p) => (p.$open ? '1px solid var(--dash-border)' : 'none')};
  user-select: none;
  transition: background 0.2s;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const HeaderTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--dash-heading);
`;

const Badge = styled.span`
  font-size: 11px;
  background: var(--dash-primary-soft);
  color: var(--dash-primary);
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 20px;
  padding: 2px 8px;
  font-weight: 500;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TotalMensal = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: var(--dash-heading);

  span {
    font-size: 11px;
    color: var(--dash-muted);
    font-weight: 400;
    margin-right: 4px;
  }
`;

const Chevron = styled.span`
  color: var(--dash-primary);
  font-size: 12px;
  transition: transform 0.2s;
  transform: ${(p) => (p.$open ? 'rotate(0deg)' : 'rotate(180deg)')};
`;

const SummaryBar = styled.div`
  display: flex;
  border-bottom: 1px solid var(--dash-border);
  background: var(--dash-surface-muted);
`;

const SumItem = styled.div`
  flex: 1;
  padding: 10px 16px;
  border-right: 1px solid var(--dash-border);
  text-align: center;

  &:last-child {
    border-right: none;
  }
`;

const SumLabel = styled.div`
  font-size: 10px;
  color: var(--dash-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 4px;
`;

const SumValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => (p.$accent ? 'var(--dash-primary)' : p.$warn ? '#f59e0b' : 'var(--dash-heading)')};
`;

const Body = styled.div`
  padding: 16px 20px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
`;

const AddBtn = styled.button`
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px dashed var(--dash-primary-strong);
  border-radius: 8px;
  color: var(--dash-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--dash-primary-soft);
  }
`;

const StateMsg = styled.div`
  text-align: center;
  padding: 32px 16px;
  color: var(--dash-muted);
  font-size: 13px;
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcularResumo(subs) {
  const ativas = subs.filter((s) => s.status === 'ativo');
  const totalMensal = ativas.reduce((acc, s) => {
    return acc + (s.billing_cycle === 'anual' ? s.valor / 12 : s.valor);
  }, 0);
  const projecaoAnual = Math.round(totalMensal * 12 * 100) / 100;
  const maiorGasto = ativas.reduce(
    (max, s) => (!max || s.valor > max.valor ? s : max),
    null,
  );
  return {
    totalMensal: Math.round(totalMensal * 100) / 100,
    projecaoAnual,
    maiorGasto: maiorGasto?.nome || '—',
    qtdAtivas: ativas.length,
  };
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function SubscriptionPanel({ notify }) {
  const [aberto, setAberto] = useState(() => {
    try {
      return localStorage.getItem('webwallet_assinaturas_aberto') === 'true';
    } catch {
      return false;
    }
  });

  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formModal, setFormModal] = useState(null); // null | 'new' | subscription object
  const [lancarModal, setLancarModal] = useState(null); // null | subscription object

  const toggleAberto = useCallback(() => {
    setAberto((prev) => {
      try {
        localStorage.setItem('webwallet_assinaturas_aberto', String(!prev));
      } catch {}
      return !prev;
    });
  }, []);

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSubscriptions();
      setSubs(data);
    } catch {
      setError('Não foi possível carregar as assinaturas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  const resumo = useMemo(() => calcularResumo(subs), [subs]);

  function handleSaved(savedSub) {
    setSubs((prev) => {
      const idx = prev.findIndex((s) => s._id === savedSub._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedSub;
        return next;
      }
      return [...prev, savedSub];
    });
    setFormModal(null);
  }

  function handleLancado({ subscription }) {
    setSubs((prev) => prev.map((s) => (s._id === subscription._id ? subscription : s)));
    setLancarModal(null);
  }

  async function handleDelete(sub) {
    try {
      await deleteSubscription(sub._id);
      setSubs((prev) => prev.filter((s) => s._id !== sub._id));
      notify('Assinatura removida.', 'success');
    } catch {
      notify('Erro ao remover assinatura.', 'error');
    }
  }

  return (
    <>
      <Panel>
        <Header $open={aberto} onClick={toggleAberto}>
          <HeaderLeft>
            <span>📱</span>
            <HeaderTitle>Assinaturas</HeaderTitle>
            {resumo.qtdAtivas > 0 && (
              <Badge>{resumo.qtdAtivas} {resumo.qtdAtivas === 1 ? 'ativa' : 'ativas'}</Badge>
            )}
          </HeaderLeft>
          <HeaderRight>
            {resumo.totalMensal > 0 && (
              <TotalMensal>
                <span>mensal</span>
                {formatCurrencyBRL(resumo.totalMensal)}
              </TotalMensal>
            )}
            <Chevron $open={aberto}>▲</Chevron>
          </HeaderRight>
        </Header>

        {aberto && (
          <>
            {resumo.qtdAtivas > 0 && (
              <SummaryBar>
                <SumItem>
                  <SumLabel>Total mensal</SumLabel>
                  <SumValue>{formatCurrencyBRL(resumo.totalMensal)}</SumValue>
                </SumItem>
                <SumItem>
                  <SumLabel>Projeção anual</SumLabel>
                  <SumValue $accent>{formatCurrencyBRL(resumo.projecaoAnual)}</SumValue>
                </SumItem>
                <SumItem>
                  <SumLabel>Maior gasto</SumLabel>
                  <SumValue $warn>{resumo.maiorGasto}</SumValue>
                </SumItem>
                <SumItem>
                  <SumLabel>Ativas</SumLabel>
                  <SumValue>{resumo.qtdAtivas}</SumValue>
                </SumItem>
              </SummaryBar>
            )}

            <Body>
              {loading && <StateMsg>Carregando assinaturas...</StateMsg>}

              {error && !loading && (
                <StateMsg>
                  {error}{' '}
                  <button
                    onClick={fetchSubs}
                    style={{ color: 'var(--dash-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Tentar novamente
                  </button>
                </StateMsg>
              )}

              {!loading && !error && subs.length === 0 && (
                <StateMsg>Nenhuma assinatura cadastrada ainda.</StateMsg>
              )}

              {!loading && !error && subs.length > 0 && (
                <Grid>
                  {subs.map((sub) => (
                    <SubscriptionCard
                      key={sub._id}
                      subscription={sub}
                      onLancar={setLancarModal}
                      onEdit={setFormModal}
                    />
                  ))}
                </Grid>
              )}

              <AddBtn onClick={() => setFormModal('new')}>＋ Nova assinatura</AddBtn>
            </Body>
          </>
        )}
      </Panel>

      {formModal && (
        <SubscriptionFormModal
          subscription={formModal === 'new' ? null : formModal}
          onClose={() => setFormModal(null)}
          onSaved={handleSaved}
          notify={notify}
        />
      )}

      {lancarModal && (
        <LancarCobrancaModal
          subscription={lancarModal}
          onClose={() => setLancarModal(null)}
          onLancado={handleLancado}
          notify={notify}
        />
      )}
    </>
  );
}
