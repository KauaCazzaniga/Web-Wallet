import React from 'react';
import styled, { css } from 'styled-components';
import { AlertTriangle } from 'lucide-react';
import { GASTOS_FIXOS, GASTOS_FIXOS_PREFIX } from '../constants/gastosFixos';

const Row = styled.div`
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr) 130px 180px 110px;
  gap: 0.9rem;
  align-items: center;
  padding: 0.95rem 1rem;
  border-radius: 0.95rem;
  border: 1px solid var(--dash-border);
  background: var(--dash-surface-muted);
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;

  ${(props) => props.$duplicate && css`
    border-color: rgba(234, 179, 8, 0.55);
    background: rgba(234, 179, 8, 0.12);
  `}

  ${(props) => !props.$included && css`
    opacity: 0.56;
    filter: saturate(0.8);
  `}

  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--dash-soft-shadow);
  }

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Main = styled.div`
  min-width: 0;
`;

const DateText = styled.div`
  color: var(--dash-muted);
  font-size: 0.82rem;
  font-weight: 700;
`;

const Description = styled.div`
  display: grid;
  gap: 0.32rem;

  strong {
    color: var(--dash-heading);
    font-size: 0.94rem;
  }

  small {
    color: var(--dash-muted);
    font-size: 0.76rem;
    line-height: 1.45;
  }
`;

const Value = styled.div`
  font-size: 0.92rem;
  font-weight: 800;
  color: ${(props) => (props.$type === 'receita' ? '#16a34a' : '#ef4444')};
`;

const Select = styled.select`
  width: 100%;
  padding: 0.7rem 0.85rem;
  border-radius: 0.7rem;
  border: 1px solid var(--dash-border-strong);
  background: var(--dash-input-bg);
  color: var(--dash-heading);
  font-size: 0.84rem;
  outline: none;

  &:focus {
    border-color: var(--dash-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14);
  }

  option {
    background: var(--dash-surface);
    color: var(--dash-heading);
  }
`;

const MetaColumn = styled.div`
  display: grid;
  gap: 0.45rem;
`;

const DuplicateBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.32rem 0.55rem;
  border-radius: 999px;
  background: rgba(234, 179, 8, 0.16);
  color: #a16207;
  font-size: 0.72rem;
  font-weight: 800;
  width: fit-content;
`;

const ToggleButton = styled.button`
  padding: 0.7rem 0.85rem;
  border-radius: 0.7rem;
  border: none;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 700;
  transition: transform 0.18s ease, filter 0.18s ease;
  background: ${(props) => (props.$included
    ? 'rgba(239, 68, 68, 0.14)'
    : 'linear-gradient(135deg, #06b6d4 0%, var(--dash-primary) 52%, #4f46e5 100%)')};
  color: ${(props) => (props.$included ? '#dc2626' : '#ffffff')};

  &:hover {
    transform: translateY(-1px);
    filter: brightness(1.03);
  }
`;

const formatDate = (value) => {
  if (!value) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR');
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

export default function TransacaoCategorizavel({
  transaction,
  categories,
  onChangeCategory,
  onToggleInclude,
}) {
  return (
    <Row $duplicate={transaction.duplicada} $included={transaction.incluir}>
      <DateText>{formatDate(transaction.data)}</DateText>

      <Main>
        <Description>
          <strong>{transaction.descricao}</strong>
          <small>{transaction.valor_original || 'Lançamento identificado no extrato'}</small>
        </Description>
      </Main>

      <MetaColumn>
        <Value $type={transaction.tipo}>
          {transaction.tipo === 'receita' ? '+' : '-'} R$ {formatCurrency(transaction.valor)}
        </Value>
        {transaction.duplicada && (
          <DuplicateBadge>
            <AlertTriangle size={12} />
            Possível duplicata
          </DuplicateBadge>
        )}
      </MetaColumn>

      <Select
        value={transaction.categoria}
        onChange={(event) => onChangeCategory(transaction.idLocal, event.target.value)}
      >
        {categories
          .filter((categoria) => !String(categoria).startsWith(GASTOS_FIXOS_PREFIX))
          .map((categoria) => (
            <option key={categoria} value={categoria}>
              {categoria}
            </option>
          ))}
        <optgroup label="── Gastos Fixos ──">
          {GASTOS_FIXOS.map((item) => (
            <option key={item.key} value={GASTOS_FIXOS_PREFIX + item.key}>
              {item.label}
            </option>
          ))}
        </optgroup>
      </Select>

      <ToggleButton
        type="button"
        onClick={() => onToggleInclude(transaction.idLocal)}
        $included={transaction.incluir}
      >
        {transaction.incluir ? 'Remover' : 'Manter'}
      </ToggleButton>
    </Row>
  );
}
