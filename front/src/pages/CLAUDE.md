# pages/

Responsabilidade: páginas completas — gerenciam estado local, fazem fetch e
compõem componentes.

## Arquivos

### `Dashboard.jsx`
Página principal. Estado local relevante:

| Estado | Descrição |
|--------|-----------|
| `mesSelecionado` | "YYYY-MM" ativo; persiste em `webwallet_mes_selecionado` |
| `transactions` | Transações do mês (do backend) |
| `resumoMes` | `{ saldo_inicial, total_receitas, total_despesas, saldo_atual }` |
| `mesesDisponiveis` | Array "YYYY-MM" com dados no backend |
| `paginaAtual` | Página da tabela de transações (15 por página) |
| `totalInvestido` | Patrimônio acumulado até `mesSelecionado` (fetch backend) |

Dados derivados via `useMemo`: `transacoesMes`, `transacoesPaginadas`,
`kpiReceitas`, `kpiDespesas`, `kpiSaldo`, `gastosAtuais`, `limites`,
`aporteMesSelecionado`.

Fluxo de fetch:
1. `fetchMesesDisponiveis` — GET /wallet/meses
2. `fetchMesSelecionado` — GET /wallet/extrato/:competencia
3. `totalInvestido` — GET /wallet/total-investido?ate=:competencia

Mês histórico = `mesSelecionado !== competenciaHoje()` → botões de ação
desabilitados (sem add, sem import, sem aporte).

### `Relatorios.jsx`
Relatórios mensais. Busca todos os meses com dados e monta array
`mesesProcessados` via `processarMeses()`. Compõe:
`FiltroMes`, `CardsResumo`, `GraficoBarrasMensal`, `GraficoSaldoAcumulado`,
`CardTaxaPoupanca`, `TabelaComparativo`.

### `Login.jsx` / `Register.jsx`
Formulários de autenticação. Chamam `login()` / `register()` do `AuthContext`.
Redirecionam para `/dashboard` em caso de sucesso.

### `Index.jsx`
Landing page pública (`/`). Sem estado, sem fetch.

## Regras

- **Não subir estado do Dashboard para o contexto global** — `mesSelecionado`,
  `transactions` e `resumoMes` são locais à página.
- `ITEMS_POR_PAGINA = 15` — constante no topo do arquivo; não hardcodar em
  outro lugar.
- `competenciaHoje()` retorna o mês atual em "YYYY-MM" — usar sempre que precisar
  do mês padrão sem depender de estado.
- **`sincronizarCarteirasEmCadeia` já é chamada pelo backend** em toda mutação —
  não há necessidade de re-fetch completo, basta `fetchMesSelecionado({ silent: true })`.
- Styled-components do Dashboard usam variáveis `--dash-*`; os de Relatórios
  usam `--rel-*`. Não misturar.
