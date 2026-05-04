# services/

Responsabilidade: clientes HTTP e integrações com serviços externos.

## Arquivos

### `api.js`

Instância Axios configurada para comunicação com o backend Node.js.

| Configuração | Valor |
|-------------|-------|
| `baseURL` | `http://localhost:3000/api` |
| `timeout` | 10 000 ms |

**Interceptor de requisição:** injeta `Authorization: Bearer <token>` se
`@WebWallet:token` existir no localStorage.

**Interceptor de resposta:** loga erro `401` no console (token expirado).
Não faz logout automático — comportamento a implementar futuramente.

**Uso:**
```js
import api from '../services/api';

// GET
const { data } = await api.get('/wallet/extrato/2025-03');

// POST
await api.post('/wallet/transacao', { competencia, tipo, categoria, valor, descricao });

// PUT
await api.put(`/wallet/${comp}/limites`, { limites });

// DELETE
await api.delete(`/wallet/${comp}/transacao/${id}`);
```

## Regras

- **Não criar instâncias Axios avulsas** — importar sempre esta instância para
  que o interceptor de autenticação funcione.
- Chamadas à API Gemini/Groq/Mistral (parsing de PDF) **não passam por aqui** —
  são feitas diretamente em `geminiParser.js` com chaves do `.env` do frontend.
- Se o backend mudar de porta, alterar **apenas** o `baseURL` aqui.
- Não adicionar lógica de retry neste arquivo — tratar erros em cada chamada
  individualmente ou em utils dedicados.
