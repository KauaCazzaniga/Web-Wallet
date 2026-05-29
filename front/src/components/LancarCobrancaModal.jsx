// Componente: LancarCobrancaModal
// Responsabilidade: confirmação de lançamento de cobrança de uma assinatura como despesa
// Depende de: assinaturas.js, subscriptionService.js, relatorioCalc.js

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { iconeUrlAssinatura, iconeFallbackAssinatura, labelAssinatura } from '../constants/assinaturas';
import { lancarCobranca } from '../services/subscriptionService';
import { formatCurrencyBRL } from '../utils/relatorioCalc';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 40%,
    rgba(2, 18, 12, 0.88) 0%,
    rgba(1, 10, 7, 0.96) 100%
  );
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
`;

const Modal = styled.div`
  background: var(--dash-shell, #000000);
  border: 1px solid var(--dash-primary-strong);
  border-radius: 18px;
  width: 420px;
  max-width: calc(100vw - 32px);
  padding: 28px;
  position: relative;
  box-shadow:
    0 0 0 1px rgba(96, 165, 250, 0.08),
    0 8px 32px rgba(0, 8, 4, 0.72),
    0 0 64px rgba(59, 130, 246, 0.18),
    inset 0 1px 0 rgba(96, 165, 250, 0.12);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 18px;
    background: radial-gradient(
      ellipse at 50% 0%,
      rgba(96, 165, 250, 0.07) 0%,
      transparent 65%
    );
    pointer-events: none;
  }
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--dash-surface-muted);
  border: none;
  border-radius: 6px;
  color: var(--dash-muted);
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Title = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: var(--dash-heading);
  margin-bottom: 4px;
`;

const Sub = styled.p`
  font-size: 12px;
  color: var(--dash-muted);
  margin-bottom: 20px;
`;

const ServiceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--dash-surface);
  border: 1px solid var(--dash-border);
  border-radius: 10px;
  margin-bottom: 18px;
`;

const LogoBox = styled.div`
  width: 44px;
  height: 44px;
  background: #fff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  overflow: hidden;
  flex-shrink: 0;
`;

const LogoImg = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
  display: ${(p) => (p.$hidden ? 'none' : 'block')};
`;

const ServiceInfo = styled.div``;

const ServiceName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--dash-heading);
`;

const ServiceValor = styled.div`
  font-size: 13px;
  color: var(--dash-primary);
  font-weight: 500;
`;

const Field = styled.div`
  margin-bottom: 14px;

  label {
    display: block;
    font-size: 11px;
    color: var(--dash-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const Input = styled.input`
  width: 100%;
  padding: 9px 12px;
  background: var(--dash-input-bg);
  border: 1px solid var(--dash-border);
  border-radius: 8px;
  color: var(--dash-heading);
  font-size: 13px;

  &:focus {
    outline: none;
    border-color: var(--dash-primary);
  }
`;

const shimmer = keyframes`
  0%   { transform: translateX(-100%) skewX(-12deg); }
  100% { transform: translateX(220%)  skewX(-12deg); }
`;

const ConfirmBtn = styled.button`
  width: 100%;
  padding: 12px;
  background: var(--btn-bg, linear-gradient(135deg, #2563eb 0%, #60a5fa 100%));
  border: 1px solid var(--btn-border, transparent);
  border-radius: 10px;
  color: var(--btn-text, #fff);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 6px;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.2px;
  box-shadow: var(--btn-shadow, 0 4px 14px rgba(59,130,246,0.35));
  transition:
    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.22s ease,
    filter 0.22s ease;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 40%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.22),
      transparent
    );
    transform: translateX(-100%) skewX(-12deg);
  }

  &:not(:disabled):hover {
    transform: translateY(-3px) scale(1.005);
    filter: brightness(1.08);
    box-shadow:
      0 8px 26px rgba(59, 130, 246, 0.48),
      0 3px 8px rgba(0, 8, 4, 0.36),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);

    &::after { animation: ${shimmer} 0.55s ease forwards; }
  }

  &:not(:disabled):active {
    transform: translateY(-1px) scale(1.002);
    box-shadow:
      0 3px 12px rgba(59, 130, 246, 0.30),
      0 1px 3px rgba(0, 8, 4, 0.25);
    transition-duration: 0.08s;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function LancarCobrancaModal({ subscription, onClose, onLancado, notify }) {
  const { nome, categoria, valor, billing_cycle } = subscription;
  const iconUrl = iconeUrlAssinatura(categoria);
  const fallback = iconeFallbackAssinatura(categoria);
  const [imgFailed, setImgFailed] = useState(false);

  const [dataCobranca, setDataCobranca] = useState(todayISO);
  const [paymentMethod, setPaymentMethod] = useState(subscription.payment_method || '');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConfirm(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await lancarCobranca(subscription._id, {
        data_hora: dataCobranca,
        payment_method: paymentMethod,
        descricao: descricao || nome,
      });
      notify(`Cobrança de ${nome} lançada com sucesso.`, 'success');
      onLancado(result);
    } catch {
      notify('Erro ao lançar cobrança.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <CloseBtn onClick={onClose}>✕</CloseBtn>
        <Title>⚡ Lançar cobrança</Title>
        <Sub>Confirme os dados antes de registrar a despesa</Sub>

        <ServiceRow>
          <LogoBox>
            {iconUrl && !imgFailed ? (
              <LogoImg src={iconUrl} alt={nome} onError={() => setImgFailed(true)} />
            ) : (
              fallback
            )}
          </LogoBox>
          <ServiceInfo>
            <ServiceName>{nome}</ServiceName>
            <ServiceValor>
              {formatCurrencyBRL(valor)}/{billing_cycle === 'anual' ? 'ano' : 'mês'}
            </ServiceValor>
          </ServiceInfo>
        </ServiceRow>

        <form onSubmit={handleConfirm}>
          <Row>
            <Field>
              <label>Data da cobrança</label>
              <Input
                type="date"
                value={dataCobranca}
                onChange={(e) => setDataCobranca(e.target.value)}
                required
              />
            </Field>
            <Field>
              <label>Forma de pagamento</label>
              <Input
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="ex: Cartão de crédito"
              />
            </Field>
          </Row>

          <Field>
            <label>Descrição (opcional)</label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder={`ex: ${nome} — ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`}
            />
          </Field>

          <ConfirmBtn type="submit" disabled={loading}>
            {loading ? 'Lançando...' : '✔ Confirmar lançamento'}
          </ConfirmBtn>
        </form>
      </Modal>
    </Overlay>,
    document.body,
  );
}
