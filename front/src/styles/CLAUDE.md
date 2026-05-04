# styles/

Responsabilidade: estilos globais e tokens de design compartilhados.

## Arquivos

### `global.js`
Atualmente vazio — reservado para `createGlobalStyle` do styled-components
caso seja necessário reset ou variáveis CSS globais adicionais.

O reset principal está em `src/index.css` (arquivo CSS puro, mínimo).

## Onde ficam os estilos

Os estilos do projeto são **distribuídos por arquivo de componente/página**
via styled-components, não centralizados aqui. Isso é intencional.

| Local | O que define |
|-------|-------------|
| `Dashboard.jsx` — `AppContainer` | Todas as variáveis `--dash-*` (dark/light) |
| `Relatorios.jsx` — `AppContainer` | Todas as variáveis `--rel-*` (dark/light) |
| Cada componente | Styled-components locais usando as variáveis acima |

## Variáveis CSS do Dashboard (`--dash-*`)
```
--dash-shell        --dash-surface        --dash-surface-muted
--dash-border       --dash-border-strong  --dash-heading
--dash-text         --dash-muted          --dash-muted-strong
--dash-primary      --dash-primary-strong --dash-primary-soft
--dash-input-bg     --dash-table-head     --dash-shadow
--dash-soft-shadow  --dash-danger-soft    --dash-danger-border
```

## Regras

- **Nunca hardcodar cores** fora das declarações de variável no `AppContainer`.
  Usar sempre `var(--dash-text)`, `var(--rel-heading)`, etc.
- Dark/light mode controlado pela prop `$dark={isDark}` no `AppContainer` —
  as variáveis mudam via seletor CSS dentro do styled-component.
- **Tailwind está instalado mas não é usado** — não introduzir classes Tailwind.
- Props booleanas de estilo devem ser transient (`$dark`, `$active`, `$over`)
  para não vazar para o DOM.
