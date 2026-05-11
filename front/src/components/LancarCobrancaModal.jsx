// Componente: LancarCobrancaModal
// Responsabilidade: confirmação de lançamento de cobrança de uma assinatura como despesa
// Depende de: assinaturas.js, subscriptionService.js, relatorioCalc.js

import React, { useState } from 'react';
import styled from 'styled-components';
import { iconeUrlAssinatura, iconeFallbackAssinatura, labelAssinatura } from '../constants/assinaturas';
import { lancarCobranca } from '../services/subscriptionService';
import { formatCurrencyBRL } from '../utils/relatorioCalc';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
`;

const Modal = styled.div`
  background: var(--dash-shell);
  border: 1px solid var(--dash-primary-strong);
  border-radius: 16px;
  width: 420px;
  max-width: calc(100vw - 32px);
  padding: 24px;
  box-shadow: 0 0 40px rgba(59, 130, 246, 0.2);
  position: relative;
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

const ConfirmBtn = styled.button`
  width: 100%;
  padding: 11px;
  background: linear-gradient(90deg, var(--dash-primary-strong), var(--dash-primary));
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
  box-shadow: 0 0 16px rgba(59, 130, 246, 0.3);

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

  return (
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
    </Overlay>
  );
}
