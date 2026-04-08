import React from 'react';
import styled from 'styled-components';
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
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
  min-width: 200px;
  padding: 0.9rem 1rem;
  border-radius: 0.9rem;
  border: 1px solid var(--rel-border-strong);
  background: var(--rel-shell);
  box-shadow: var(--rel-soft-shadow);

  strong {
    display: block;
    margin-bottom: 0.4rem;
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

  return (
    <TooltipCard>
      <strong>{data?.labelCompleto}</strong>
      <p style={{ color: data?.saldoAcumulado >= 0 ? '#378ADD' : '#E24B4A', fontWeight: 700 }}>
        Saldo acumulado: {formatCurrencyBRL(data?.saldoAcumulado)}
      </p>
      <p>Saldo do mês: {formatCurrencyBRL(data?.saldo)}</p>
    </TooltipCard>
  );
};

export default function GraficoSaldoAcumulado({ data }) {
  const hasNegative = data.some((item) => item.saldoAcumulado < 0);
  const stroke = hasNegative ? '#E24B4A' : '#378ADD';
  const fill = hasNegative ? 'rgba(226,75,74,0.15)' : 'rgba(55,138,221,0.15)';

  return (
    <Card>
      <Head>
        <h3>Saldo acumulado</h3>
        <p>Mostra a evolução do saldo ao longo dos meses selecionados.</p>
      </Head>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="saldoArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={stroke} stopOpacity={0.25} />
              <stop offset="95%" stopColor={stroke} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--rel-grid)" vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke="var(--rel-muted)" tickLine={false} axisLine={false} />
          <YAxis
            stroke="var(--rel-muted)"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatCompactCurrency(value)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(55,138,221,0.28)' }} />
          <ReferenceLine y={0} stroke="var(--rel-border-strong)" strokeDasharray="4 4" />
          <Area type="monotone" dataKey="saldoAcumulado" stroke="none" fill="url(#saldoArea)" />
          <Line
            type="monotone"
            dataKey="saldoAcumulado"
            stroke={stroke}
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}
