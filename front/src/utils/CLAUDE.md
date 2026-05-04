# utils/

Responsabilidade: funções puras e helpers sem estado React.

## Arquivos

### `relatorioCalc.js`

Cálculos e formatação usados na página Relatórios.

| Export | Descrição |
|--------|-----------|
| `formatCurrencyBRL(value)` | Formata em R$ arredondando antes |
| `formatCompactCurrency(value)` | Ex: `R$ 12,5k` |
| `getCurrentMonthKey()` | "YYYY-MM" do mês atual |
| `shiftMonthKey(monthKey, offset)` | Desloca N meses |
| `getDefaultReportRange()` | `{ inicio, fim }` — últimos 6 meses |
| `listMonthsBetween(inicio, fim)` | Array "YYYY-MM" no intervalo |
| `processarMeses(transacoes, inicio, fim)` | Array com receita, despesa, saldo, variações % |

`processarMeses` retorna objetos com:
`{ mes, label, labelCompleto, receita, despesa, saldo, saldoAcumulado, varReceita, varDespesa, mesAnteriorLabel }`

### `geminiParser.js`

Parser de extratos bancários via IA com fallback multi-provider.

| Export | Descrição |
|--------|-----------|
| `parseBankStatement(texto, apiKey?)` | Sanitiza, batcheia e chama Gemini → Groq → Mistral |
| `GEMINI_SYSTEM_PROMPT` | Prompt fixo do parser |

Fluxo: sanitização → ≤ 60 linhas = 1 chamada / > 60 = chunks de 50 com 6 s de delay.
Erro 429: aguarda 15 s, 1 retry. Falha final: mensagem amigável.

### `pdfExtractor.js`

| Export | Descrição |
|--------|-----------|
| `extractTextFromPdf(file)` | Lê PDF via pdfjs-dist (CDN worker), retorna texto |

Preserva quebras de linha pela posição Y dos itens da página.

### `categorizador.js`

| Export | Descrição |
|--------|-----------|
| `CATEGORIAS_IMPORTACAO` | Array de categorias disponíveis no modal de importação |
| `sugerirCategoria(descricao)` | Sugere categoria por termos na descrição |
| `gerarChaveTransacao({data, valor, descricao})` | Chave de deduplicação |
| `prepararTransacoesImportadas(transacoes)` | Normaliza + sugere categoria + `incluir: true` |

## Regras

- **Funções puras** — nenhum import de React, nenhuma chamada de hook aqui.
- **Nunca exibir floats sem arredondar** — usar `Math.round(v * 100) / 100`
  ou `formatCurrencyBRL` antes de exibir qualquer valor monetário.
- `parseBankStatement` é caro (chamada de API) — não chamar por transação
  individual, sempre passar o texto completo do extrato.
- `gerarChaveTransacao` normaliza acentos e ignora case para deduplicação —
  não reimplementar esta lógica em outros lugares.
