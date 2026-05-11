// Componente: SubscriptionCard
// Responsabilidade: exibe dados de uma assinatura individual com logo, valor e ações
// Depende de: assinaturas.js, relatorioCalc.js

import React, { useState } from 'react';
import styled from 'styled-components';
import { iconeUrlAssinatura, iconeFallbackAssinatura } from '../constants/assinaturas';
import { formatCurrencyBRL } from '../utils/relatorioCalc';

const Card = styled.div`
  background: var(--dash-surface);
  border: 1px solid var(--dash-border);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.15s, box-shadow 0.15s;
  opacity: ${(p) => (p.$inactive ? 0.55 : 1)};

  &:hover {
    border-color: var(--dash-primary-strong);
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.15);
  }
`;

const Top = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LogoBox = styled.div`
  width: 36px;
  height: 36px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  font-size: 18px;
`;

const LogoImg = styled.img`
  width: 24px;
  height: 24px;
  object-fit: contain;
  display: ${(p) => (p.$hidden ? 'none' : 'block')};
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;
`;

const Name = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--dash-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Cycle = styled.div`
  font-size: 11px;
  color: var(--dash-muted);
  text-transform: capitalize;
`;

const STATUS_COLORS = {
  ativo:     { bg: 'rgba(34,197,94,.15)',   text: '#4ade80', border: 'rgba(34,197,94,.25)' },
  pausado:   { bg: 'rgba(245,158,11,.12)',  text: '#fbbf24', border: 'rgba(245,158,11,.2)' },
  cancelado: { bg: 'rgba(239,68,68,.1)',    text: '#f87171', border: 'rgba(239,68,68,.18)' },
};

const StatusChip = styled.span`
  font-size: 10px;
  border-radius: 20px;
  padding: 2px 7px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  flex-shrink: 0;
  background: ${(p) => STATUS_COLORS[p.$status]?.bg};
  color: ${(p) => STATUS_COLORS[p.$status]?.text};
  border: 1px solid ${(p) => STATUS_COLORS[p.$status]?.border};
`;

const Valor = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: var(--dash-heading);
  letter-spacing: -0.3px;

  small {
    font-size: 11px;
    color: var(--dash-muted);
    font-weight: 400;
    margin-left: 2px;
  }
`;

const NextCharge = styled.div`
  font-size: 11px;
  color: ${(p) => (p.$soon ? '#f59e0b' : 'var(--dash-muted)')};
`;

const Actions = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 2px;
`;

const BtnLancar = styled.button`
  flex: 1;
  padding: 6px 0;
  background: var(--dash-primary-soft);
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-radius: 6px;
  color: var(--dash-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: ${(p) => (p.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(p) => (p.disabled ? 0.4 : 1)};
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.28);
  }
`;

const BtnEdit = styled.button`
  padding: 6px 10px;
  background: transparent;
  border: 1px solid var(--dash-border);
  border-radius: 6px;
  color: var(--dash-muted);
  font-size: 12px;
  cursor: pointer;

  &:hover {
    border-color: var(--dash-border-strong);
    color: var(--dash-muted-strong);
  }
`;

function formatNextDate(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

function isComingSoon(date) {
  if (!date) return false;
  const diff = new Date(date) - new Date();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

export default function SubscriptionCard({ subscription, onLancar, onEdit }) {
  const { nome, categoria, valor, billing_cycle, next_charge_date, status } = subscription;
  const iconUrl = iconeUrlAssinatura(categoria);
  const fallback = iconeFallbackAssinatura(categoria);
  const [imgFailed, setImgFailed] = useState(false);
  const inactive = status !== 'ativo';
  const soon = isComingSoon(next_charge_date);

  return (
    <Card $inactive={inactive}>
      <Top>
        <LogoBox>
          {iconUrl && !imgFailed ? (
            <LogoImg
              src={iconUrl}
              alt={nome}
              onError={() => setImgFailed(true)}
            />
          ) : (
            fallback
          )}
        </LogoBox>
        <Info>
          <Name title={nome}>{nome}</Name>
          <Cycle>{billing_cycle}</Cycle>
        </Info>
        <StatusChip $status={status}>{status}</StatusChip>
      </Top>

      <Valor>
        {formatCurrencyBRL(valor)}
        <small>/{billing_cycle === 'anual' ? 'ano' : 'mês'}</small>
      </Valor>

      <NextCharge $soon={soon}>
        {soon ? '⚠ ' : ''}Próxima: {formatNextDate(next_charge_date)}
      </NextCharge>

      <Actions>
        <BtnLancar disabled={inactive} onClick={() => !inactive && onLancar(subscription)}>
          ⚡ Lançar cobrança
        </BtnLancar>
        <BtnEdit onClick={() => onEdit(subscription)}>✏</BtnEdit>
      </Actions>
    </Card>
  );
}
