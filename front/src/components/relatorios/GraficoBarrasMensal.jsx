import React from 'react';
import styled from 'styled-components';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompactCurrency, formatCurrencyBRL } from '../../utils/relatorioCalc';

const Card = styled.div`
  padding: 1.35rem 1.4rem 1rem;
  border-radius: 1.1rem;
  border: 1px solid var(--rel-border);
  background: var(--rel-surface);
  box-shadow: var(--rel-soft-shadow);
`;

const Head = styled.div`
  margin-bottom: 1rem;

  h3 {
    margin: 0 0 0.3rem;
    color: var(--rel-heading);
    font-size: 1rem;
  }

  p {
    margin: 0;
    color: var(--rel-muted);
    font-size: 0.84rem;
  }
`;

const TooltipCard = styled.div`
  min-width: 210px;
  padding: 0.9rem 1rem;
  border-radius: 0.9rem;
  border: 1px solid var(--rel-border-strong);
  background: var(--rel-shell);
  box-shadow: var(--rel-soft-shadow);

  strong {
    display: block;
    margin-bottom: 0.45rem;
    color: var(--rel-heading);
  }

  p {
    margin: 0.18rem 0;
    color: var(--rel-text);
    font-size: 0.82rem;
  }
`;

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  const variacao = data?.varDespesa;
  const variacaoLabel = variacao == null
    ? '—'
    : `${variacao > 0 ? '↑' : '↓'} ${Math.abs(variacao).toFixed(1).replace('.', ',')}% vs ${data?.mesAnteriorLabel}`;

  return (
    <TooltipCard>
      <strong>{data?.labelCompleto}</strong>
      <p>Receita: {formatCurrencyBRL(data?.receita)}</p>
      <p>Despesa: {formatCurrencyBRL(data?.despesa)}</p>
      <p style={{ color: data?.saldo >= 0 ? '#1D9E75' : '#E24B4A', fontWeight: 700 }}>
        Saldo: {formatCurrencyBRL(data?.saldo)}
      </p>
      <p>Variação vs mês anterior: {variacaoLabel}</p>
    </TooltipCard>
  );
};

export default function GraficoBarrasMensal({ data, mediaDespesas }) {
  return (
    <Card>
      <Head>
        <h3>Gastos por mês</h3>
        <p>Compare receitas e despesas mês a mês dentro do período filtrado.</p>
      </Head>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid stroke="var(--rel-grid)" vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke="var(--rel-muted)" tickLine={false} axisLine={false} />
          <YAxis
            stroke="var(--rel-muted)"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatCompactCurrency(value)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(55,138,221,0.08)' }} />
          <ReferenceLine
            y={mediaDespesas}
            stroke="#94a3b8"
            strokeDasharray="6 6"
            label={{
              value: `Média: ${formatCurrencyBRL(mediaDespesas)}`,
              fill: '#94a3b8',
              fontSize: 12,
              position: 'insideTopRight',
            }}
          />
          <Bar dataKey="receita" name="Receita" fill="#1D9E75" radius={[6, 6, 0, 0]} maxBarSize={18} />
          <Bar dataKey="despesa" name="Despesa" fill="#E24B4A" radius={[6, 6, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
