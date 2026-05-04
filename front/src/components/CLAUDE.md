# components/

Responsabilidade: componentes React reutilizáveis fora do escopo de uma única página.

## Arquivos raiz

### `ProtectedRoute.jsx`
Guarda de rota — lê `authenticated` do `AuthContext`. Se falso, redireciona para
`/login` com `<Navigate replace>`. Envolve todas as rotas privadas em `App.jsx`.

### `ImportButton.jsx`
Botão que abre o file picker nativo (`<input type="file" accept=".pdf">`).
Ao selecionar um PDF chama `extractTextFromPdf` e passa o texto para o pai via
callback `onExtracted`. Não faz parsing — apenas extração de texto.

### `ImportModal.jsx`
Modal de revisão das transações extraídas do PDF antes de confirmar a importação.
Recebe `transacoes` (brutas), exibe `TransacaoCategorizavel` para cada item,
e ao confirmar chama `importTransactionsBatch` do `FinanceContext`.

### `TransacaoCategorizavel.jsx`
Linha editável dentro do `ImportModal` — permite ao usuário ajustar categoria,
tipo e valor de cada transação antes de importar.

### `GerenciarMetas.jsx`
Modal autônomo de gerenciamento de metas de gastos. Lê e salva `metas` e
`gastosFixosMetas` via `useFinance()`. Sincroniza limites no backend via
`PUT /wallet/:competencia/limites` como operação secundária.

Props: `{ mesSelecionado, notify }`

## Subpastas

- `relatorios/` — componentes exclusivos da página Relatórios (ver CLAUDE.md lá)

## Regras

- Componentes aqui devem ser **agnósticos de página** — se só faz sentido em
  uma página, fica no arquivo da página mesmo.
- Estilização com **styled-components** usando `--dash-*` CSS variables.
  Sem Tailwind, sem inline style exceto valores dinâmicos pontuais.
- Props booleanas de estilo devem ser transient (`$dark`, `$active`, `$off`).
- Nunca usar `window.alert` / `window.confirm` — usar `notify()` passado por prop
  ou o sistema de toast da página.
