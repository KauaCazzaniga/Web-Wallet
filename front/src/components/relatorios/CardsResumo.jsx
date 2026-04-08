import React from 'react';
import styled from 'styled-components';
import { formatCurrencyBRL } from '../../utils/relatorioCalc';

const Grid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  padding: 1.1rem 1.2rem;
  border-radius: 1rem;
  border: 1px solid var(--rel-border);
  background: var(--rel-surface);
  box-shadow: var(--rel-soft-shadow);

  span {
    display: block;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 0.55rem;
    color: var(--rel-muted);
  }

  strong {
    display: block;
    font-size: 1.4rem;
    letter-spacing: -0.04em;
    color: ${(props) => props.$tone || 'var(--rel-heading)'};
  }
`;

export default function CardsResumo({ resumo }) {
  return (
    <Grid>
      <Card $tone="#1D9E75">
        <span>Total de receitas</span>
        <strong>{formatCurrencyBRL(resumo.totalReceitas)}</strong>
      </Card>
      <Card $tone="#E24B4A">
        <span>Total de despesas</span>
        <strong>{formatCurrencyBRL(resumo.totalDespesas)}</strong>
      </Card>
      <Card $tone={resumo.saldoPeriodo >= 0 ? '#1D9E75' : '#E24B4A'}>
        <span>Saldo do período</span>
        <strong>{formatCurrencyBRL(resumo.saldoPeriodo)}</strong>
      </Card>
      <Card $tone="var(--rel-heading)">
        <span>Média mensal de gastos</span>
        <strong>{formatCurrencyBRL(resumo.mediaMensalGastos)}</strong>
      </Card>
    </Grid>
  );
}
