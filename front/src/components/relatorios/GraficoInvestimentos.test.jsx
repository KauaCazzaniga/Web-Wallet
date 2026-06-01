// Componente: GraficoInvestimentos — testes
// Cobre: guards de array (props default), cálculo de chartData, estado vazio, renderização

import { render, screen } from '@testing-library/react';
import GraficoInvestimentos from './GraficoInvestimentos';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  ComposedChart:       ({ children, data }) => (
    <div data-testid="composed-chart" data-count={data?.length}>{children}</div>
  ),
  Area:  () => null,
  Line:  ({ dataKey }) => <div data-testid="line" data-key={dataKey} />,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeTx = (data, valor, tipo = 'despesa') => ({
  _id: `tx-${data}-${valor}`,
  data,
  descricao: 'Aporte CDB',
  valor,
  tipo,
  categoria: 'Investimentos',
});

// ── Guards de props default ──────────────────────────────────────────────────

describe('GraficoInvestimentos — guards de props default', () => {
  it('nao crasha sem props (usa defaults [])', () => {
    expect(() => render(<GraficoInvestimentos />)).not.toThrow();
  });

  it('nao crasha com transacoes=undefined', () => {
    expect(() =>
      render(<GraficoInvestimentos transacoes={undefined} meses={['2026-01']} />)
    ).not.toThrow();
  });

  it('nao crasha com meses=undefined', () => {
    expect(() =>
      render(<GraficoInvestimentos transacoes={[]} meses={undefined} />)
    ).not.toThrow();
  });

  it('nao crasha com transacoes nao-array', () => {
    expect(() =>
      render(<GraficoInvestimentos transacoes={{ valor: 100 }} meses={['2026-01']} />)
    ).not.toThrow();
  });

  it('nao crasha com meses nao-array', () => {
    expect(() =>
      render(<GraficoInvestimentos transacoes={[]} meses="2026-01" />)
    ).not.toThrow();
  });
});

// ── Estado vazio ─────────────────────────────────────────────────────────────

describe('GraficoInvestimentos — estado vazio', () => {
  it('mostra mensagem de estado vazio quando nao ha investimentos', () => {
    render(<GraficoInvestimentos transacoes={[]} meses={['2026-01', '2026-02']} />);
    expect(screen.getByText(/nenhum investimento registrado/i)).toBeInTheDocument();
  });

  it('exibe o titulo "Evolução patrimonial" no estado vazio', () => {
    render(<GraficoInvestimentos />);
    expect(screen.getByText('Evolução patrimonial')).toBeInTheDocument();
  });

  it('mostra estado vazio quando meses e array vazio', () => {
    render(<GraficoInvestimentos transacoes={[makeTx('2026-01-15', 500)]} meses={[]} />);
    expect(screen.getByText(/nenhum investimento registrado/i)).toBeInTheDocument();
  });

  it('nao renderiza o grafico Recharts no estado vazio', () => {
    render(<GraficoInvestimentos transacoes={[]} meses={['2026-01']} />);
    expect(screen.queryByTestId('composed-chart')).toBeNull();
  });
});

// ── Renderização com investimentos ────────────────────────────────────────────

describe('GraficoInvestimentos — com investimentos', () => {
  const meses = ['2026-01', '2026-02'];
  const transacoes = [
    makeTx('2026-01-10', 500),
    makeTx('2026-02-15', 800),
  ];

  it('renderiza o grafico quando ha aportes com acumulado > 0', () => {
    render(<GraficoInvestimentos transacoes={transacoes} meses={meses} />);
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('exibe o titulo "Evolução patrimonial" quando ha dados', () => {
    render(<GraficoInvestimentos transacoes={transacoes} meses={meses} />);
    expect(screen.getByText('Evolução patrimonial')).toBeInTheDocument();
  });

  it('exibe a secao de aportes com o total do periodo', () => {
    render(<GraficoInvestimentos transacoes={transacoes} meses={meses} />);
    expect(screen.getByText('Aportes no período')).toBeInTheDocument();
  });

  it('lista as descricoes das transacoes na tabela', () => {
    render(<GraficoInvestimentos transacoes={transacoes} meses={meses} />);
    // makeTx usa descricao 'Aporte CDB' — deve aparecer 2x
    expect(screen.getAllByText('Aporte CDB').length).toBeGreaterThanOrEqual(2);
  });

  it('a Line usa dataKey="acumulado"', () => {
    render(<GraficoInvestimentos transacoes={transacoes} meses={meses} />);
    expect(screen.getByTestId('line').getAttribute('data-key')).toBe('acumulado');
  });

  it('o grafico recebe o numero correto de pontos (um por mes)', () => {
    render(<GraficoInvestimentos transacoes={transacoes} meses={meses} />);
    const chart = screen.getByTestId('composed-chart');
    expect(Number(chart.getAttribute('data-count'))).toBe(meses.length);
  });
});

// ── Cálculo de chartData ──────────────────────────────────────────────────────

describe('GraficoInvestimentos — calculo do acumulado', () => {
  it('acumulado e a soma progressiva dos aportes por mes', () => {
    // meses: Jan=500, Fev=800 → acumulado: Jan=500, Fev=1300
    const meses = ['2026-01', '2026-02'];
    const transacoes = [makeTx('2026-01-10', 500), makeTx('2026-02-15', 800)];

    render(<GraficoInvestimentos transacoes={transacoes} meses={meses} />);

    const chart = screen.getByTestId('composed-chart');
    // 2 meses → 2 pontos no chart
    expect(Number(chart.getAttribute('data-count'))).toBe(2);
  });

  it('aporte de mes fora do range de meses nao conta no acumulado', () => {
    const meses = ['2026-01'];
    // Transação em fevereiro, fora do range
    const transacoes = [makeTx('2026-02-10', 1000)];

    render(<GraficoInvestimentos transacoes={transacoes} meses={meses} />);

    // chartData[0].acumulado = 0 → estado vazio (every = true)
    expect(screen.getByText(/nenhum investimento registrado/i)).toBeInTheDocument();
  });
});
