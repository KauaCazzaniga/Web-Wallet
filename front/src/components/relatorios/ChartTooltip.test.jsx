import { render, screen } from '@testing-library/react';
import { ChartTooltip } from './ChartTooltip';

const payload = [
  { name: 'Receita', value: 5000, color: '#22c55e' },
  { name: 'Despesa', value: 3000, color: '#ef4444' },
];

describe('ChartTooltip', () => {
  it('retorna null quando active é false', () => {
    const { container } = render(<ChartTooltip active={false} payload={payload} label="Jan" />);
    expect(container.firstChild).toBeNull();
  });

  it('retorna null quando payload está vazio', () => {
    const { container } = render(<ChartTooltip active={true} payload={[]} label="Jan" />);
    expect(container.firstChild).toBeNull();
  });

  it('retorna null quando payload é undefined', () => {
    const { container } = render(<ChartTooltip active={true} label="Jan" />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza o label quando ativo com payload válido', () => {
    render(<ChartTooltip active={true} payload={payload} label="Janeiro" />);
    expect(screen.getByText('Janeiro')).toBeInTheDocument();
  });

  it('renderiza todas as entradas do payload', () => {
    render(<ChartTooltip active={true} payload={payload} label="Jan" />);
    expect(screen.getByText('Receita')).toBeInTheDocument();
    expect(screen.getByText('Despesa')).toBeInTheDocument();
  });

  it('usa o formatter para exibir valores quando fornecido', () => {
    const formatter = (v) => `R$ ${v.toLocaleString('pt-BR')}`;
    render(<ChartTooltip active={true} payload={payload} label="Jan" formatter={formatter} />);
    expect(screen.getByText('R$ 5.000')).toBeInTheDocument();
    expect(screen.getByText('R$ 3.000')).toBeInTheDocument();
  });

  it('exibe o valor bruto quando formatter não é fornecido', () => {
    render(<ChartTooltip active={true} payload={payload} label="Jan" />);
    expect(screen.getByText('5000')).toBeInTheDocument();
    expect(screen.getByText('3000')).toBeInTheDocument();
  });

  it('renderiza múltiplas entradas sem erros', () => {
    const multiPayload = [
      { name: 'A', value: 100, color: '#fff' },
      { name: 'B', value: 200, color: '#000' },
      { name: 'C', value: 300, color: '#aaa' },
    ];
    render(<ChartTooltip active={true} payload={multiPayload} label="Mar" />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });
});
