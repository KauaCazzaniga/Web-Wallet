// Componente: ChartTooltip
// Responsabilidade: Tooltip glassmorphism reutilizável para gráficos Recharts
import React from 'react';
import styled from 'styled-components';

const TooltipBox = styled.div`
  background: rgba(7, 16, 34, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(96, 165, 250, 0.18);
  border-radius: 0.75rem;
  padding: 0.875rem 1.1rem;
  box-shadow: 0 12px 32px rgba(2, 12, 27, 0.5);
  min-width: 160px;
`;

const TooltipLabel = styled.p`
  font-size: 0.7rem;
  color: #89a0c7;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const TooltipRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.2rem;
`;

const TooltipDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${p => p.$color};
  flex-shrink: 0;
`;

const TooltipName = styled.span`
  font-size: 0.75rem;
  color: #89a0c7;
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const TooltipValue = styled.span`
  font-size: 0.875rem;
  font-weight: 700;
  color: #eff6ff;
`;

/**
 * @param {boolean}  active    - Se o tooltip está ativo (provido pelo Recharts)
 * @param {Array}    payload   - Dados do ponto (provido pelo Recharts)
 * @param {string}   label     - Label do eixo X (provido pelo Recharts)
 * @param {Function} formatter - Formata o valor numérico (ex: formatCurrencyBRL)
 */
export function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <TooltipBox>
      <TooltipLabel>{label}</TooltipLabel>
      {payload.map((entry, i) => (
        <TooltipRow key={i}>
          <TooltipName>
            <TooltipDot $color={entry.color} />
            {entry.name}
          </TooltipName>
          <TooltipValue>
            {formatter ? formatter(entry.value) : entry.value}
          </TooltipValue>
        </TooltipRow>
      ))}
    </TooltipBox>
  );
}
