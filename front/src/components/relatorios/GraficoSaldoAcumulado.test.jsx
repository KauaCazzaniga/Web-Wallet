// Testa GraficoSaldoAcumulado: estrutura do card, cor por hasNegative, ChartTooltip

import React from 'react';
import { render, screen } from '@testing-library/react';
import GraficoSaldoAcumulado from './GraficoSaldoAcumulado';
import { ChartTooltip } from './ChartTooltip';
import { formatCurrencyBRL } from '../../utils/relatorioCalc';

// ── Mock Recharts ─────────────────────────────────────────────────────────────

vi.mock('recharts', () => {
  const noop = () => null;
  return {
    ComposedChart:      ({ children }) => <div data-testid="composed-chart">{children}</div>,
    Area:               ({ dataKey, fill }) => (
      <div data-testid="area" data-key={dataKey} data-fill={fill} />
    ),
    Line:               ({ dataKey, stroke }) => (
      <div data-testid="line" data-key={dataKey} data-stroke={stroke} />
    ),
    CartesianGrid:      noop,
    ReferenceLine:      ({ y }) => <div data-testid="reference-line" data-y={y} />,
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
    Tooltip:            ({ content }) => {
      if (!content) return null;
      return React.cloneElement(content, {
        active: true,
        payload: [
          { name: 'Saldo Acumulado', value: 12000, color: '#378ADD' },
        ],
        label: 'Jan',
      });
    },
    XAxis: noop,
    YAxis: noop,
  };
});

// ── Dados de teste ─────────────────────────────────────────────────────────────

const dataPositivo = [
  { mes: '2026-01', label: 'Jan', labelCompleto: 'Janeiro 2026', saldoAcumulado: 2000, saldo: 2000 },
  { mes: '2026-02', label: 'Fev', labelCompleto: 'Fevereiro 2026', saldoAcumulado: 3500, saldo: 1500 },
  { mes: '2026-03', label: 'Mar', labelCompleto: 'Março 2026',    saldoAcumulado: 5000, saldo: 1500 },
];

const dataNegativo = [
  { mes: '2026-01', label: 'Jan', labelCompleto: 'Janeiro 2026', saldoAcumulado: 1000,  saldo: 1000 },
  { mes: '2026-02', label: 'Fev', labelCompleto: 'Fevereiro 2026', saldoAcumulado: -500, saldo: -1500 },
];

// ── Estrutura do card ─────────────────────────────────────────────────────────

describe('GraficoSaldoAcumulado — estrutura do card', () => {
  it('exibe o título "Saldo acumulado"', () => {
    render(<GraficoSaldoAcumulado data={dataPositivo} />);
    expect(screen.getByText('Saldo acumulado')).toBeInTheDocument();
  });

  it('exibe a descrição do gráfico', () => {
    render(<GraficoSaldoAcumulado data={dataPositivo} />);
    expect(screen.getByText(/evolução do saldo/i)).toBeInTheDocument();
  });

  it('renderiza o ComposedChart', () => {
    render(<GraficoSaldoAcumulado data={dataPositivo} />);
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('renderiza a linha de referência em y=0', () => {
    render(<GraficoSaldoAcumulado data={dataPositivo} />);
    const line = screen.getByTestId('reference-line');
    expect(Number(line.getAttribute('data-y'))).toBe(0);
  });
});

// ── Lógica de cor (hasNegative) ───────────────────────────────────────────────

describe('GraficoSaldoAcumulado — cor baseada em hasNegative', () => {
  it('usa stroke azul (#378ADD) quando todos saldos são positivos', () => {
    render(<GraficoSaldoAcumulado data={dataPositivo} />);
    const line = screen.getByTestId('line');
    expect(line.getAttribute('data-stroke')).toBe('#378ADD');
  });

  it('usa stroke vermelho (#E24B4A) quando há saldo negativo', () => {
    render(<GraficoSaldoAcumulado data={dataNegativo} />);
    const line = screen.getByTestId('line');
    expect(line.getAttribute('data-stroke')).toBe('#E24B4A');
  });

  it('usa fill azul na área quando todos saldos são positivos', () => {
    render(<GraficoSaldoAcumulado data={dataPositivo} />);
    const area = screen.getByTestId('area');
    // fill usa url(#saldoArea) que é construído com a cor azul no linearGradient
    expect(area.getAttribute('data-fill')).toBe('url(#saldoArea)');
  });

  it('mantém azul com array de dados vazio (sem negativo)', () => {
    render(<GraficoSaldoAcumulado data={[]} />);
    const line = screen.getByTestId('line');
    expect(line.getAttribute('data-stroke')).toBe('#378ADD');
  });

  it('detecta negativo mesmo com apenas um item negativo no meio do array', () => {
    const dataMisto = [
      { mes: '2026-01', label: 'Jan', saldoAcumulado: 500, saldo: 500 },
      { mes: '2026-02', label: 'Fev', saldoAcumulado: -100, saldo: -600 },
      { mes: '2026-03', label: 'Mar', saldoAcumulado: 200, saldo: 300 },
    ];
    render(<GraficoSaldoAcumulado data={dataMisto} />);
    const line = screen.getByTestId('line');
    expect(line.getAttribute('data-stroke')).toBe('#E24B4A');
  });
});

// ── Série (Line + Area) ───────────────────────────────────────────────────────

describe('GraficoSaldoAcumulado — série saldoAcumulado', () => {
  it('a Line usa dataKey="saldoAcumulado"', () => {
    render(<GraficoSaldoAcumulado data={dataPositivo} />);
    expect(screen.getByTestId('line').getAttribute('data-key')).toBe('saldoAcumulado');
  });

  it('a Area usa dataKey="saldoAcumulado"', () => {
    render(<GraficoSaldoAcumulado data={dataPositivo} />);
    expect(screen.getByTestId('area').getAttribute('data-key')).toBe('saldoAcumulado');
  });
});

// ── Integração ChartTooltip ───────────────────────────────────────────────────

describe('GraficoSaldoAcumulado — integração ChartTooltip', () => {
  it('passa formatter com formatCurrencyBRL e exibe valor formatado', () => {
    render(<GraficoSaldoAcumulado data={dataPositivo} />);
    // payload simulado tem value: 12000
    expect(screen.getByText(/12\.000,00/)).toBeInTheDocument();
  });

  it('ChartTooltip exibe o label do eixo X', () => {
    render(<GraficoSaldoAcumulado data={dataPositivo} />);
    // label="Jan" passado pelo mock de Tooltip
    expect(screen.getByText('Jan')).toBeInTheDocument();
  });
});

// ── ChartTooltip unitário (com dados de saldo) ────────────────────────────────

describe('ChartTooltip — com saldo acumulado', () => {
  it('formata saldo positivo corretamente', () => {
    render(
      <ChartTooltip
        active={true}
        payload={[{ name: 'Saldo Acumulado', value: 8750, color: '#378ADD' }]}
        label="Mar"
        formatter={formatCurrencyBRL}
      />
    );
    expect(screen.getByText(/8\.750,00/)).toBeInTheDocument();
    expect(screen.getByText('Mar')).toBeInTheDocument();
  });

  it('formata saldo negativo corretamente', () => {
    render(
      <ChartTooltip
        active={true}
        payload={[{ name: 'Saldo Acumulado', value: -2300, color: '#E24B4A' }]}
        label="Fev"
        formatter={formatCurrencyBRL}
      />
    );
    expect(screen.getByText(/-\s*R\$\s*2\.300,00/)).toBeInTheDocument();
  });

  it('retorna null quando payload está vazio', () => {
    const { container } = render(
      <ChartTooltip active={true} payload={[]} label="Jan" formatter={formatCurrencyBRL} />
    );
    expect(container.firstChild).toBeNull();
  });
});
