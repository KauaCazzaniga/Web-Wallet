# context/

Responsabilidade: estado global persistido no localStorage, compartilhado entre
páginas (Dashboard ↔ Relatórios).

## Arquivos

### `FinanceContext.jsx`

Provider: `FinanceProvider` — recebe `userKey` (derivado de `user._id` ou
`user.email`) para isolar dados por usuário.

Hook de acesso: `useFinance()` — lança erro se usado fora do provider.

**Estados expostos:**

| Estado | Tipo | Fonte | Descrição |
|--------|------|-------|-----------|
| `importedTransactions` | Array | localStorage | Transações importadas via PDF (legado) |
| `investimentos` | Array | localStorage | Aportes manuais (legado — não afetam saldo) |
| `highlightedIds` | Array | memória | IDs com highlight temporário (3 s) |
| `metas` | Object | localStorage | `{ categoria: number }` — metas normais |
| `gastosFixosMetas` | Object | localStorage | `{ key: number }` — metas de gastos fixos |

**Funções expostas:**

| Função | Parâmetros | O que faz |
|--------|-----------|-----------|
| `importTransactionsBatch(txs[])` | array | Normaliza, gera `_id`, aciona highlight |
| `removeImportedTransaction(id)` | string | Remove por `_id` |
| `adicionarAporte(mes, valor, desc?)` | — | Adiciona aporte (localStorage only, legado) |
| `salvarMetas(novasMetas, novosGfMetas)` | objects | Atualiza ambos os estados de meta |

**Chaves do localStorage:**

| Chave | Conteúdo |
|-------|----------|
| `@WebWallet:imports:${userKey}` | Transações importadas (legado) |
| `webwallet_investimentos` | Aportes manuais (legado) |
| `webwallet_metas:${userKey}` | Metas normais |
| `webwallet_gastos_fixos_metas:${userKey}` | Metas de gastos fixos |

## Regras

- **Padrão de hydration**: leitura em `useEffect([userKey])` com try/catch +
  flag `*Hydrated`; escrita só após `*Hydrated === true`.
- **Não salvar `mesSelecionado` aqui** — é estado local do Dashboard.
- `FinanceProvider` fica em `App.jsx` envolvendo todas as rotas — não mover
  para dentro de uma página específica.
- `investimentos` e `adicionarAporte` são legados — novos aportes são
  registrados como transações com `categoria: 'Investimentos'` via API.
