# components/relatorios/

Responsabilidade: componentes visuais exclusivos da página Relatórios.
Todos recebem dados já processados — nenhum faz chamada à API diretamente.

## Arquivos

### `FiltroMes.jsx`
Dois inputs `type="month"` (De / Até). Emite `onChangeFiltro({ inicio, fim })`.
Valores padrão: últimos 6 meses até o mês atual (`getDefaultReportRange()`).

### `CardsResumo.jsx`
Quatro cards de KPI: receitas totais, despesas totais, saldo do período e
média mensal de gastos. Props: `{ dados }` (array de meses processados).

### `GraficoBarrasMensal.jsx`
Recharts `BarChart` com barras lado a lado: receita (azul) × despesa (vermelho)
por mês. Props: `{ data }` (array `{ mes, label, receita, despesa }`).

### `GraficoSaldoAcumulado.jsx`
Recharts `ComposedChart` com linha + área preenchida mostrando evolução do
saldo acumulado mês a mês. Props: `{ data }`.

### `TabelaComparativo.jsx`
Tabela mensal com colunas: mês, receita, despesa, saldo, variação % receita,
variação % despesa. Primeira linha sem variação (sem mês anterior).
Props: `{ data }`.

### `CardTaxaPoupanca.jsx`
Card com taxa de poupança mensal `(receita - despesa) / receita * 100`.
Barras coloridas por faixa (verde ≥ 10%, âmbar < 10%), badge de média e
alerta visual para meses abaixo de 10%. Props: `{ data }`.

## Regras

- **Nenhum componente aqui faz fetch** — dados chegam todos via props da página
  `Relatorios.jsx` que centraliza o estado.
- Usar `formatCurrencyBRL` de `relatorioCalc.js` para todos os valores monetários.
- Cores de gráfico: receita `#22c55e`, despesa `#ef4444`, saldo `#60a5fa` —
  manter consistência com o tema geral.
- Responsividade: usar `<ResponsiveContainer width="100%" height={...}>` do
  Recharts em todos os gráficos.
