# constants/

Responsabilidade: valores fixos de domínio compartilhados entre páginas e componentes.

## Arquivos

### `gastosFixos.js`

Fonte única de verdade para subcategorias de gastos fixos.
**Nunca duplicar esta lista em outro arquivo.**

| Export | Tipo | Uso |
|--------|------|-----|
| `GASTOS_FIXOS_PREFIX` | `"gastos_fixos."` | Prefixo da categoria salva no banco |
| `GASTOS_FIXOS` | `Array<{key, label, icon}>` | 12 subcategorias fixas |
| `GASTOS_FIXOS_MAP` | `{ [key]: item }` | Lookup O(1) por key |
| `resolverGastoFixo(categoria)` | Função | Retorna item ou `null` |
| `labelCategoria(categoria)` | Função | Label legível para qualquer categoria |
| `iconeCategoria(categoria, fallbackIcons)` | Função | Ícone para qualquer categoria |

**Subcategorias disponíveis:**
`aluguel`, `energia`, `agua`, `internet`, `celular`, `gas`,
`streaming`, `cartaoCredito`, `assinaturasIA`, `planoSaude`,
`seguroCarro`, `condominio`

**Para checar se uma categoria é gasto fixo:**
```js
categoria.startsWith(GASTOS_FIXOS_PREFIX)  // "gastos_fixos.aluguel" → true
```

**Para obter label/ícone de qualquer categoria (regular ou fixa):**
```js
labelCategoria('gastos_fixos.energia')  // "Energia elétrica"
iconeCategoria('gastos_fixos.streaming', CAT_ICONS)  // "📺"
```

## Regras

- Ao adicionar nova subcategoria de gasto fixo, adicionar **apenas** no array
  `GASTOS_FIXOS` — `GASTOS_FIXOS_MAP` e helpers derivam automaticamente.
- Categorias regulares (`Alimentação`, `Transporte`, etc.) **não ficam aqui** —
  estão em `CAT_ICONS` dentro de `Dashboard.jsx` pois são usadas apenas lá.
- Não exportar valores inline — todos os exports devem ter nome explícito.
