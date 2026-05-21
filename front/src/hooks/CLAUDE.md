# hooks/

Responsabilidade: hooks reutilizáveis de lógica de estado e efeitos.

## Arquivos

### `useTransactions.js`

Gerencia estado, fetch e CRUD de transações do mês selecionado.
Recebe `mesSelecionado` ("YYYY-MM") e callbacks `{ notify, onMesesChanged, onLimitesLoaded }`.

**Cache em memória (`cacheRef`)**

O hook mantém um `Map` via `useRef` com o seguinte contrato:

| Comportamento | Regra |
|---|---|
| Cache hit (TTL < 5 min) | Retorna dados locais imediatamente, sem request HTTP |
| Cache miss | Fetch da API, armazena resultado no Map |
| `skipCache: true` | Ignora o cache e sempre busca da API |
| Toda mutação (add/delete/import) | Chama `cacheRef.current.clear()` — limpa **todos** os meses |

**Por que `clear()` e não `delete(mesSelecionado)`:**
`sincronizarCarteirasEmCadeia` propaga `saldo_inicial` para os meses N+1, N+2...
após cada mutação. Se apenas o mês atual fosse removido do cache, outros meses
ainda exibiriam `saldo_inicial` antigo (stale) dentro do TTL.

**`clearCache()`:**
Função exportada pelo hook para que handlers externos (Dashboard.jsx)
possam invalidar o cache após mutações que afetam meses diferentes do `mesSelecionado`
(ex: `handleSaveInvestment`, `handleConfirmImport`).

**Ciclo de vida do cache:**
O cache é por instância do hook — é destruído ao desmontar o Dashboard.
Não há benefício cross-page (Dashboard → Relatórios → Dashboard reinicia vazio).
O benefício é exclusivamente intra-sessão: troca de mês dentro do Dashboard
sem sair da página.

**Retorno do hook:**

| Campo | Tipo | Descrição |
|---|---|---|
| `transactions` | `Array` | Transações do mês (raw, sem filtro de soft-delete — já filtrado no fetch) |
| `transacoesMes` | `Array` | `transactions` ordenado por data desc (memoizado) |
| `resumoMes` | `Object` | `{ saldo_inicial, total_receitas, total_despesas, saldo_atual }` |
| `initialLoading` | `boolean` | true até o primeiro fetch completar (exibe skeleton) |
| `loadingMes` | `boolean` | true durante troca de mês (não exibido como skeleton) |
| `saving` | `boolean` | true durante `addTransaction` |
| `delConfirm` | `Object` | Estado do modal de confirmação de exclusão |
| `fetchMesSelecionado` | `Function` | `({ silent?, skipCache? })` — re-fetch manual |
| `clearCache` | `Function` | Limpa todo o cache — usar antes de mutations externas |
| `addTransaction` | `Function` | POST + invalida cache + re-fetch |
| `requestDelete` | `Function` | Abre modal de confirmação single |
| `cancelDelete` | `Function` | Fecha modal |
| `confirmDelete` | `Function` | DELETE otimista + invalida cache + re-fetch |
| `requestDeleteAll` | `Function` | Abre modal de confirmação em massa |
| `confirmDeleteAll` | `Function` | DELETE em massa + invalida cache + re-fetch |

### `useToast.js`

Gerencia estado de toast (`{ show, type, message }`).
Expõe `notify(mensagem, type?)` — exibe por 3 s e auto-fecha.

### `useScrollReveal.js`

Usa `IntersectionObserver` para animar seções ao entrar no viewport.
Retorna `[ref, visible]` — `visible` vira `true` uma única vez (one-shot).

### `useCountUp.js`

Anima um número de 0 até `target` usando `requestAnimationFrame`.
Usado nos KPI cards do Dashboard para animar receitas, despesas e saldo.

## Regras

- **Não duplicar lógica de fetch fora de `useTransactions`** — todo acesso a
  `/wallet/extrato/:competencia` passa por esse hook para se beneficiar do cache.
- **`clearCache()` obrigatório antes de qualquer `fetchMesSelecionado({ skipCache: true })`
  em handlers externos** (fora do próprio hook) que seguem uma mutação. Sem isso,
  meses downstream ficam com `saldo_inicial` desatualizado no cache.
- **Não passar `onLimitesLoaded` como arrow function inline** no call site —
  isso recria a referência a cada render, recria `fetchMesSelecionado` via `useCallback`,
  e dispara o `useEffect` de fetch desnecessariamente. Usar `useCallback` no pai.
