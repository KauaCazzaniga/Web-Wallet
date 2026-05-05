// Componente: GraficoInvestimentos
// Responsabilidade: Gráfico de área do patrimônio acumulado em investimentos + tabela de transações
// Depende de: recharts, relatorioCalc (formatCurrencyBRL, formatCompactCurrency)

import React, { useMemo } from 'react';
import styled from 'styled-components';
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrencyBRL, formatCompactCurrency } from '../../utils/relatorioCalc';

// ── Styled ────────────────────────────────────────────────────────────────────
const Card = styled.div`
  padding: 1.35rem 1.4rem 1rem;
  border-radius: 1.1rem;
  border: 1px solid var(--rel-border);
  background: var(--rel-surface);
  box-shadow: var(--rel-soft-shadow);
`;
const Head = styled.div`
  margin-bottom: 1rem;
  h3 { margin: 0 0 0.3rem; color: var(--rel-heading); font-size: 1rem; }
  p  { margin: 0; color: var(--rel-muted); font-size: 0.84rem; }
`;
const TooltipCard = styled.div`
  min-width: 180px; padding: 0.9rem 1rem; border-radius: 0.9rem;
  border: 1px solid var(--rel-border-strong);
  background: var(--rel-shell); box-shadow: var(--rel-soft-shadow);
  strong { display: block; margin-bottom: 0.4rem; color: var(--rel-heading); }
  p { margin: 0.18rem 0; color: var(--rel-text); font-size: 0.82rem; }
`;
const Table = styled.table`
  width: 100%; border-collapse: collapse; margin-top: 1.25rem;
  thead th {
    padding: 0.55rem 0.75rem; font-size: 0.72rem; font-weight: 600;
    color: var(--rel-muted); text-transform: uppercase; letter-spacing: 0.05em;
    text-align: left; border-bottom: 1px solid var(--rel-border);
  }
  tbody tr {
    border-bottom: 1px solid var(--rel-border);
    &:last-child { border: none; }
    &:hover { background: var(--rel-surface-muted); }
  }
  tbody td {
    padding: 0.65rem 0.75rem; font-size: 0.84rem; color: var(--rel-heading);
  }
`;
const EmptyMsg = styled.p`
  text-align: center; color: var(--rel-muted); font-size: 0.875rem;
  padding: 2rem 0 0.5rem;
`;

// ── Tooltip customizado ───────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <TooltipCard>
      <strong>{d?.labelCompleto || d?.label}</strong>
      <p style={{ color: '#7F77DD', fontWeight: 700 }}>
        Patrimônio acumulado: {formatCurrencyBRL(d?.acumulado)}
      </p>
      <p>Investido no mês: {formatCurrencyBRL(d?.aporte)}</p>
    </TooltipCard>
  );
};

// ── Componente ────────────────────────────────────────────────────────────────

/**
 * @param {Array}  transacoes - Transações do período com categoria === 'Investimentos' (fonte: servidor)
 * @param {Array}  meses      - Array de "YYYY-MM" do período selecionado em Relatórios
 */
export default function GraficoInvestimentos({ transacoes, meses }) {
  /**
   * Monta série temporal com investimento mensal e acumulado.
   * Usa data?.slice(0,7) como chave de mês para cada transação.
   */
  const chartData = useMemo(() => {
    const aportePorMes = meses.map((mes) => ({
      mes,
      aporte: transacoes
        .filter((tx) => String(tx.data || tx.competencia || '').slice(0, 7) === mes)
        .reduce((sum, tx) => sum + Number(tx.valor || 0), 0),
    }));
    return aportePorMes.reduce((acc, { mes, aporte }) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].acumulado : 0;
      const [y, m] = mes.split('-').map(Number);
      const labelCompleto = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
        .format(new Date(y, m - 1, 1));
      const label = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
        .format(new Date(y, m - 1, 1)).replace('.', '');
      return [...acc, { mes, label, labelCompleto, aporte, acumulado: prev + aporte }];
    }, []);
  }, [transacoes, meses]);

  /** Transações individuais de investimento no período, mais recentes primeiro */
  const transacoesPeriodo = useMemo(() =>
    [...transacoes].sort((a, b) => String(b.data || '').localeCompare(String(a.data || ''))),
  [transacoes]);

  const totalPeriodo = transacoesPeriodo.reduce((s, tx) => s + Number(tx.valor || 0), 0);

  if (chartData.every((d) => d.acumulado === 0)) {
    return (
      <Card>
        <Head>
          <h3>Evolução patrimonial</h3>
          <p>Nenhum investimento registrado no período selecionado.</p>
        </Head>
        <EmptyMsg>Registre transações com categoria "Investimentos" no Dashboard.</EmptyMsg>
      </Card>
    );
  }

  return (
    <Card>
      <Head>
        <h3>Evolução patrimonial</h3>
        <p>Patrimônio acumulado em investimentos ao longo do período.</p>
      </Head>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="invArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#7F77DD" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7F77DD" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--rel-grid)" vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke="var(--rel-muted)" tickLine={false} axisLine={false} />
          <YAxis
            stroke="var(--rel-muted)" tickLine={false} axisLine={false}
            tickFormatter={(v) => formatCompactCurrency(v)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(127,119,221,0.28)' }} />
          <Area type="monotone" dataKey="acumulado" stroke="none" fill="url(#invArea)" />
          <Line
            type="monotone" dataKey="acumulado" stroke="#7F77DD" strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {transacoesPeriodo.length > 0 && (
        <>
          <Head style={{ marginTop: '1.5rem', marginBottom: '0' }}>
            <h3>Aportes no período</h3>
            <p>{transacoesPeriodo.length} aporte{transacoesPeriodo.length > 1 ? 's' : ''} · total {formatCurrencyBRL(totalPeriodo)}</p>
          </Head>
          <Table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {transacoesPeriodo.map((tx) => {
                const dataFormatada = tx.data
                  ? new Date(tx.data + 'T00:00:00').toLocaleDateString('pt-BR')
                  : '—';
                return (
                  <tr key={tx._id || tx.id || tx.data + tx.descricao}>
                    <td style={{ color: 'var(--rel-muted)', fontSize: '0.8rem' }}>{dataFormatada}</td>
                    <td>{tx.descricao || '—'}</td>
                    <td style={{ textAlign: 'right', color: '#7F77DD', fontWeight: 600 }}>
                      {formatCurrencyBRL(tx.valor)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </>
      )}
    </Card>
  );
}
