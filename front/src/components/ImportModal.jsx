import React, { useMemo } from 'react';
import styled from 'styled-components';
import { FileText, X } from 'lucide-react';
import TransacaoCategorizavel from './TransacaoCategorizavel';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.76);
`;

const Card = styled.div`
  width: min(1040px, calc(100vw - 2rem));
  max-height: calc(100vh - 3rem);
  overflow: hidden;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  border-radius: 1.25rem;
  border: 1px solid var(--dash-border);
  background: var(--dash-surface);
  box-shadow: var(--dash-shadow);
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.35rem 1.5rem 1rem;
  border-bottom: 1px solid var(--dash-border);

  h3 {
    margin: 0 0 0.25rem;
    color: var(--dash-heading);
    font-size: 1.08rem;
  }

  p {
    margin: 0;
    color: var(--dash-muted);
    font-size: 0.84rem;
    line-height: 1.6;
  }
`;

const CloseButton = styled.button`
  border: none;
  background: none;
  color: var(--dash-muted);
  cursor: pointer;
  padding: 0.25rem;
`;

const Summary = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--dash-border);

  @media (max-width: 880px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const SummaryItem = styled.div`
  padding: 0.9rem 1rem;
  border-radius: 0.95rem;
  border: 1px solid var(--dash-border);
  background: var(--dash-surface-muted);

  small {
    display: block;
    margin-bottom: 0.32rem;
    color: var(--dash-muted);
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  strong {
    color: var(--dash-heading);
    font-size: 0.9rem;
  }
`;

const List = styled.div`
  overflow-y: auto;
  padding: 1rem 1.5rem 0;
  display: grid;
  gap: 0.85rem;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem 1.35rem;
  border-top: 1px solid var(--dash-border);
`;

const CountText = styled.div`
  color: var(--dash-muted);
  font-size: 0.84rem;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.1rem;
  border-radius: 0.8rem;
  border: ${(props) => (props.$primary ? 'none' : '1px solid var(--dash-border-strong)')};
  background: ${(props) => (props.$primary
    ? 'linear-gradient(135deg, #06b6d4 0%, var(--dash-primary) 52%, #4f46e5 100%)'
    : 'var(--dash-surface-muted)')};
  color: ${(props) => (props.$primary ? '#ffffff' : 'var(--dash-heading)')};
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 700;
  transition: transform 0.18s ease, filter 0.18s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.04);
  }
`;

const EmptyState = styled.div`
  padding: 2rem 1rem 2.6rem;
  text-align: center;
  color: var(--dash-muted);
  display: grid;
  gap: 0.65rem;
  place-items: center;
`;

const formatPeriod = (periodo) => {
  if (!periodo?.inicio && !periodo?.fim) return 'Período não identificado';
  return `${periodo?.inicio || '—'} até ${periodo?.fim || '—'}`;
};

export default function ImportModal({
  open,
  parsedData,
  categories,
  saving = false,
  onClose,
  onConfirm,
  onChangeCategory,
  onChangeType,
  onToggleInclude,
}) {
  const transactions = useMemo(
    () => parsedData?.transacoes || [],
    [parsedData?.transacoes],
  );
  const includedCount = useMemo(
    () => transactions.filter((transaction) => transaction.incluir).length,
    [transactions],
  );

  if (!open) return null;

  return (
    <Overlay onClick={(event) => event.target === event.currentTarget && onClose()}>
      <Card>
        <Header>
          <div>
            <h3>Revisar transações do extrato</h3>
            <p>
              Confirme as categorias, revise possíveis duplicatas e escolha quais lançamentos
              devem entrar no dashboard.
            </p>
          </div>
          <CloseButton type="button" onClick={onClose}>
            <X size={18} />
          </CloseButton>
        </Header>

        <Summary>
          <SummaryItem>
            <small>Banco</small>
            <strong>{parsedData?.banco || 'Não identificado'}</strong>
          </SummaryItem>
          <SummaryItem>
            <small>Período</small>
            <strong>{formatPeriod(parsedData?.periodo)}</strong>
          </SummaryItem>
          <SummaryItem>
            <small>Total extraído</small>
            <strong>{transactions.length} transações</strong>
          </SummaryItem>
          <SummaryItem>
            <small>Observações</small>
            <strong>{parsedData?.observacoes || 'Nenhuma inconsistência relevante'}</strong>
          </SummaryItem>
        </Summary>

        <List>
          {transactions.length === 0 ? (
            <EmptyState>
              <FileText size={28} />
              Nenhuma transação pronta para revisão.
            </EmptyState>
          ) : transactions.map((transaction) => (
            <TransacaoCategorizavel
              key={transaction.idLocal}
              transaction={transaction}
              categories={categories}
              onChangeCategory={onChangeCategory}
              onChangeType={onChangeType}
              onToggleInclude={onToggleInclude}
            />
          ))}
        </List>

        <Footer>
          <CountText>{includedCount} transações serão importadas</CountText>
          <Actions>
            <Button type="button" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="button" $primary onClick={onConfirm} disabled={saving || includedCount === 0}>
              {saving ? 'Salvando...' : `Confirmar ${includedCount} transações`}
            </Button>
          </Actions>
        </Footer>
      </Card>
    </Overlay>
  );
}
