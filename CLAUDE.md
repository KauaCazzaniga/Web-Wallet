# Web-Wallet — Guia para o Claude Code

## Visão geral do projeto

Aplicação web de controle financeiro pessoal com arquitetura full-stack: frontend em React 19 + Vite 8 com styled-components e o backend em Node.js/Express 5 com MongoDB/Mongoose. O usuário pode registrar receitas e despesas por categoria, definir metas mensais de gastos, importar extratos bancários em PDF via Gemini AI e acompanhar relatórios de evolução patrimonial. O projeto está em desenvolvimento ativo — as páginas Dashboard e Relatórios estão funcionais; edição/remoção de aportes de investimentos ainda não foi implementada.

---

## Comandos essenciais

### Frontend (`front/`)
```bash
cd front
npm install          # instalar dependências
npm run dev          # servidor de desenvolvimento (Vite) — http://localhost:5173
npm run build        # build de produção em front/dist/
npm run preview      # pré-visualizar o build gerado
npm run lint         # ESLint com regras react-hooks e react-refresh
```

### Backend (`back/src/`)
```bash
cd back/src
npm install          # instalar dependências
node server.js       # iniciar API na porta 3000 (ou PORT do .env)
```

> O frontend espera a API em `http://localhost:3000/api` (configurado em `front/src/services/api.js`).

---

## Arquitetura e estrutura de pastas

```
Web-Wallet/
├── front/                          # Aplicação React/Vite
│   ├── src/
│   │   ├── App.jsx                 # Roteador + providers (AuthProvider > FinanceGate > rotas)
│   │   ├── main.jsx                # Entry point — monta <App /> em StrictMode
│   │   ├── index.css               # Reset global mínimo
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Página principal: KPIs, categorias, gastos fixos, tabela
│   │   │   ├── Relatorios.jsx      # Relatórios mensais: gráficos + tabela comparativa
│   │   │   ├── Login.jsx           # Formulário de autenticação
│   │   │   ├── Register.jsx        # Formulário de cadastro
│   │   │   └── Index.jsx           # Landing page pública
│   │   ├── components/
│   │   │   ├── ImportButton.jsx    # Botão que abre o file picker para PDF
│   │   │   ├── ImportModal.jsx     # Modal de revisão/categorização das transações importadas
│   │   │   ├── ProtectedRoute.jsx  # Guarda de rota — redireciona para /login se não autenticado
│   │   │   ├── TransacaoCategorizavel.jsx  # Linha editável no ImportModal
│   │   │   └── relatorios/
│   │   │       ├── FiltroMes.jsx           # Dois inputs type="month" (De/Até)
│   │   │       ├── CardsResumo.jsx         # 4 cards: receitas, despesas, saldo, média
│   │   │       ├── GraficoBarrasMensal.jsx # Recharts BarChart receita vs despesa por mês
│   │   │       ├── GraficoSaldoAcumulado.jsx # Recharts ComposedChart linha + área
│   │   │       └── TabelaComparativo.jsx   # Tabela mensal com variações %
│   │   ├── context/
│   │   │   └── FinanceContext.jsx  # Transações importadas + investimentos (veja seção dedicada)
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx     # user, login(), logout(), register(), authenticated, loading
│   │   │   └── ThemeContext.jsx    # isDark, toggleTheme(), theme (objeto com tokens de cor)
│   │   ├── constants/
│   │   │   └── gastosFixos.js      # GASTOS_FIXOS[], GASTOS_FIXOS_MAP, GASTOS_FIXOS_PREFIX, helpers
│   │   ├── utils/
│   │   │   ├── geminiParser.js     # parseBankStatement() — chama Gemini API; sanitização + lotes
│   │   │   ├── pdfExtractor.js     # extractTextFromPdf() — usa pdfjs-dist via CDN worker
│   │   │   ├── categorizador.js    # sugerirCategoria(), prepararTransacoesImportadas(), gerarChaveTransacao()
│   │   │   └── relatorioCalc.js    # processarMeses(), formatCurrencyBRL(), listMonthsBetween(), etc.
│   │   ├── services/
│   │   │   └── api.js              # Instância axios com baseURL, interceptor de token JWT
│   │   └── styles/
│   │       └── global.js           # (arquivo presente, estilos globais via styled-components)
│   ├── .env                        # VITE_API_URL, VITE_GEMINI_API_KEY, VITE_GEMINI_MODEL (opcional)
│   └── vite.config.js              # Plugin @vitejs/plugin-react apenas
│
└── back/src/                       # API Node.js
    ├── server.js                   # Express app: CORS, JSON, rotas, error handler, porta 3000
    ├── config/database.js          # Conexão Mongoose com MONGODB_URI do .env
    ├── routes/
    │   ├── authRoutes.js           # POST /api/auth/login, POST /api/auth/register
    │   └── walletRoutes.js         # Rotas /api/wallet/* — todas protegidas por authMiddleware
    ├── controllers/
    │   ├── authController.js       # Lógica de login/registro com bcryptjs + JWT
    │   └── walletController.js     # obterDashboard, iniciarMes, adicionarTransacao, etc.
    ├── middlewares/auth.js         # Valida Bearer token e injeta req.usuarioId
    └── models/
        ├── User.js                 # Schema: name, email, password (hash bcrypt no pre-save)
        ├── Wallet.js               # Schema: usuario_id, competencia "YYYY-MM", resumo, transacoes[], limites_gastos (Map)
        └── Transaction.js          # (modelo separado, não usado diretamente — embutido em Wallet)
```

### O que cada util/constant exporta

**`src/constants/gastosFixos.js`**
- `GASTOS_FIXOS_PREFIX` — string `"gastos_fixos."` usada como prefixo de categoria
- `GASTOS_FIXOS` — array `{ key, label, icon }` com 12 subcategorias
- `GASTOS_FIXOS_MAP` — `{ [key]: { key, label, icon } }` para lookup O(1)
- `resolverGastoFixo(categoria)` — retorna o item ou `null` se não for gasto fixo
- `labelCategoria(categoria)` — label legível para qualquer categoria
- `iconeCategoria(categoria, fallbackIcons)` — ícone para qualquer categoria

**`src/utils/relatorioCalc.js`**
- `formatCurrencyBRL(value)` — `Intl.NumberFormat` pt-BR, arredonda antes
- `formatCompactCurrency(value)` — ex: `R$ 12,5k`
- `getCurrentMonthKey()` — retorna `"YYYY-MM"` do mês atual
- `shiftMonthKey(monthKey, offset)` — desloca N meses
- `getDefaultReportRange()` — retorna `{ inicio, fim }` — últimos 6 meses até o atual
- `listMonthsBetween(inicio, fim)` — array de `"YYYY-MM"` no intervalo
- `processarMeses(transacoes, inicio, fim)` — array `{ mes, label, labelCompleto, receita, despesa, saldo, saldoAcumulado, varReceita, varDespesa, mesAnteriorLabel }`

**`src/utils/categorizador.js`**
- `CATEGORIAS_IMPORTACAO` — array com categorias disponíveis no modal de importação
- `sugerirCategoria(descricao)` — retorna categoria baseada em termos da descrição
- `gerarChaveTransacao({ data, valor, descricao })` — chave para deduplicação
- `prepararTransacoesImportadas(transacoes)` — normaliza + sugere categoria + adiciona `incluir: true`

**`src/utils/geminiParser.js`**
- `GEMINI_SYSTEM_PROMPT` — prompt fixo do parser de extratos
- `parseBankStatement(textoExtraido, apiKey)` — sanitiza, divide em lotes se > 60 linhas, chama Gemini, retorna `{ banco, periodo, transacoes[], total_transacoes, observacoes }`

**`src/utils/pdfExtractor.js`**
- `extractTextFromPdf(file)` — lê arquivo PDF e retorna texto concatenado de todas as páginas

---

## Estado global (FinanceContext)

Arquivo: `src/context/FinanceContext.jsx`  
Hook de acesso: `useFinance()` (lança erro se usado fora de `FinanceProvider`)

O `FinanceProvider` recebe `userKey` (derivado do `user._id` ou `user.email`) para isolar os dados de importação por usuário no localStorage.

### Estados expostos

| Nome | Tipo | Descrição |
|------|------|-----------|
| `importedTransactions` | `Array<Transacao>` | Transações importadas via PDF (salvas no localStorage por usuário) |
| `investimentos` | `Array<Aporte>` | Aportes de investimentos (salvos no localStorage globalmente) |
| `highlightedIds` | `Array<string>` | IDs das transações recém-importadas (highlight temporário por 3s) |

**Estrutura de `Transacao` importada:**
```js
{
  _id: "imp-timestamp-index-random",
  isImported: true,
  competencia: "YYYY-MM",
  importedAt: "ISO string",
  data: "YYYY-MM-DD",
  descricao: string,
  valor: number,
  tipo: "receita" | "despesa",
  categoria: string
}
```

**Estrutura de `Aporte`:**
```js
{
  id: "inv-timestamp-random",
  mes: "YYYY-MM",
  valor: number,
  descricao: string
}
```

### Funções expostas

| Função | Parâmetros | O que faz |
|--------|-----------|-----------|
| `importTransactionsBatch(transactions[])` | Array de transações brutas | Normaliza, stampa `_id` + `importedAt`, salva no estado e aciona highlight |
| `removeImportedTransaction(transactionId)` | `string` | Remove por `_id` do array e dos highlights |
| `adicionarAporte(mes, valor, descricao?)` | `"YYYY-MM"`, `number`, `string` | Valida e adiciona aporte; lança erro se mês já existe |

### Chaves do localStorage usadas pelo FinanceContext

| Chave | O que armazena |
|-------|---------------|
| `@WebWallet:imports:${userKey}` | Array de `importedTransactions` serializado (JSON) |
| `webwallet_investimentos` | Array de `investimentos` serializado (JSON) |

---

## Padrões de código obrigatórios

### Estilo

- **Framework de UI**: styled-components v6 para todos os componentes. Tailwind está instalado mas **não é usado** no código existente — não introduzir classes Tailwind.
- **Tema**: dark/light mode via props `$dark={isDark}` no componente raiz (`AppContainer`). Todas as cores são CSS variables declaradas no `AppContainer` com prefixo `--dash-*` (Dashboard) ou `--rel-*` (Relatórios). Nunca usar cores hardcodadas fora das declarações de variável.
- **Variáveis CSS do Dashboard** (declaradas em `AppContainer`):
  ```
  --dash-shell        --dash-surface        --dash-surface-muted
  --dash-border       --dash-border-strong  --dash-heading
  --dash-text         --dash-muted          --dash-muted-strong
  --dash-primary      --dash-primary-strong --dash-primary-soft
  --dash-input-bg     --dash-table-head     --dash-shadow
  --dash-soft-shadow  --dash-danger-soft    --dash-danger-border
  ```
- **Componentes**: React functional components com hooks. Zero class components.
- **Eventos**: sempre `onClick`, `onChange` — nunca `onclick`, `onchange`.
- **Sem `window.alert` / `window.confirm`**: usar o sistema de toast (`notify()`) e modais React.

### Comentários

Todo arquivo novo deve ter cabeçalho:
```js
// Componente: NomeDoComponente
// Responsabilidade: o que ele faz em 1 linha
// Depende de: useFinance, relatorioCalc, gastosFixos, etc.
```

Funções com mais de 10 linhas devem ter JSDoc:
```js
/**
 * @param {Array} transacoes - lista de transações do mês
 * @param {string} mes - formato "YYYY-MM"
 * @returns {number} total de despesas em reais
 */
```

### Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes React | PascalCase | `CardsResumo`, `FiltroMes` |
| Funções utilitárias | camelCase | `processarMeses`, `sanitizarExtrato` |
| Constantes de módulo | UPPER_SNAKE_CASE | `GASTOS_FIXOS`, `GEMINI_MODEL` |
| Constantes internas privadas | UPPER_SNAKE_CASE | `DELAY_LOTE_MS`, `TAMANHO_LOTE` |
| Arquivos de componente | PascalCase.jsx | `GraficoBarrasMensal.jsx` |
| Arquivos de util | camelCase.js | `geminiParser.js`, `relatorioCalc.js` |
| Props booleanas de estilo | `$prefixo` (transient) | `$dark`, `$active`, `$off`, `$over` |

### Formatação de dados

```js
// Moeda — sempre com Intl, sempre arredondar antes
const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
fmt.format(Math.round(valor * 100) / 100);

// Data/mês — sempre pt-BR
new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);

// Nunca exibir floats sem arredondar — ex: 0.1 + 0.2 = 0.30000000000000004
// Usar a função roundTo() de relatorioCalc.js ou Math.round(v * 100) / 100
```

---

## Categorias do sistema

### Categorias regulares

| key | label | ícone |
|-----|-------|-------|
| `Alimentação` | Alimentação | 🍔 |
| `Transporte` | Transporte | 🚗 |
| `Lazer` | Lazer | 🎉 |
| `Saúde` | Saúde | 💊 |
| `Salário` | Salário | 💰 |
| `Investimentos` | Investimentos | 📈 |
| `Outros` | Outros | 📦 |

### Subcategorias de gastos fixos (`GASTOS_FIXOS_PREFIX = "gastos_fixos."`)

A barra de progresso usa cores progressivas: azul `#378ADD` (0–60%), âmbar `#EF9F27` (61–85%), laranja `#D85A30` (86–99%), vermelho `#E24B4A` (≥ 100%).

| key | categoria salva | label | ícone |
|-----|----------------|-------|-------|
| `aluguel` | `gastos_fixos.aluguel` | Aluguel / Financiamento | 🏠 |
| `energia` | `gastos_fixos.energia` | Energia elétrica | 💡 |
| `agua` | `gastos_fixos.agua` | Água e esgoto | 💧 |
| `internet` | `gastos_fixos.internet` | Internet | 📶 |
| `celular` | `gastos_fixos.celular` | Celular | 📱 |
| `gas` | `gastos_fixos.gas` | Gás | 🔥 |
| `streaming` | `gastos_fixos.streaming` | Streaming | 📺 |
| `cartaoCredito` | `gastos_fixos.cartaoCredito` | Cartão de crédito | 💳 |
| `assinaturasIA` | `gastos_fixos.assinaturasIA` | Assinaturas de IA | 🤖 |
| `planoSaude` | `gastos_fixos.planoSaude` | Plano de saúde | 🏥 |
| `seguroCarro` | `gastos_fixos.seguroCarro` | Seguro do carro | 🚗 |
| `condominio` | `gastos_fixos.condominio` | Condomínio | 📦 |

Para checar se uma categoria é gasto fixo: `categoria.startsWith("gastos_fixos.")`.  
Para resolver label/ícone de qualquer categoria: `resolveCatDisplay(cat)` ou `labelCategoria(cat)` + `iconeCategoria(cat)`.

---

## Integrações externas

### Gemini AI

- **Modelo**: `gemini-2.5-flash` (padrão). Sobrescrito por `VITE_GEMINI_MODEL`.
- **Arquivo**: `src/utils/geminiParser.js`, função pública `parseBankStatement(textoExtraido, apiKey?)`
- **Variável de ambiente**: `VITE_GEMINI_API_KEY` (obrigatória — lida no frontend)
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
- **Configuração**:
  ```js
  generationConfig: { temperature: 0, responseMimeType: 'application/json' }
  ```
- **Fluxo completo**:
  1. `sanitizarExtrato(texto)` — filtra apenas linhas com data (`dd/mm`) ou valor monetário (`1.250,00`)
  2. Se linhas sanitizadas ≤ 60 → uma chamada única
  3. Se linhas > 60 → divide em chunks de 50 linhas com **6 s de delay** entre lotes (respeita ~10 RPM free tier)
  4. Erros 429: aguarda 15 s, tenta uma vez; se falhar novamente → mensagem de rate limit
  5. JSON inválido → mensagem "Não foi possível interpretar este extrato. Tente outro arquivo."

### pdfjs-dist

- **Versão**: `3.11.174`
- **Arquivo**: `src/utils/pdfExtractor.js`, função `extractTextFromPdf(file)`
- **Worker**: carregado via CDN (`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`)
- **Uso**: recebe um `File` (PDF), lê todas as páginas, monta texto linha a linha preservando quebras de linha pela posição Y dos itens

---

## Regras de persistência

### Todas as chaves do localStorage

| Chave | O que armazena | Lido/escrito em |
|-------|---------------|-----------------|
| `@WebWallet:token` | JWT de autenticação (string) | `AuthContext`, `api.js` |
| `@WebWallet:user` | Objeto `{ _id, name, email }` (JSON) | `AuthContext` |
| `@WebWallet:theme` | `"dark"` ou `"light"` | `ThemeContext` |
| `@WebWallet:imports:${userKey}` | Array de transações importadas (JSON) | `FinanceContext` |
| `webwallet_investimentos` | Array de aportes `{ id, mes, valor, descricao }` (JSON) | `FinanceContext` |
| `webwallet_mes_selecionado` | Mês ativo no Dashboard `"YYYY-MM"` | `Dashboard.jsx` |
| `webwallet_gastosfixos_aberto` | Estado do acordeão de gastos fixos (`"true"/"false"`) | `Dashboard.jsx` |

### Padrão obrigatório para novo estado persistente

```js
// LEITURA — sempre lazy init com try/catch
const [estado, setEstado] = useState(() => {
  try {
    const salvo = localStorage.getItem('webwallet_chave');
    return salvo ? JSON.parse(salvo) : valorPadrao;
  } catch {
    return valorPadrao;
  }
});

// ESCRITA — sempre em useEffect com a dependência correta
useEffect(() => {
  try {
    localStorage.setItem('webwallet_chave', JSON.stringify(estado));
  } catch {}
}, [estado]);
```

---

## Testes

Não há configuração de testes no projeto (frontend ou backend).

### Padrão para novos testes (a implementar)

- **Framework recomendado**: Vitest + React Testing Library (compatível com Vite, zero config extra)
- **Arquivo de teste**: `NomeDoComponente.test.jsx` ao lado do componente
- **O que testar em funções utilitárias**:
  - `processarMeses`: intervalo com e sem transações, variações no primeiro mês (null), saldo acumulado
  - `sanitizarExtrato`: linhas com data, linhas com valor, linhas sem nenhum dos dois
  - `gerarChaveTransacao`: normalização de acentos, valores negativos, datas incompletas
- **O que testar em componentes**:
  - Renderização com props mínimas
  - Estado vazio vs. com dados
  - Interações (clique em botões, mudança de mês)

---

## O que NÃO fazer

- **Não inicializar `useState` com valor fixo quando há localStorage** — sempre usar função lazy `() => { try { ... } catch { return default } }`.
- **Não hardcodar lista de subcategorias de gastos fixos** fora de `src/constants/gastosFixos.js` — importar `GASTOS_FIXOS` de lá.
- **Não usar `window.alert` ou `window.confirm`** — usar o sistema de toast (`notify()`) e modais React com styled-components.
- **Não exibir floats sem arredondar** — `0.1 + 0.2 = 0.30000000000000004` aparece no DOM. Usar `Math.round(v * 100) / 100` ou `roundTo()` de `relatorioCalc.js`.
- **Não colocar `FinanceProvider` dentro de uma rota específica** — ele está no `FinanceGate` em `App.jsx`, envolvendo todas as rotas, para que as transações importadas persistam ao navegar entre Dashboard e Relatórios.
- **Não fazer chamadas individuais à API Gemini por transação** — usar `parseBankStatement()` que já sanitiza e batcheia o extrato completo.
- **Não confiar que `recentTransactions` do `/dashboard` contém todas as transações do mês** — a API retorna apenas as **últimas 5** (`slice(-5).reverse()`). Para KPIs históricos ou contagens completas, usar `/extrato/:competencia`.
- **Não usar `div` nu para contêineres** quando um styled-component já existe ou pode ser criado com uma linha — mantém a consistência do código e permite uso das CSS variables do tema.
- **Não salvar `mesSelecionado` no FinanceContext** — é estado local da página Dashboard, não deve subir para o contexto global.
- **Não filtrar metas (`limites`) por mês** — as metas são limites mensais fixos e globais, sempre exibidas independente do mês selecionado.

---

## Backlog ativo

Baseado nos `// TODO:` encontrados no código-fonte:

- [ ] `editarAporte` e `removerAporte` no `FinanceContext` — implementar e expor para uso na página Relatórios (`FinanceContext.jsx:128`)
- [ ] Gráfico cumulativo de investimentos e tabela de aportes na página Relatórios (`Dashboard.jsx` — seção `InvestmentPanel`)
- [ ] Score de saúde financeira (não há TODO mas é mencionado como feature planejada)
- [ ] Configurações de usuário — tela de Configurações retorna `alert('Configurações em breve!')` nos dois sidebars
