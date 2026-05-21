// Testa GraficoBarrasMensal: estrutura do card, integração ChartTooltip, mediaDespesas

import React from 'react';
import { render, screen } from '@testing-library/react';
import GraficoBarrasMensal from './GraficoBarrasMensal';
import { ChartTooltip } from './ChartTooltip';
import { formatCurrencyBRL } from '../../utils/relatorioCalc';

// ── Mock Recharts ─────────────────────────────────────────────────────────────
// Recharts depende de DOM layout que jsdom não suporta; mocamos os componentes
// para isolar testes ao comportamento do wrapper e das props passadas.

vi.mock('recharts', () => {
  const passThrough = ({ children }) => <div>{children}</div>;
  const noop = () => null;
  return {
    BarChart:           ({ children }) => <div data-testid="bar-chart">{children}</div>,
    Bar:                ({ dataKey, name, fill }) => (
      <div data-testid={`bar-${dataKey}`} data-name={name} data-fill={fill} />
    ),
    CartesianGrid:      noop,
    ReferenceLine:      ({ y, label }) => (
      <div data-testid="reference-line" data-y={y}>
        {label?.value && <span>{label.value}</span>}
      </div>
    ),
    ResponsiveContainer: passThrough,
    Tooltip:            ({ content }) => {
      // Simula o Recharts chamando o componente de tooltip com props típicas
      if (!content) return null;
      return React.cloneElement(content, {
        active: true,
        payload: [
          { name: 'Receita', value: 5000, color: '#1D9E75' },
          { name: 'Despesa', value: 3000, color: '#E24B4A' },
        ],
        label: 'Jan',
      });
    },
    XAxis: noop,
    YAxis: noop,
  };
});

// ── Dados de teste ─────────────────────────────────────────────────────────────

const sampleData = [
  { mes: '2026-01', label: 'Jan', labelCompleto: 'Janeiro 2026', receita: 5000, despesa: 3000, saldo: 2000, varDespesa: null, mesAnteriorLabel: null },
  { mes: '2026-02', label: 'Fev', labelCompleto: 'Fevereiro 2026', receita: 4800, despesa: 3200, saldo: 1600, varDespesa: 6.7, mesAnteriorLabel: 'Jan' },
  { mes: '2026-03', label: 'Mar', labelCompleto: 'Março 2026',    receita: 5200, despesa: 2800, saldo: 2400, varDespesa: -12.5, mesAnteriorLabel: 'Fev' },
];

const mediaDespesas = 3000;

function renderChart(props = {}) {
  return render(
    <GraficoBarrasMensal
      data={sampleData}
      mediaDespesas={mediaDespesas}
      {...props}
    />
  );
}

// ── Estrutura do card ─────────────────────────────────────────────────────────

describe('GraficoBarrasMensal — estrutura do card', () => {
  it('exibe o título "Gastos por mês"', () => {
    renderChart();
    expect(screen.getByText('Gastos por mês')).toBeInTheDocument();
  });

  it('exibe a descrição do gráfico', () => {
    renderChart();
    expect(screen.getByText(/compare receitas e despesas/i)).toBeInTheDocument();
  });

  it('renderiza o BarChart', () => {
    renderChart();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });
});

// ── Barras (Bar) ──────────────────────────────────────────────────────────────

describe('GraficoBarrasMensal — barras', () => {
  it('renderiza a barra de receita com a cor correta', () => {
    renderChart();
    const barReceita = screen.getByTestId('bar-receita');
    expect(barReceita).toBeInTheDocument();
    expect(barReceita.getAttribute('data-fill')).toBe('#1D9E75');
  });

  it('renderiza a barra de despesa com a cor correta', () => {
    renderChart();
    const barDespesa = screen.getByTestId('bar-despesa');
    expect(barDespesa).toBeInTheDocument();
    expect(barDespesa.getAttribute('data-fill')).toBe('#E24B4A');
  });

  it('barra de receita tem name="Receita"', () => {
    renderChart();
    expect(screen.getByTestId('bar-receita').getAttribute('data-name')).toBe('Receita');
  });

  it('barra de despesa tem name="Despesa"', () => {
    renderChart();
    expect(screen.getByTestId('bar-despesa').getAttribute('data-name')).toBe('Despesa');
  });
});

// ── Linha de referência (média) ───────────────────────────────────────────────

describe('GraficoBarrasMensal — linha de referência', () => {
  it('renderiza a linha de referência com o valor de mediaDespesas', () => {
    renderChart();
    const line = screen.getByTestId('reference-line');
    expect(line).toBeInTheDocument();
    expect(Number(line.getAttribute('data-y'))).toBe(mediaDespesas);
  });

  it('exibe o label da média com o valor formatado', () => {
    renderChart();
    // label.value = "Média: R$ 3.000,00"
    expect(screen.getByText(/média:/i)).toBeInTheDocument();
    // "3.000,00" também aparece no ChartTooltip (Despesa = 3000); usamos getAllByText
    expect(screen.getAllByText(/3\.000,00/).length).toBeGreaterThanOrEqual(1);
  });

  it('atualiza o label quando mediaDespesas muda', () => {
    renderChart({ mediaDespesas: 4500 });
    expect(screen.getByText(/4\.500,00/)).toBeInTheDocument();
  });
});

// ── Integração ChartTooltip ───────────────────────────────────────────────────

describe('GraficoBarrasMensal — integração ChartTooltip', () => {
  it('passa formatter baseado em formatCurrencyBRL para o ChartTooltip', () => {
    renderChart();
    // O mock de Tooltip renderiza o tooltip ativo com payload simulado
    // ChartTooltip formata os valores: 5000 → "R$ 5.000,00"
    expect(screen.getByText(/5\.000,00/)).toBeInTheDocument();
    // "3.000,00" aparece também no label da referência; confirmamos ao menos 1
    expect(screen.getAllByText(/3\.000,00/).length).toBeGreaterThanOrEqual(1);
  });

  it('ChartTooltip exibe os nomes "Receita" e "Despesa"', () => {
    renderChart();
    expect(screen.getByText('Receita')).toBeInTheDocument();
    expect(screen.getByText('Despesa')).toBeInTheDocument();
  });

  it('ChartTooltip exibe o label do mês como cabeçalho', () => {
    renderChart();
    // label="Jan" passado pelo mock de Tooltip
    expect(screen.getByText('Jan')).toBeInTheDocument();
  });
});

// ── ChartTooltip unitário — formatter ────────────────────────────────────────

describe('ChartTooltip — formatter de moeda', () => {
  const payload = [
    { name: 'Receita', value: 7500, color: '#1D9E75' },
  ];

  it('formata o valor com formatCurrencyBRL quando formatter é passado', () => {
    render(
      <ChartTooltip
        active={true}
        payload={payload}
        label="Fev"
        formatter={formatCurrencyBRL}
      />
    );
    expect(screen.getByText(/7\.500,00/)).toBeInTheDocument();
  });

  it('exibe o valor bruto quando nenhum formatter é passado', () => {
    render(
      <ChartTooltip
        active={true}
        payload={[{ name: 'Receita', value: 999, color: '#1D9E75' }]}
        label="Mar"
      />
    );
    expect(screen.getByText('999')).toBeInTheDocument();
  });

  it('retorna null quando active=false', () => {
    const { container } = render(
      <ChartTooltip active={false} payload={payload} label="Jan" formatter={formatCurrencyBRL} />
    );
    expect(container.firstChild).toBeNull();
  });
});
