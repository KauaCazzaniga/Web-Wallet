// Componente: SubscriptionFormModal
// Responsabilidade: modal de criação e edição de assinatura
// Depende de: assinaturas.js, subscriptionService.js

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ASSINATURAS, ASSINATURAS_PREFIX } from '../constants/assinaturas';
import { createSubscription, updateSubscription } from '../services/subscriptionService';

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
  width: 440px;
  max-width: calc(100vw - 32px);
  padding: 24px;
  box-shadow: 0 0 40px rgba(59, 130, 246, 0.2);
  position: relative;
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

const Select = styled.select`
  width: 100%;
  padding: 9px 12px;
  background: var(--dash-input-bg);
  border: 1px solid var(--dash-border);
  border-radius: 8px;
  color: var(--dash-heading);
  font-size: 13px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--dash-primary);
  }
`;

const SubmitBtn = styled.button`
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

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <CloseBtn onClick={onClose}>✕</CloseBtn>
        <Title>{isEdit ? 'Editar assinatura' : 'Nova assinatura'}</Title>
        <Sub>Preencha os dados do serviço recorrente</Sub>

        <form onSubmit={handleSubmit}>
          <Field>
            <label>Serviço</label>
            <Select value={form.servicoKey} onChange={handleServicoChange}>
              <option value="">Selecione...</option>
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

          <Field>
            <label>Forma de pagamento</label>
            <Input
              value={form.payment_method}
              onChange={set('payment_method')}
              placeholder="ex: Cartão de crédito"
            />
          </Field>

          <SubmitBtn type="submit" disabled={saving}>
            {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar assinatura'}
          </SubmitBtn>
        </form>
      </Modal>
    </Overlay>
  );
}
