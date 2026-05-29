// Componente: SubscriptionFormModal
// Responsabilidade: modal de criação e edição de assinatura
// Depende de: assinaturas.js, subscriptionService.js

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { ASSINATURAS, ASSINATURAS_PREFIX } from '../constants/assinaturas';
import { createSubscription, updateSubscription } from '../services/subscriptionService';

// ── Animations ────────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(28px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)     scale(1);    }
`;

const shimmer = keyframes`
  0%   { transform: translateX(-100%) skewX(-12deg); }
  100% { transform: translateX(220%)  skewX(-12deg); }
`;

// ── Overlay ───────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  animation: ${fadeIn} 0.18s ease;
`;

// ── Modal shell ───────────────────────────────────────────────────────────────

const Modal = styled.div`
  background: #080c14;
  border: 1px solid rgba(96, 165, 250, 0.18);
  border-radius: 20px;
  width: 460px;
  max-width: calc(100vw - 24px);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  position: relative;
  animation: ${slideUp} 0.28s cubic-bezier(0.34, 1.3, 0.64, 1);
  box-shadow:
    0 0 0 1px rgba(96, 165, 250, 0.06),
    0 24px 64px rgba(0, 0, 0, 0.72),
    0 0 80px rgba(59, 130, 246, 0.12);

  /* Thin blue accent line at top */
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    border-radius: 20px 20px 0 0;
    background: linear-gradient(90deg, transparent 0%, #3b82f6 30%, #93c5fd 60%, transparent 100%);
  }

  /* Subtle radial glow from top */
  &::after {
    content: '';
    position: absolute;
    top: 0; left: 50%; transform: translateX(-50%);
    width: 280px; height: 100px;
    background: radial-gradient(ellipse at 50% 0%, rgba(96, 165, 250, 0.10) 0%, transparent 70%);
    pointer-events: none;
    border-radius: 20px 20px 0 0;
  }
`;

// ── Header ────────────────────────────────────────────────────────────────────

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 28px 28px 20px;
  border-bottom: 1px solid rgba(96, 165, 250, 0.08);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const HeaderIcon = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.14);
  border: 1px solid rgba(96, 165, 250, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
`;

const HeaderText = styled.div``;

const Title = styled.h3`
  font-size: 17px;
  font-weight: 700;
  color: #eff6ff;
  letter-spacing: -0.3px;
  margin-bottom: 3px;
`;

const Sub = styled.p`
  font-size: 12px;
  color: rgba(147, 197, 253, 0.55);
  letter-spacing: 0.1px;
`;

const CloseBtn = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  color: rgba(147, 197, 253, 0.5);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
  margin-top: 2px;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #eff6ff;
  }
`;

// ── Form body ─────────────────────────────────────────────────────────────────

const FormBody = styled.div`
  padding: 22px 28px 28px;
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const SectionLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  color: rgba(96, 165, 250, 0.5);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-bottom: 10px;
  margin-top: 6px;

  &:first-child {
    margin-top: 0;
  }
`;

const Field = styled.div`
  margin-bottom: 12px;

  label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    color: rgba(147, 197, 253, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 6px;
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const inputBase = `
  width: 100%;
  padding: 10px 13px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(96, 165, 250, 0.12);
  border-radius: 10px;
  color: #eff6ff;
  font-size: 13px;
  font-family: inherit;
  transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;

  &::placeholder { color: rgba(147, 197, 253, 0.3); }

  &:focus {
    outline: none;
    background: rgba(96, 165, 250, 0.06);
    border-color: rgba(96, 165, 250, 0.45);
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.10);
  }
`;

const Input = styled.input`${inputBase}`;

const Select = styled.select`
  ${inputBase}
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  color-scheme: dark;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2393c5fd' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 13px center;
  padding-right: 36px;

  option {
    background-color: #080c14;
    color: #eff6ff;
  }
`;

// ── Divider ───────────────────────────────────────────────────────────────────

const Divider = styled.div`
  height: 1px;
  background: rgba(96, 165, 250, 0.07);
  margin: 6px 0 16px;
`;

// ── Submit button ─────────────────────────────────────────────────────────────

const SubmitBtn = styled.button`
  width: 100%;
  padding: 13px;
  background: var(--btn-bg, linear-gradient(135deg, #2563eb 0%, #60a5fa 100%));
  border: 1px solid var(--btn-border, transparent);
  border-radius: 11px;
  color: var(--btn-text, #fff);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 8px;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.2px;
  box-shadow: var(--btn-shadow, 0 4px 18px rgba(59,130,246,0.40));
  transition:
    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.22s ease,
    filter 0.22s ease;

  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 40%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
    transform: translateX(-100%) skewX(-12deg);
  }

  &:not(:disabled):hover {
    transform: translateY(-3px) scale(1.005);
    filter: brightness(1.05);
    box-shadow:
      var(--btn-hover-shadow, 0 10px 28px rgba(59, 130, 246, 0.52)),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);

    &::after { animation: ${shimmer} 0.55s ease forwards; }
  }

  &:not(:disabled):active {
    transform: translateY(-1px) scale(1.002);
    transition-duration: 0.08s;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function toInputDate(date) {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 10);
}

const EMPTY_FORM = {
  servicoKey: '',
  nome: '',
  categoria: '',
  valor: '',
  billing_cycle: 'mensal',
  next_charge_date: '',
  status: 'ativo',
  payment_method: '',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function SubscriptionFormModal({ subscription, onClose, onSaved, notify }) {
  const isEdit = Boolean(subscription);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const key = subscription.categoria.replace(ASSINATURAS_PREFIX, '');
      setForm({
        servicoKey: key,
        nome: subscription.nome,
        categoria: subscription.categoria,
        valor: String(subscription.valor),
        billing_cycle: subscription.billing_cycle,
        next_charge_date: toInputDate(subscription.next_charge_date),
        status: subscription.status,
        payment_method: subscription.payment_method || '',
      });
    }
  }, [isEdit, subscription]);

  function handleServicoChange(e) {
    const key = e.target.value;
    const found = ASSINATURAS.find((a) => a.key === key);
    setForm((prev) => ({
      ...prev,
      servicoKey: key,
      nome: found && key !== 'outros' ? found.label : prev.nome,
      categoria: key ? ASSINATURAS_PREFIX + key : '',
    }));
  }

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome || !form.valor || !form.next_charge_date || !form.categoria) {
      notify('Preencha todos os campos obrigatórios.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome,
        categoria: form.categoria,
        valor: Number(form.valor),
        billing_cycle: form.billing_cycle,
        next_charge_date: form.next_charge_date,
        status: form.status,
        payment_method: form.payment_method,
      };
      const result = isEdit
        ? await updateSubscription(subscription._id, payload)
        : await createSubscription(payload);

      notify(isEdit ? 'Assinatura atualizada.' : 'Assinatura criada.', 'success');
      onSaved(result);
    } catch {
      notify('Erro ao salvar assinatura.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>

        <ModalHeader>
          <HeaderLeft>
            <HeaderIcon>📱</HeaderIcon>
            <HeaderText>
              <Title>{isEdit ? 'Editar assinatura' : 'Nova assinatura'}</Title>
              <Sub>{isEdit ? 'Atualize os dados do serviço' : 'Cadastre um serviço recorrente'}</Sub>
            </HeaderText>
          </HeaderLeft>
          <CloseBtn onClick={onClose}>✕</CloseBtn>
        </ModalHeader>

        <FormBody>
          <form onSubmit={handleSubmit}>

            <SectionLabel>Serviço</SectionLabel>
            <Field>
              <label>Tipo</label>
              <Select value={form.servicoKey} onChange={handleServicoChange}>
                <option value="">Selecione o serviço...</option>
                {ASSINATURAS.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.iconFallback} {a.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <label>Nome *</label>
              <Input
                value={form.nome}
                onChange={set('nome')}
                placeholder="ex: Spotify Duo"
                required
              />
            </Field>

            <Divider />
            <SectionLabel>Cobrança</SectionLabel>

            <Row>
              <Field>
                <label>Valor (R$) *</label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.valor}
                  onChange={set('valor')}
                  placeholder="0,00"
                  required
                />
              </Field>
              <Field>
                <label>Recorrência *</label>
                <Select value={form.billing_cycle} onChange={set('billing_cycle')}>
                  <option value="mensal">Mensal</option>
                  <option value="anual">Anual</option>
                </Select>
              </Field>
            </Row>

            <Row>
              <Field>
                <label>Próxima cobrança *</label>
                <Input
                  type="date"
                  value={form.next_charge_date}
                  onChange={set('next_charge_date')}
                  required
                />
              </Field>
              <Field>
                <label>Status</label>
                <Select value={form.status} onChange={set('status')}>
                  <option value="ativo">Ativo</option>
                  <option value="pausado">Pausado</option>
                  <option value="cancelado">Cancelado</option>
                </Select>
              </Field>
            </Row>

            <Divider />
            <SectionLabel>Pagamento</SectionLabel>

            <Field>
              <label>Forma de pagamento</label>
              <Input
                value={form.payment_method}
                onChange={set('payment_method')}
                placeholder="ex: Cartão de crédito Nubank"
              />
            </Field>

            <SubmitBtn type="submit" disabled={saving}>
              {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : '+ Criar assinatura'}
            </SubmitBtn>

          </form>
        </FormBody>

      </Modal>
    </Overlay>,
    document.body,
  );
}
