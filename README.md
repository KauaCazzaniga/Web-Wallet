# Web-Wallet

Aplicação web de controle financeiro pessoal, desenvolvida para simplificar o acompanhamento de receitas, despesas e metas mensais — com suporte à importação de extratos bancários via inteligência artificial.

---

## Visão geral

Web-Wallet permite que o usuário organize suas finanças por competência (mês/ano), visualize a evolução patrimonial ao longo do tempo e defina limites de gastos por categoria. O destaque da aplicação é a importação automática de extratos em PDF: o texto extraído é interpretado por modelos de IA (Gemini, Groq ou Mistral) que identificam e categorizam cada transação.

---

## Funcionalidades

### Dashboard
- KPIs mensais: receitas, despesas e saldo do mês
- Seletor de mês com dropdown — lista apenas meses com dados registrados, com opção de adicionar meses manualmente
- Badge **Hoje** / **Histórico** indicando o contexto do mês visualizado
- Modo somente leitura automático em meses históricos (botões de ação desabilitados)
- Barras de progresso por categoria de gasto com alertas visuais ao ultrapassar metas
- Painel de gastos fixos (aluguel, energia, internet, streaming etc.) com metas individuais
- Widget de investimentos com aporte mensal e patrimônio acumulado
- Tabela de transações paginada (15 por página) com exclusão individual ou em lote
- Importação de extratos bancários em PDF com revisão antes de confirmar

### Relatórios
- Filtro de período (intervalo de meses)
- Cards de resumo: receitas totais, despesas totais, saldo do período e média mensal de gastos
- Gráfico de barras comparativo receita × despesa por mês
- Gráfico de saldo acumulado (linha + área)
- **Taxa de poupança mensal**: percentual da receita que sobrou a cada mês, com evolução visual e alerta para meses abaixo de 10%
- Tabela comparativa com variações percentuais mês a mês

### Metas de gastos
- Definição de limites por categoria regular e por subcategoria de gastos fixos
- Persistência local (localStorage) por usuário — as metas não somem ao trocar de mês
- Sincronização opcional com o backend

### Importação via IA
- Leitura de PDF com extração de texto por coordenadas (pdfjs-dist)
- Parser multi-provider com fallback automático: **Gemini 2.5 Flash → Groq (LLaMA 3.3) → Mistral Large**
- Fila serial por provider com intervalo entre chamadas e retry com backoff exponencial
- Parser local regex como primeira tentativa (sem custo de API)
- Deduplicação e normalização de transações antes de exibir para revisão

---

## Tecnologias

### Frontend
| Tecnologia | Uso |
|---|---|
| React 19 + Vite 8 | Interface e build |
| styled-components v6 | Estilização com tema dark/light |
| Recharts | Gráficos de barras e área |
| Lucide React | Ícones |
| pdfjs-dist 3.11 | Extração de texto de PDFs |
| Axios | Comunicação com a API |

### Backend
| Tecnologia | Uso |
|---|---|
| Node.js + Express 5 | Servidor HTTP e roteamento |
| MongoDB + Mongoose | Banco de dados e modelagem |
| bcryptjs | Hash de senhas |
| jsonwebtoken | Autenticação via JWT |

### Integrações de IA
| Provider | Modelo |
|---|---|
| Google Gemini | gemini-2.5-flash |
| Groq | llama-3.3-70b-versatile |
| Mistral | mistral-large-latest |

---

## Arquitetura

```
Web-Wallet/
├── front/          # React + Vite
│   └── src/
│       ├── pages/          # Dashboard, Relatórios, Login, Registro
│       ├── components/     # Componentes reutilizáveis e modais
│       ├── context/        # FinanceContext (transações, investimentos, metas)
│       ├── contexts/       # AuthContext, ThemeContext
│       ├── utils/          # Parser de IA, extrator de PDF, cálculos de relatório
│       ├── constants/      # Categorias de gastos fixos
│       └── services/       # Cliente HTTP (Axios)
│
└── back/src/       # Node.js + Express
    ├── controllers/        # Lógica de negócio (wallet, auth)
    ├── models/             # Schemas Mongoose (User, Wallet)
    ├── routes/             # Rotas da API
    ├── middlewares/        # Autenticação JWT
    └── config/             # Conexão com MongoDB
```

---

## Modelo de dados

Cada usuário possui **wallets** separadas por competência (`YYYY-MM`). Uma wallet armazena:
- `resumo`: saldo inicial (herdado do mês anterior), receitas, despesas e saldo atual
- `transacoes[]`: lista de lançamentos com soft-delete (`deletadoEm`)
- `limites_gastos`: mapa de categoria → limite em reais

A sincronização em cadeia garante que o saldo final de um mês seja automaticamente transferido como saldo inicial do mês seguinte.

---

## Categorias suportadas

**Regulares:** Alimentação, Transporte, Lazer, Saúde, Salário, Investimentos, Outros

**Gastos fixos:** Aluguel/Financiamento, Energia elétrica, Água e esgoto, Internet, Celular, Gás, Streaming, Cartão de crédito, Assinaturas de IA, Plano de saúde, Seguro do carro, Condomínio

---

## Licença

MIT
