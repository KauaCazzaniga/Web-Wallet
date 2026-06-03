# Web-Wallet — Guia para o Claude Code

## ⚠️ Política de manutenção deste guia (LEIA PRIMEIRO)

Estas regras são **obrigatórias** e têm precedência sobre qualquer comportamento padrão.

1. **Leitura na inicialização** — No início de **toda** sessão/conversa, antes de qualquer
   outra ação, o Claude Code deve **ler este `CLAUDE.md` por completo** e usá-lo como fonte
   de verdade sobre arquitetura, padrões e regras de negócio. Se houver conflito entre o
   código e este guia, sinalize a divergência ao usuário em vez de assumir um dos lados.

2. **Registro de toda alteração** — **Toda** alteração de código (novo módulo, função,
   rota, model, regra de negócio, mudança de comportamento ou remoção) deve ser **refletida
   neste `CLAUDE.md`** na mesma entrega. Atualize a seção pertinente (estrutura de pastas,
   exports de módulos, backend, categorias, persistência, testes ou backlog). Um PR/commit
   que muda comportamento **sem** atualizar o guia está incompleto.

3. **Testes unitários obrigatórios (regra de negócio + DDD)** — **Toda** alteração deve vir
   acompanhada de testes unitários que validem a **regra de negócio** envolvida, organizados
   por **domínio (DDD)**:
   - Cada agregado/domínio (Wallet, Investment, Goal/Cofrinho, Subscription, Auth) testa
     suas **invariantes** — ex.: valor positivo, competência `YYYY-MM`, `valorAtual` nunca
     negativo, saque não excede saldo do cofrinho, soft-delete não some da base.
   - Lógica de domínio fica em funções puras testáveis (ex.: `utils/validators.js` no back,
     `utils/*.js` no front); teste-as isoladamente, sem I/O.
   - O teste descreve a **regra**, não a implementação — nome do `it()` deve enunciar o
     comportamento esperado do domínio (ex.: `it('rejeita aporte com valor negativo')`).
   - Frontend: `vitest run` em `front/`. Backend: `vitest run` em `back/src/`. Uma alteração
     só é considerada concluída quando **ambas as suítes afetadas passam**.

> Resumo do ciclo de trabalho: **ler o guia → alterar código → escrever/ajustar testes de
> domínio → atualizar este guia → rodar `vitest run` nos pacotes afetados.**

---

## Visão geral do projeto

Aplicação web de controle financeiro pessoal com arquitetura full-stack: frontend em React 19 + Vite 8 com styled-components e o backend em Node.js/Express 5 com MongoDB/Mongoose. O usuário pode registrar receitas e despesas por categoria, definir metas mensais de gastos, importar extratos bancários em PDF via IA (Gemini/Groq/Mistral, com fallback e parser local), gerenciar assinaturas recorrentes, manter uma carteira de investimentos e cofrinhos (metas) e acompanhar relatórios de evolução patrimonial. As páginas **Dashboard**, **Relatórios**, **Investimentos** e **Configurações** estão funcionais.

> Domínio (DDD) — agregados principais: **Wallet** (fluxo de caixa mensal e transações),
> **Investment** (carteira de ativos), **Goal/Cofrinho** (metas com progresso), **Subscription**
> (assinaturas recorrentes) e **Auth/User**. Cada um tem model, controller e regras de negócio
> próprias no backend, e deve ter testes de domínio dedicados (ver Política de manutenção).

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
npm run test         # executa os testes de backend (vitest run)
```

> Ao iniciar (`require.main === module`), o `server.js` roda `runMigrations()` — migração
> **idempotente** que remapeia categorias antigas (`gastos_fixos.streaming` →
> `assinaturas.outros`, `gastos_fixos.assinaturasIA` → `assinaturas.chatgptplus`).

> O frontend espera a API em `http://localhost:3000/api` (configurado em `front/src/services/api.js`).

---

## Arquitetura e estrutura de pastas

```
Web-Wallet/
├── front/                          # Aplicação React/Vite
│   ├── src/
│   │   ├── App.jsx                 # Roteador + providers (ThemeProvider > AuthProvider > FinanceGate > ErrorBoundary > rotas)
│   │   ├── main.jsx                # Entry point — monta <App /> em StrictMode
│   │   ├── index.css               # Reset global mínimo
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Página principal: KPIs, categorias, gastos fixos, assinaturas, tabela
│   │   │   ├── Relatorios.jsx      # Relatórios mensais: gráficos + tabela comparativa + investimentos
│   │   │   ├── Investimentos.jsx   # Carteira por tipo, cofrinhos (metas) e evolução patrimonial
│   │   │   ├── Configuracoes.jsx   # Metas, categorias, tema, export de dados, conta
│   │   │   ├── Login.jsx           # Formulário de autenticação
│   │   │   ├── Register.jsx        # Formulário de cadastro
│   │   │   ├── ForgotPassword.jsx  # Redefinição de senha em 2 etapas: e-mail → código + nova senha
│   │   │   ├── VerifyEmail.jsx      # Verificação de e-mail em 2 etapas: e-mail → código. Abre na etapa de código só com `location.state.codeSent === true` (vindo do cadastro, que já enviou o código); vindo do login (só `{ email }`) abre na etapa de envio com o e-mail pré-preenchido para o usuário pedir o código
│   │   │   └── Index.jsx           # Landing page pública
│   │   ├── components/
│   │   │   ├── ImportButton.jsx    # Botão que abre o file picker para PDF
│   │   │   ├── ImportModal.jsx     # Modal de revisão/categorização das transações importadas
│   │   │   ├── ProtectedRoute.jsx  # Guarda de rota — redireciona para /login se não autenticado
│   │   │   ├── ErrorBoundary.jsx   # Class component — captura erros de render e exibe fallback
│   │   │   ├── AIAdvisor.jsx       # Drawer do assistente financeiro de IA
│   │   │   ├── GerenciarMetas.jsx  # Modal de metas de gastos por categoria + gastos fixos
│   │   │   ├── TransacaoCategorizavel.jsx  # Linha editável no ImportModal
│   │   │   ├── SubscriptionPanel.jsx       # Acordeão de assinaturas no Dashboard
│   │   │   ├── SubscriptionCard.jsx        # Card individual de assinatura
│   │   │   ├── SubscriptionFormModal.jsx   # Modal criar/editar assinatura
│   │   │   ├── LancarCobrancaModal.jsx     # Confirma lançamento de cobrança como despesa
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardHeader.jsx     # Cabeçalho: mês, ações, import
│   │   │   │   ├── GoalCards.jsx           # Orçamento (donut), gastos por categoria, gastos fixos
│   │   │   │   ├── InvestmentPanel.jsx     # Resumo de patrimônio + botão registrar aporte
│   │   │   │   ├── TransactionList.jsx     # Tabela paginada com busca e filtro
│   │   │   │   ├── dashboardStyles.js      # Styled-components compartilhados (Panel, PanelHeader…)
│   │   │   │   └── dashboardUtils.js       # Funções puras: fmt, parseDate, resolveCatDisplay, ITEMS_POR_PAGINA
│   │   │   ├── ui/AuthForm/index.js        # Componentes compartilhados de formulário de auth
│   │   │   └── relatorios/
│   │   │       ├── FiltroMes.jsx           # Dois inputs type="month" (De/Até)
│   │   │       ├── CardsResumo.jsx         # 4 cards: receitas, despesas, saldo, média
│   │   │       ├── CardTaxaPoupanca.jsx    # % da receita que sobrou por mês + alerta < 10%
│   │   │       ├── ChartTooltip.jsx        # Tooltip compartilhado dos gráficos Recharts
│   │   │       ├── GraficoBarrasMensal.jsx # Recharts BarChart receita vs despesa por mês
│   │   │       ├── GraficoSaldoAcumulado.jsx # Recharts ComposedChart linha + área
│   │   │       ├── GraficoInvestimentos.jsx  # Área de patrimônio acumulado + tabela de aportes
│   │   │       └── TabelaComparativo.jsx   # Tabela mensal com variações %
│   │   ├── context/
│   │   │   └── FinanceContext.jsx  # Transações importadas + investimentos (veja seção dedicada)
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx     # user, login(), logout(), register(), authenticated, loading
│   │   │   └── ThemeContext.jsx    # isDark, toggleTheme(), theme (objeto com tokens de cor)
│   │   ├── hooks/
│   │   │   ├── useTransactions.js  # Estado/fetch/CRUD das transações do mês + cache (ver Performance)
│   │   │   ├── useToast.js         # Toast reutilizável: { toast, notify(msg, type) }
│   │   │   ├── useCountUp.js       # Animação de contagem de números (RAF)
│   │   │   └── useScrollReveal.js  # Reveal on scroll via IntersectionObserver
│   │   ├── constants/
│   │   │   ├── gastosFixos.js      # GASTOS_FIXOS[], GASTOS_FIXOS_MAP, GASTOS_FIXOS_PREFIX, helpers
│   │   │   └── assinaturas.js      # ASSINATURAS[], ASSINATURAS_MAP, ASSINATURAS_PREFIX, helpers de ícone
│   │   ├── utils/
│   │   │   ├── bankStatementParser.js # parseBankStatement() — IA via proxy backend (Gemini/Groq/Mistral) + parser local
│   │   │   ├── geminiParser.js     # (legado) GEMINI_SYSTEM_PROMPT, parseBankStatement direto na API Gemini
│   │   │   ├── pdfExtractor.js     # extractTextFromPdf() — usa pdfjs-dist via CDN worker
│   │   │   ├── categorizador.js    # sugerirCategoria(), resolverCategoria(), prepararTransacoesImportadas(), gerarChaveTransacao()
│   │   │   ├── transaction.js      # normalizeDate(), normalizeTransaction() — formato interno padrão
│   │   │   └── relatorioCalc.js    # processarMeses(), formatCurrencyBRL(), listMonthsBetween(), etc.
│   │   ├── services/
│   │   │   ├── api.js              # Instância axios com baseURL, interceptor de token JWT
│   │   │   ├── investments.js      # CRUD de investimentos e cofrinhos (normaliza valorMeta→meta)
│   │   │   └── subscriptionService.js # CRUD de assinaturas + lancarCobranca()
│   │   └── styles/
│   │       └── global.js           # estilos globais via styled-components
│   ├── .env                        # VITE_API_URL, VITE_GEMINI_API_KEY, VITE_GEMINI_MODEL (opcional)
│   └── vite.config.js              # Plugin @vitejs/plugin-react + config de testes (vitest)
│
└── back/src/                       # API Node.js
    ├── server.js                   # Express app: helmet, CORS, JSON, rotas, error handler, runMigrations, porta 3000
    ├── config/
    │   ├── database.js             # Conexão Mongoose com MONGODB_URI do .env
    │   └── logger.js               # Instância Winston (json em prod, printf em dev)
    ├── routes/
    │   ├── authRoutes.js           # /api/auth/* — register, login (rate-limit), me, verify-email (código)/resend-verification, forgot/reset-password (rate-limit no envio de código)
    │   ├── walletRoutes.js         # /api/wallet/* — protegidas + validação Joi + ownership
    │   ├── aiRoutes.js             # /api/ai/{gemini,groq,mistral} — proxy IA com rate-limit por usuário
    │   ├── investmentRoutes.js     # /api/investments/* (investimentos) + /goals/* (cofrinhos)
    │   └── subscriptionRoutes.js   # /api/subscriptions/* — CRUD + /:id/lancar
    ├── controllers/
    │   ├── authController.js       # register (envia código), login, me, verifyEmail/resendVerification (código), forgotPassword/resetPassword (código) (bcrypt + JWT)
    │   ├── walletController.js     # obterDashboard, iniciarMes, adicionarTransacao, etc. + _helpers exportados
    │   ├── aiController.js         # Proxy p/ Gemini/Groq/Mistral — esconde API keys, normaliza 401/403→502
    │   ├── investmentController.js # CRUD de investimentos (listar/criar/atualizar/remover soft-delete)
    │   ├── goalController.js       # CRUD de cofrinhos + depositar (depósito/retirada)
    │   └── subscriptionController.js # CRUD de assinaturas + lancar (gera despesa via walletController._helpers)
    ├── middlewares/
    │   ├── auth.js                 # Valida Bearer token e injeta req.usuarioId
    │   ├── validate.js             # validate(schema) Joi + schemas (transacao, iniciarMes, importacao, definirLimites)
    │   └── resourceOwnership.js    # verifyTransactionOwnership — garante que a transação é do usuário
    ├── utils/
    │   ├── validators.js           # Funções puras de validação (competencia, valorPositivo, corHex, etc.)
    │   ├── emailService.js         # Envio de e-mail (Resend) — código de verificação de conta e código de reset de senha
    │   └── emailTemplates.js       # Templates HTML dos e-mails — identidade "Charged Quiet" (raio da marca, paleta violeta→ciano), tabela + estilos inline, logo PNG hospedado via EMAIL_LOGO_URL
    └── models/
        ├── User.js                 # name, email, password (hash bcrypt), resetPasswordToken/Expires/Attempts, emailVerified/Token/Expires
        ├── Wallet.js               # usuario_id, competencia "YYYY-MM", resumo, transacoes[], limites_gastos (Map)
        ├── Investment.js           # usuario_id, tipo (enum TIPOS_VALIDOS), nome, taxa, valor, rendimento, mesInicio, ativo
        ├── Goal.js                 # Cofrinho: nome, icone, cor (#rrggbb), valorMeta, valorAtual, prazo, ativo
        ├── Subscription.js         # nome, categoria, valor, billing_cycle (mensal|anual), next_charge_date, status, ativo
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
- `resolverCategoria(categoria)` — resolve label/ícone de qualquer categoria
- `normalizarDescricao(descricao)` — normaliza string para matching de termos
- `sugerirCategoria(descricao)` — retorna categoria baseada em termos da descrição
- `gerarChaveTransacao({ data, valor, descricao })` — chave para deduplicação
- `prepararTransacoesImportadas(transacoes)` — normaliza + sugere categoria + adiciona `incluir: true`

**`src/utils/transaction.js`**
- `normalizeDate(raw)` — converte ISO/Date/string para `"YYYY-MM-DD"` (ou `null`)
- `normalizeTransaction(t)` — normaliza qualquer transação para `{ id, data, descricao, valor, tipo, categoria }`

**`src/utils/bankStatementParser.js`** (parser de extratos atual — usa proxy de IA no backend)
- `GEMINI_SYSTEM_PROMPT` — prompt fixo do parser
- `parseBankStatement(textoExtraido)` — sanitiza, tenta parser **local** por regex primeiro; se insuficiente, chama IA via `/api/ai/*` (Gemini → Groq → Mistral como fallback), em lotes. Chaves de IA ficam **só no backend**.

**`src/utils/geminiParser.js`** (legado — chamada direta à API Gemini do browser)
- `GEMINI_SYSTEM_PROMPT`, `parseBankStatement(textoExtraido, apiKey)` — preferir `bankStatementParser.js` em código novo.

**`src/utils/pdfExtractor.js`**
- `extractTextFromPdf(file)` — lê arquivo PDF e retorna texto concatenado de todas as páginas

**`src/constants/assinaturas.js`**
- `ASSINATURAS_PREFIX` — string `"assinaturas."`
- `ASSINATURAS` — array `{ key, label, simpleIconsSlug, iconColor, iconFallback }`
- `ASSINATURAS_MAP` — lookup O(1) por key
- `resolverAssinatura(categoria)` / `labelAssinatura(categoria)` — resolução de label
- `iconeUrlAssinatura(categoria)` — URL do ícone via `cdn.simpleicons.org` (ou `null`)
- `iconeFallbackAssinatura(categoria)` — emoji de fallback

**`src/services/investments.js`** — wrapper axios; normaliza `valorMeta/valorAtual` → `meta/atual`
- Investimentos: `listarInvestimentos()`, `criarInvestimento()`, `atualizarInvestimento()`, `removerInvestimento()`
- Cofrinhos: `listarCofrinhos()`, `criarCofrinho()`, `atualizarCofrinho()`, `depositarCofrinho(id, valor)`, `removerCofrinho()`

**`src/services/subscriptionService.js`**
- `getSubscriptions()`, `createSubscription()`, `updateSubscription()`, `deleteSubscription()`, `lancarCobranca(id, payload)`

**`src/hooks/useToast.js`** — `useToast()` → `{ toast, notify(message, type) }` (auto-hide 3,5 s)

---

## Backend — domínios, rotas e regras de negócio

> Todas as rotas (exceto `/`, `/api/auth/register`, `/api/auth/login`, forgot/reset) exigem
> JWT via `authMiddleware`, que injeta `req.usuarioId`. Validação de entrada via Joi em
> `middlewares/validate.js`. Camada de domínio pura e testável em `utils/validators.js`.

### Wallet (`/api/wallet/*`)
Fluxo de caixa mensal por competência `"YYYY-MM"`. Endpoints: `listarMeses`, `totalInvestido`,
`obterDashboard`, `iniciarMes`, `adicionarTransacao`, `importarTransacoes`, `obterExtrato`,
`deletarTransacao`, `deletarTodasTransacoes`, `definirLimites`. Mutações validadas por Joi e
protegidas por `verifyTransactionOwnership` quando operam sobre `:transacaoId`. **Regra de
ouro**: mutações chamam `sincronizarCarteirasEmCadeia`; leituras não (ver Performance e cache).
`walletController._helpers` expõe helpers reutilizados por `subscriptionController`.

### Investment (`/api/investments`)
Carteira de ativos. `tipo` ∈ `TIPOS_VALIDOS` (`CDB, LCI, LCA, Tesouro, Poupança, Ações, FII,
Cripto, Outro`). Invariantes: `valor ≥ 0`, `rendimento ≥ 0`, `mesInicio` em `YYYY-MM`. Remoção é
**soft-delete** (`ativo = false`). `listar/criar/atualizar/remover`.

### Goal/Cofrinho (`/api/investments/goals`)
Meta com progresso. Invariantes: `valorMeta ≥ 1`, `valorAtual ≥ 0` (**nunca negativo**), `cor`
em `#rrggbb`, `prazo` nulo ou `YYYY-MM`. `PATCH /:id/depositar` aplica depósito **ou** retirada —
uma retirada não pode deixar `valorAtual` negativo. Soft-delete. Rotas `/goals` declaradas
**antes** de `/:id` para evitar conflito de parâmetro dinâmico.

### Subscription (`/api/subscriptions`)
Assinaturas recorrentes. `billing_cycle` ∈ `{mensal, anual}`, `valor ≥ 0.01`, `status` ∈
`{ativo, pausado, cancelado}`. `POST /:id/lancar` gera uma despesa na Wallet (via
`walletController._helpers`) e avança `next_charge_date` pelo ciclo, com **correção de overflow
de fim de mês** (31/jan + 1 mês → 28/fev, nunca 03/mar). Soft-delete.

### Auth (`/api/auth`)
`register`, `login` (rate-limit 10/15 min por IP), `me`.

> **Códigos de e-mail** (verificação e reset) seguem o **mesmo padrão**: código numérico de
> 6 dígitos (`crypto.randomInt`), guardado como **hash sha256** no User, com expiração, limite de
> **5 tentativas** (`MAX_CODE_ATTEMPTS` → `429`) e conferência em **tempo constante**
> (`crypto.timingSafeEqual`). TTLs: verificação **24 h** (`VERIFY_CODE_TTL_MS`), reset **15 min**
> (`RESET_CODE_TTL_MS`). Envio rate-limited a **5/15 min por IP** (`emailCodeLimiter`).

**Verificação de e-mail por código (cadastro):**
- `register` cria o usuário com `emailVerified: false`, gera o código, salva o hash em
  `emailVerificationToken` + `emailVerificationExpires` + `emailVerificationAttempts = 0` e envia
  o código (Resend). O cadastro **não falha** se o e-mail não sair (loga e segue) — o usuário usa
  "reenviar código" na tela de verificação.
- **E-mail já existente:** se a conta já existe e está **verificada** → `400`; se existe e **não
  verificada** → `register` reenvia um novo código e responde `200 { needsVerification, email }`
  (o frontend leva o usuário para `/verify-email`), evitando um beco sem saída.
- `verifyEmail` recebe `{ email, code }`: valida (idempotente se já verificado), confere o hash,
  expiração e tentativas, e marca `emailVerified = true` limpando os campos de verificação.
- `resendVerification` (rate-limit) regenera o código e reenvia; resposta genérica
  (anti-enumeration) se a conta não existir ou já estiver verificada.
- `login` retorna **403** enquanto `emailVerified` for falso; o frontend (Login) oferece o link
  "Verificar e-mail agora" para `/verify-email` (passando só `{ email }`, **sem** `codeSent`,
  porque o login **não** dispara o envio de código). A tela de verificação então abre na **etapa
  de envio** com o e-mail pré-preenchido — o usuário (ex.: conta antiga, pré-verificação) clica
  "Enviar código" para receber o código de fato, em vez de cair numa tela de código sem ter
  recebido nada. Apenas o **cadastro** navega com `{ email, codeSent: true }`, abrindo direto na
  etapa de código (o `register` já enviou).

**Redefinição de senha por código (não por link):**
- `forgotPassword` (rate-limit **5/15 min por IP**) gera um **código numérico de 6 dígitos**,
  salva o **hash sha256** em `resetPasswordToken` + `resetPasswordExpires` (15 min), zera
  `resetPasswordAttempts` e envia o código por e-mail (Resend). Sempre responde com mensagem
  genérica (anti-enumeration), exista o e-mail ou não.
- `resetPassword` recebe `{ email, code, newPassword }`, busca o usuário pelo e-mail, valida:
  código existente, não expirado, dentro do limite de **5 tentativas** (senão `429`) e confere
  o hash em **tempo constante** (`crypto.timingSafeEqual`). Tentativa errada incrementa o
  contador; sucesso troca a senha e limpa token/expiração/tentativas. Mensagens de falha são
  genéricas (`"Codigo invalido ou expirado."`).
- E-mail via `utils/emailService.js` (**Resend**), template `passwordResetEmail({ name, code })`
  em `utils/emailTemplates.js`. O cliente Resend é construído de forma **lazy** (`getResend()`),
  para não quebrar no import quando `RESEND_API_KEY` está ausente (ex.: testes).

> **Design dos e-mails ("Charged Quiet")** — `emailTemplates.js` usa a identidade visual da
> marca: o **raio** (logo), fundo "vault" escuro e a paleta de voltagem **violeta `#7e14ff` →
> ciano `#47bfff`**. HTML seguro para clientes de e-mail (layout em `<table>`, estilos inline,
> sem SVG inline nem `<style>`); efeitos não universais (gradient/box-shadow/text-shadow)
> degradam sobre cores sólidas. O raio é um **PNG hospedado** em `front/public/email-logo.png`
> (servido em `https://www.waltrix.com.br/email-logo.png`), com URL configurável via
> `EMAIL_LOGO_URL`. `baseLayout({ content, ref, preheader })` gera cabeçalho (raio + wordmark +
> marcador de referência), fio carregado (hairline em gradiente), corpo, e rodapé; helpers
> `codeBlock(code)` (dígitos grandes em mono, `"284 913"`) e `expiryChip(prazo)`. Mockups e o
> gerador de PNG ficam em `design/email/` (PHILOSOPHY.md, render.py, generate_logo.py).

### AI proxy (`/api/ai/{gemini,groq,mistral}`)
Proxy server-side que injeta as API keys (`GEMINI_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`)
e nunca as expõe ao browser. Rate-limit de **15 req/min por usuário** (chave = `req.usuarioId`).
`401/403` do provider são remapeados para `502` para **não** disparar o interceptor de
JWT-expirado no frontend.

### `utils/validators.js` (domínio puro — alvo prioritário de testes unitários)
`competenciaEhValida`, `tipoInvestimentoEhValido`, `valorPositivo`, `valorNaoNegativo`,
`corHexEhValida`, `prazoEhValido`, `stringObrigatoria`, `sanitizarValor`.

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

## Performance e cache

### Contrato de leitura vs. mutação no backend

`sincronizarCarteirasEmCadeia(usuario_id)` propaga `saldo_inicial` entre meses em ordem
cronológica. A regra de quando chamá-la é **obrigatória**:

| Tipo de operação | Chamar `sincronizarCarteirasEmCadeia`? |
|---|---|
| Mutação de saldo (`adicionarTransacao`, `deletarTransacao`, `importarTransacoes`, `iniciarMes`) | **Sim — sempre, após `wallet.save()`** |
| Leitura (`obterExtrato`, `listarMeses`, `totalInvestido`) | **Não** — saldos já estão corretos da última mutação |
| `obterDashboard` | **Sim** — mantido como self-healing path para falhas parciais |

`obterExtrato` **não chama** `sincronizarCarteirasEmCadeia` (removido em 2026-05-21).
Se re-adicionado, causa full-scan do banco em toda troca de mês — regressão de performance.

### Cache em memória no frontend (`useTransactions`)

O hook `useTransactions` mantém um `Map` em `useRef` com TTL de 5 minutos:

```
competencia → { transactions, resumo, limites, ts }
```

**Regra de invalidação: toda mutação deve chamar `cacheRef.current.clear()`** (não apenas
`delete(mesSelecionado)`). Isso porque `sincronizarCarteirasEmCadeia` atualiza `saldo_inicial`
em TODOS os meses downstream — usar `delete()` apenas no mês atual deixaria outros meses com
saldo errado no cache.

**API do cache no hook:**

```js
const {
  fetchMesSelecionado,   // ({ silent?, skipCache? }) — skipCache=true ignora o cache
  clearCache,            // () => cacheRef.current.clear() — exportado para handlers externos
} = useTransactions(mesSelecionado, opts);
```

**Padrão obrigatório para handlers externos (Dashboard.jsx) que mutam dados:**

```js
// ✅ Correto — limpa todos os meses antes de refetch
clearCache();
await fetchMesSelecionado({ silent: true, skipCache: true });

// ❌ Errado — só invalida o mês atual; meses downstream ficam com saldo stale
cacheRef.current.delete(mesSelecionado);
await fetchMesSelecionado({ silent: true, skipCache: true });

// ❌ Errado — não invalida nada; cache TTL protege dados stale por até 5 min
await fetchMesSelecionado({ silent: true });
```

**Limitação conhecida:** o cache é por instância do hook. Ao navegar
Dashboard → Relatórios → Dashboard, o hook recria com cache vazio. O benefício é
exclusivamente intra-sessão (trocar de mês dentro do Dashboard sem sair da página).

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

### Assinaturas (`ASSINATURAS_PREFIX = "assinaturas."`)

Fonte única em `src/constants/assinaturas.js`. Ícones via `cdn.simpleicons.org` (com emoji
de fallback). Keys: `spotify`, `netflix`, `amazonprime`, `disneyplus`, `max`, `youtubepremium`,
`applemusic`, `chatgptplus`, `googleone`, `adobe`, `outros`. Categoria salva = `assinaturas.<key>`.
Não hardcodar esta lista fora de `assinaturas.js` — importar `ASSINATURAS`. A migração no
`server.js` remapeia as categorias antigas `gastos_fixos.streaming`/`gastos_fixos.assinaturasIA`
para `assinaturas.outros`/`assinaturas.chatgptplus`.

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

### Rodar os testes

```bash
cd front && npm run test     # frontend — Vitest + React Testing Library
cd back/src && npm run test  # backend  — Vitest (controllers + validators de domínio)
```

> Toda alteração deve rodar a(s) suíte(s) afetada(s) antes de ser considerada concluída
> (ver **Política de manutenção**). Mudou backend → rode a suíte do backend; mudou frontend
> → rode a do frontend; mexeu em ambos → rode as duas.

### Setup e configuração

- **Framework**: Vitest 4 + React Testing Library 16 (front configurado em `vite.config.js > test`)
- **Ambiente**: `jsdom` (browser simulado) no frontend
- **Setup global (front)**: `front/src/test-setup.js` — importa `@testing-library/jest-dom` e define mocks globais:
  - `window.matchMedia` (styled-components / media queries)
  - `window.ResizeObserver` (Recharts)
  - `Element.prototype.scrollIntoView` (jsdom não suporta nativamente)

### Arquivos de teste existentes

**Frontend (`front/`)**

| Arquivo de teste | O que cobre |
|---|---|
| `src/hooks/useScrollReveal.test.js` | IntersectionObserver mock, one-shot, guard para ambiente sem suporte |
| `src/hooks/useCountUp.test.js` | RAF mock, animação, cleanup, correção de stale prevRef |
| `src/components/AIAdvisor.test.jsx` | Drawer, sugestões, envio, erro de API, limpeza de input |
| `src/components/dashboard/dashboardUtils.test.js` | Funções puras: fmt, parseDate, resolveCatDisplay |
| `src/components/dashboard/GoalCards.test.jsx` | Orçamento, gastos por categoria, gastos fixos |
| `src/components/dashboard/TransactionList.test.jsx` | Paginação, busca, filtro por categoria |
| `src/components/relatorios/ChartTooltip.test.jsx` | active/payload guards, formatter, valores brutos |
| `src/components/relatorios/GraficoBarrasMensal.test.jsx` | Render do BarChart receita vs despesa |
| `src/components/relatorios/GraficoSaldoAcumulado.test.jsx` | Render da linha + área de saldo acumulado |
| `src/components/relatorios/GraficoInvestimentos.test.jsx` | Área de patrimônio + tabela de aportes |
| `src/pages/Login.test.jsx` | Campos, toggle de senha, submit, redirecionamento, erro |
| `src/pages/Dashboard.test.jsx` | Render integrado e fluxos principais do Dashboard |
| `src/pages/ForgotPassword.test.jsx` | Fluxo de 2 etapas: envio do e-mail → código + nova senha, validações e redirect |
| `src/pages/VerifyEmail.test.jsx` | Verificação por código em 2 etapas: vindo do cadastro (`{ email, codeSent: true }` → etapa de código), vindo do login (`{ email }` sem codeSent → etapa de envio pré-preenchida) ou digitando e-mail, validações e redirect |
| `src/services/api.test.js` | `normalizeApiBaseUrl` — origin fallback, URL com /api, edge cases |
| `src/utils/categorizador.test.js` | sugerirCategoria, gerarChaveTransacao, prepararTransacoesImportadas |
| `src/utils/relatorioCalc.test.js` | processarMeses, formatação, intervalos de meses |
| `src/utils/bankStatementParser.test.js` | Sanitização, parser local por regex, fallback de IA |

**Backend (`back/src/`)**

| Arquivo de teste | O que cobre |
|---|---|
| `controllers/authController.test.js` | register (envia código), verifyEmail/resendVerification e forgot/resetPassword — todos por código (inválido/expirado, limite→429, anti-enumeration, sucesso). Mocka I/O sem `vi.mock`: curto-circuita `connectDB` via `global.mongoose.conn` e espiona o emailService pela ponte CJS `authController.testdeps.js` |
| `controllers/investmentController.test.js` | CRUD + invariantes de Investment, soft-delete, ownership |
| `controllers/goalController.test.js` | CRUD + depósito/retirada, `valorAtual` nunca negativo |

> **Lacuna conhecida**: `subscriptionController` e `walletController` ainda não têm suíte
> dedicada — qualquer alteração nesses domínios deve **criar** os testes (regra de negócio).

### Padrões obrigatórios para novos testes

- **Arquivo**: `NomeDoComponente.test.jsx` (ou `.test.js` para utils/hooks) ao lado do arquivo testado
- **Labels acessíveis**: sempre buscar por `getByRole`, `getByLabelText` (exact match) ou `getByText` — nunca por classe CSS
- **Match exato para labels**: evitar `/regex/i` quando o texto pode ambiguamente corresponder a `aria-label` de outro elemento (ex: `'Senha'` em vez de `/senha/i` para evitar conflito com `aria-label="Mostrar senha"`)
- **Mocks de API**: usar `vi.mock('../services/api', () => ({ default: { post: vi.fn() } }))` — nunca fazer chamadas HTTP reais em teste
- **IntersectionObserver**: mockar como `class`, não como `vi.fn()` — é chamado com `new`
- **performance.now + RAF**: usar `vi.spyOn` e controle manual de timestamps para testes de animação

### Testes orientados a domínio (DDD) — obrigatório

Toda alteração precisa de testes que validem a **regra de negócio**, não a implementação:

- **Nomeie pela regra**: `it('rejeita aporte com valor negativo')`, não `it('retorna 400')`.
- **Teste as invariantes de cada agregado**: Wallet (competência `YYYY-MM`, valor positivo,
  saldo encadeado), Investment (`tipo` válido, `valor ≥ 0`, soft-delete oculta da listagem),
  Goal/Cofrinho (`valorAtual` nunca negativo, retirada limitada ao saldo, `cor` `#rrggbb`),
  Subscription (`billing_cycle` válido, avanço de data sem overflow de fim de mês), Auth
  (hash de senha, expiração de token).
- **Isole o domínio**: prefira testar funções puras (`back/src/utils/validators.js`,
  `front/src/utils/*.js`) sem I/O. Controllers que tocam Mongoose mockam o model.
- **Ownership/segurança é regra de negócio**: cubra o caso de recurso de outro usuário
  (espera 403/404), não só o caminho feliz.
- **Backend (importante — `vi.mock` NÃO intercepta `require()` CJS neste setup)**: nunca
  conectar a um banco real, mas não confie em `vi.mock` para substituir dependências de um
  controller CommonJS. Padrões que funcionam aqui:
  - **Model Mongoose**: `import Model from '...'` + `vi.spyOn(Model, 'findOne')` funciona porque
    o model é deduplicado por `mongoose.models.X` (import e require devolvem o mesmo objeto).
  - **`connectDB`**: curto-circuite o cache do `config/database.js` setando
    `global.mongoose.conn = {}` no topo do teste — o `connectDB` retorna cedo e nunca chama
    `mongoose.connect`.
  - **Módulos utilitários CJS que exportam objeto** (ex.: `emailService`): `import` (ESM) e
    `require` (CJS) devolvem objetos DIFERENTES no vitest, então espione via uma **ponte CJS**
    (`module.exports = require('../utils/x')`) importada pelo teste — assim você obtém a mesma
    instância que o controller usa. Ver `controllers/authController.testdeps.js`.

### Mocks de contexto

```jsx
// AuthContext
<AuthContext.Provider value={{ login: vi.fn() }}>
  <MemoryRouter><ComponenteTestado /></MemoryRouter>
</AuthContext.Provider>

// ThemeContext (quando necessário)
<ThemeContext.Provider value={{ isDark: false, toggleTheme: vi.fn(), theme: {} }}>
  <ComponenteTestado />
</ThemeContext.Provider>
```

### TODO em testes

- `AIAdvisor.test.jsx` → `it.todo` marcado: verificar que o histórico completo de mensagens é enviado à API (bloqueador 1 do adversarial-review de 2026-05-19)

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
- **Não usar `cacheRef.current.delete(mesSelecionado)` após mutações** — usar `cacheRef.current.clear()` (ou o helper `clearCache()` exportado pelo hook). `sincronizarCarteirasEmCadeia` atualiza saldo de TODOS os meses downstream; deletar só o mês atual deixa os demais com `saldo_inicial` errado no cache.
- **Não re-adicionar `sincronizarCarteirasEmCadeia` em `obterExtrato`** — foi removido intencionalmente para reduzir latência. Leituras não precisam sincronizar; mutações já garantem consistência.
- **Não chamar `fetchMesSelecionado({ silent: true })` após uma mutação sem `skipCache: true`** — sem esse flag o cache serve o dado anterior, não o novo.
- **Não entregar alteração sem atualizar este `CLAUDE.md`** — qualquer novo módulo/rota/regra ou mudança de comportamento deve ser refletida no guia na mesma entrega (ver Política de manutenção).
- **Não entregar alteração sem testes de domínio** — toda mudança precisa de testes unitários que validem a regra de negócio (DDD), com as suítes afetadas passando em `vitest run`.
- **Não expor API keys de IA no frontend** — chamar sempre via proxy `/api/ai/*`; as chaves vivem só no backend.
- **Não fazer hard-delete de Investment/Goal/Subscription** — usar soft-delete (`ativo = false`), como já fazem os controllers.
- **Não permitir `valorAtual` negativo em cofrinho** — uma retirada nunca pode exceder o saldo acumulado.

---

## Backlog ativo

Concluído desde a última revisão deste guia:

- [x] Página **Investimentos** com carteira por tipo, cofrinhos (metas) e evolução patrimonial
- [x] Página **Configurações** funcional (metas, categorias, tema, export, conta)
- [x] Backend de **Investimentos** e **Cofrinhos** (`investmentController`/`goalController`) com CRUD, soft-delete e testes
- [x] **Assinaturas** recorrentes (model, controller, painel, lançamento de cobrança)
- [x] **Gráfico de investimentos** e tabela de aportes na página Relatórios (`GraficoInvestimentos.jsx`)
- [x] **Proxy de IA no backend** (`/api/ai/*`) escondendo as API keys, com rate-limit por usuário

Pendente:

- [ ] Cobertura de testes para `subscriptionController` e `walletController` (criar suítes de domínio)
- [ ] Score de saúde financeira (feature planejada)
- [ ] **AIAdvisor: adicionar histórico de conversa** — cada chamada à API deve incluir as mensagens anteriores em `contents[]` para manter contexto entre turnos. Ver `AIAdvisor.jsx` e `docs/superpowers/specs/2026-05-19-frontend-polish-review.md` (BLOQUEADOR 1)
