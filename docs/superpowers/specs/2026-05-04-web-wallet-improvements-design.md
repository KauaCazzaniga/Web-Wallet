# Web-Wallet — Roadmap de Melhorias

**Data:** 2026-05-04  
**Contexto:** Projeto pessoal/portfolio, sem usuários reais ainda.  
**Objetivo:** Levar o app a um estado produção-ready com roadmap priorizado cobrindo UX, arquitetura, features e qualidade.  
**Abordagem:** Sprints temáticos — cada sprint tem resultado visível e melhoria interna.

---

## Sprint 1 — UX & Feedback

> Maior fraqueza atual do app. Resultado visual imediato.

### 1.1 Empty States com CTA

**Problema:** Tabela de transações vazia exibe apenas uma tabela em branco — sem orientação ao usuário.  
**Solução:** Componente `EmptyState` reutilizável com ícone, mensagem contextual e botão de ação primária.  
**Onde aplicar:** Tabela de transações no Dashboard (sem lançamentos no mês) e página Relatórios (sem dados no período).  
**Comportamento:** Ao clicar no CTA do empty state, abre o modal de adicionar transação diretamente.

### 1.2 Loading Skeletons

**Problema:** Import de PDF via Gemini leva 2-3s sem nenhum feedback visual além do botão desabilitado.  
**Solução:** Durante `importingExtract === true`, substituir as linhas da tabela por skeleton rows animados (pulse animation). Adicionar mensagem "Processando extrato com IA..." no ImportModal.  
**Onde aplicar:** `ImportModal.jsx` durante o parse e `Dashboard.jsx` durante o carregamento inicial de dados.

### 1.3 Escape Key nos Modais

**Problema:** Nenhum dos 4 modais do Dashboard responde à tecla Escape — usuários de teclado ficam presos.  
**Solução:** `useEffect` com `addEventListener('keydown', e => e.key === 'Escape' && fecharModal())` em cada modal. Cleanup no return do effect.  
**Modais afetados:** modal de transação, modal de deletar, modal de investimento, modal de confirmação de deletar tudo.

### 1.4 ARIA Labels + Focus Visible

**Problema:** Inputs sem `<label>` associado, botões de ícone sem `aria-label`, outline de foco removido pelo reset global.  
**Solução:**
- Adicionar `aria-label` em todos os inputs sem label visível (ex: campo de busca, inputs do form de transação).
- Adicionar `aria-label` em botões que usam apenas ícone (hamburguer, fechar modal, deletar transação).
- Global em `global.js`: `:focus-visible { outline: 2px solid var(--dash-primary); outline-offset: 2px; }`.

### 1.5 Promise.allSettled em Relatórios

**Problema:** `carregarPeriodo` em `Relatorios.jsx` usa `Promise.all` — se qualquer mês retornar erro de rede (não 404), o relatório inteiro falha.  
**Solução:** Substituir por `Promise.allSettled`. Meses com status `'rejected'` retornam array vazio e disparam um aviso: "Dados de X meses indisponíveis — tente novamente."

### 1.6 Confirmação Antes de Deletar em Massa

**Problema:** `requestDeleteAll` não informa quantas transações serão removidas antes de executar.  
**Solução:** Modal de confirmação exibindo "Remover N transações de mês/ano?" com botão destrutivo vermelho e botão cancelar. N é calculado a partir das transações carregadas no estado.

### 1.7 Toast Safe Area Mobile

**Problema:** Toast posicionado em `bottom: 2rem; right: 2rem` pode sobrepor conteúdo em dispositivos com notch ou barra de navegação.  
**Solução:** Adicionar `padding-bottom: env(safe-area-inset-bottom, 0)` ao `ToastContainer`.

### 1.8 Erros Silenciosos → Toast

**Problema:** Vários `useEffect` têm `catch(() => {})` que engolam erros silenciosamente. Usuário não sabe que dados estão desatualizados.  
**Afetados:** fetch de `total-investido`, `fetchTransactionsByCompetencia` e outros.  
**Solução:** Todos os catch devem chamar `notify('Erro ao carregar dados', 'error')` e logar o erro no console.

---

## Sprint 2 — Arquitetura

> Reduz dívida técnica sem mudar comportamento visível.

### 2.1 Split do Dashboard.jsx

**Problema:** `Dashboard.jsx` tem 1022 linhas gerenciando sidebar, 4 modais, CRUD de transações, investimentos, importação, paginação e toasts — impossível de manter ou testar.

**Divisão proposta:**

| Arquivo | Responsabilidade |
|---|---|
| `pages/Dashboard.jsx` | Orquestrador — estado global, layout, chamadas de hook |
| `components/dashboard/TransactionPanel.jsx` | Tabela, paginação, modais de transação |
| `components/dashboard/GoalsPanel.jsx` | Acordeão de gastos fixos + barras de progresso |
| `components/dashboard/InvestmentPanel.jsx` | Aportes, total investido, modal de investimento |
| `hooks/useTransactions.js` | Fetch, add, delete, deleteAll, paginação |
| `hooks/useToast.js` | Estado show/message/type + função notify |

**Regra:** Nenhum componente filho chama a API diretamente — tudo passa pelos hooks.

### 2.2 useTransactions Hook

**Extrai do Dashboard:** `transactions`, `loading`, `fetchTransactions`, `handleAddTransaction`, `handleDeleteTransaction`, `handleDeleteAll`, `page`, `setPage`, `totalPages`.  
**Interface:** `const { transactions, loading, addTransaction, deleteTransaction, ... } = useTransactions(mesSelecionado)`.

### 2.3 useToast Hook

**Extrai do Dashboard:** `toast`, `notify`, `useEffect` do timeout.  
**Interface:** `const { toast, notify } = useToast()`.  
**Benefício:** Reutilizável em Relatórios sem duplicar lógica.

### 2.4 ErrorBoundary

**Problema:** Erro de renderização em qualquer componente derruba o app inteiro (tela branca).  
**Solução:** Componente `ErrorBoundary` (class component React) wrapping as rotas protegidas em `App.jsx`. Exibe tela de fallback com botão "Recarregar página" e mensagem de erro.

### 2.5 normalizeTransaction Compartilhado

**Problema:** Função `normalizeTransaction` existe apenas em `Relatorios.jsx`. Dashboard usa formato diferente internamente — risco de divergência.  
**Solução:** Mover para `src/utils/transaction.js`, exportar e importar nos dois lugares.

### 2.6 Logging Estruturado no Backend (Winston)

**Problema:** `console.log` e `console.error` espalhados em `walletController.js` e `authController.js` sem nível, sem contexto, sem formato consistente.  
**Solução:** Instalar `winston`, criar `back/src/config/logger.js` com transports para console (dev) e file (prod). Substituir todos os `console.*` por `logger.info/warn/error`.

---

## Sprint 3 — Features

> Completa funcionalidades incompletas e adiciona as mais pedidas.

### 3.1 editarAporte + removerAporte

**Contexto:** TODO existente em `FinanceContext.jsx:187`.  
**Solução:**
- `editarAporte(id, { valor, descricao })` — atualiza o aporte pelo id, valida valor > 0, persiste no localStorage.
- `removerAporte(id)` — remove do array, persiste.
- Expor ambas via `useFinance()`.
- Na página Relatórios, adicionar botões de editar/remover na tabela de aportes.

### 3.2 Busca + Filtro por Categoria nas Transações

**Problema:** Tabela de transações não tem busca — difícil encontrar um lançamento específico em meses com muitas entradas.  
**Solução:** Acima da tabela no Dashboard, adicionar:
- Input de busca (filtra por `descricao` com debounce de 300ms).
- Dropdown de categoria (filtra pelo campo `categoria`).
- Filtros aplicados localmente no array já carregado — sem nova chamada à API.
- Limpar filtros ao mudar de mês.

### 3.3 Exportação CSV

**Problema:** Sem portabilidade de dados — usuário não consegue exportar seus lançamentos.  
**Solução:** Botão "Exportar CSV" na página Relatórios. Gera CSV com colunas: `data, descricao, categoria, tipo, valor` para todas as transações do período selecionado (importadas + API). Download via `URL.createObjectURL(new Blob([csv]))`.

### 3.4 Gráfico Cumulativo de Investimentos

**Contexto:** TODO existente em `Dashboard.jsx:977`.  
**Solução:** Na página Relatórios, abaixo do gráfico de barras existente, adicionar `GraficoInvestimentos.jsx` com Recharts `AreaChart` mostrando o total acumulado de aportes mês a mês. Dados vindos de `investimentos` do `FinanceContext`.

### 3.5 Deduplicação Robusta na Importação

**Problema:** Deduplicação atual usa `gerarChaveTransacao` com estado local — se o usuário importar o mesmo PDF em sessões diferentes, duplicatas entram.  
**Solução:** Persistir as chaves de transações já importadas no localStorage junto com as transações (`@WebWallet:importKeys:${userKey}`). No `importTransactionsBatch`, checar contra esse set persistido antes de aceitar qualquer transação nova.

---

## Sprint 4 — Qualidade & Segurança

> Deixa o app produção-ready para quando tiver usuários reais.

### 4.1 Rate Limiting em /auth/login

**Problema:** Nenhuma proteção contra brute-force no endpoint de login.  
**Solução:** Instalar `express-rate-limit`. Aplicar em `POST /api/auth/login` e `POST /api/auth/forgot-password` com limite de 10 requisições por 15 minutos por IP. Resposta 429 com mensagem clara.

### 4.2 JWT_SECRET Obrigatório

**Problema:** `authController.js:11` tem fallback `|| 'secret_chave_webwallet'` — tokens são previsíveis se a variável de ambiente não estiver configurada.  
**Solução:** No startup do servidor (`server.js`), verificar `process.env.JWT_SECRET` e lançar erro fatal se ausente:
```js
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET não configurado');
```

### 4.3 Aggregation Pipeline no totalInvestido

**Problema:** `walletController.js` carrega todos os wallets com todas as transações na memória para somar investimentos — O(n) em RAM.  
**Solução:** Substituir por pipeline MongoDB:
```js
Wallet.aggregate([
  { $match: { usuario_id, competencia: { $lte: ate } } },
  { $unwind: '$transacoes' },
  { $match: { 'transacoes.deletadoEm': null, 'transacoes.tipo': 'despesa', 'transacoes.categoria': 'Investimentos' } },
  { $group: { _id: null, total: { $sum: '$transacoes.valor' } } }
])
```

### 4.4 .select() + .lean() nas Queries Mongoose

**Problema:** Queries de leitura carregam documentos completos sem projeção. Para operações de ownership check, carrega todas as transações só para verificar existência.  
**Solução:**
- Queries read-only: adicionar `.lean()` para retornar plain objects (mais rápido, menos memória).
- Ownership checks: adicionar `.select('usuario_id transacoes._id')` para não carregar campos desnecessários.

### 4.5 Testes Vitest para Utils Críticos

**Contexto:** Sem nenhum teste no projeto atualmente.  
**Escopo mínimo (alta confiança, baixo esforço):**
- `processarMeses` — intervalo com/sem transações, variações no primeiro mês (null), saldo acumulado.
- `gerarChaveTransacao` — normalização de acentos, valores negativos, datas incompletas.
- `sanitizarExtrato` — linhas com data, com valor, sem nenhum dos dois.
- `formatCurrencyBRL` — arredondamento de floats, valores negativos, zero.

### 4.6 Validação Backend com Joi

**Problema:** Endpoints aceitam qualquer payload sem validação de schema — categoria inválida, valor string, competencia mal formatada passam direto.  
**Solução:** Instalar `joi`. Criar schemas em `back/src/validators/`:
- `adicionarTransacao` — valor (number > 0), tipo (enum), categoria (string não-vazia), competencia (regex `YYYY-MM`).
- `iniciarMes` — competencia (regex `YYYY-MM`).
- `atualizarLimites` — object com keys válidas de categoria e valores numéricos.

---

## Fora do Escopo

Itens identificados no review mas excluídos por baixo ROI no estágio atual do projeto:

- **TypeScript migration** — custo alto de migração, sem usuários que se beneficiem ainda.
- **CSRF protection** — projeto pessoal com CORS configurado; risco real é baixo.
- **HttpOnly cookies** — requer mudança em auth flow completo; JWT em localStorage é aceitável agora.
- **i18n** — app é em pt-BR, sem plano de internacionalização.
- **Recurring transactions** — complexidade alta, retorno baixo no curto prazo.
- **Score de saúde financeira** — feature interessante mas sem spec suficiente ainda.

---

## Ordem de Execução

```
Sprint 1 (UX)  →  Sprint 2 (Arquitetura)  →  Sprint 3 (Features)  →  Sprint 4 (Qualidade)
```

Sprint 2 depende do Sprint 1 estar estável (não faz sentido refatorar enquanto há bugs de UX abertos). Sprint 3 fica mais fácil após o split do Sprint 2 (componentes menores = features mais fáceis de encaixar). Sprint 4 pode ser feito em paralelo com o 3 no backend.
