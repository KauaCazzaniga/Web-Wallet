import React from 'react';
import styled from 'styled-components';
import { formatCurrencyBRL } from '../../utils/relatorioCalc';

const Card = styled.div`
  border-radius: 1.1rem;
  border: 1px solid var(--rel-border);
  background: var(--rel-surface);
  box-shadow: var(--rel-soft-shadow);
  overflow: hidden;
`;

const Header = styled.div`
  padding: 1.1rem 1.3rem;
  border-bottom: 1px solid var(--rel-border);

  h3 {
    margin: 0 0 0.25rem;
    color: var(--rel-heading);
    font-size: 1rem;
  }

  p {
    margin: 0;
    color: var(--rel-muted);
    font-size: 0.84rem;
  }
`;

const TableWrap = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead {
    background: var(--rel-table-head);
  }

  th {
    padding: 0.9rem 1rem;
    text-align: left;
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--rel-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  td {
    padding: 0.95rem 1rem;
    border-top: 1px solid var(--rel-border);
    color: var(--rel-heading);
    font-size: 0.88rem;
  }

  tfoot td {
    background: var(--rel-surface-muted);
    font-weight: 700;
  }
`;

const variationColor = (type, value) => {
  if (value == null) return 'var(--rel-muted)';
  if (type === 'despesa') return value <= 0 ? '#1D9E75' : '#E24B4A';
  return value >= 0 ? '#1D9E75' : '#94a3b8';
};

const formatVariation = (type, value) => {
  if (value == null) return '—';
  const absolute = Math.abs(value).toFixed(1).replace('.', ',');

  if (type === 'despesa') {
    return `${value > 0 ? '↑' : '↓'} ${absolute}%`;
  }

  return `${value >= 0 ? '↑' : '↓'} ${absolute}%`;
};

export default function TabelaComparativo({ data, resumo }) {
  return (
    <Card>
      <Header>
        <h3>Comparativo mensal</h3>
        <p>Resumo consolidado mês a mês com variações frente ao período anterior.</p>
      </Header>

      <TableWrap>
        <Table>
          <thead>
            <tr>
              <th>Mês</th>
              <th>Receitas</th>
              <th>Despesas</th>
              <th>Saldo</th>
              <th>Var. Despesa</th>
              <th>Var. Receita</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.mes}>
                <td>{item.label}</td>
                <td style={{ color: '#1D9E75', fontWeight: 700 }}>{formatCurrencyBRL(item.receita)}</td>
                <td style={{ color: '#E24B4A', fontWeight: 700 }}>{formatCurrencyBRL(item.despesa)}</td>
                <td style={{ color: item.saldo >= 0 ? '#1D9E75' : '#E24B4A', fontWeight: 700 }}>
                  {formatCurrencyBRL(item.saldo)}
                </td>
                <td style={{ color: variationColor('despesa', item.varDespesa), fontWeight: 700 }}>
                  {formatVariation('despesa', item.varDespesa)}
                </td>
                <td style={{ color: variationColor('receita', item.varReceita), fontWeight: 700 }}>
                  {formatVariation('receita', item.varReceita)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td style={{ color: '#1D9E75' }}>{formatCurrencyBRL(resumo.totalReceitas)}</td>
              <td style={{ color: '#E24B4A' }}>{formatCurrencyBRL(resumo.totalDespesas)}</td>
              <td style={{ color: resumo.saldoPeriodo >= 0 ? '#1D9E75' : '#E24B4A' }}>
                {formatCurrencyBRL(resumo.saldoPeriodo)}
              </td>
              <td>—</td>
              <td>—</td>
            </tr>
          </tfoot>
        </Table>
      </TableWrap>
    </Card>
  );
}
