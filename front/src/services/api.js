import axios from 'axios';

// Cria uma instância do Axios com a URL base do back-end
// Em produção, usa a variável de ambiente VITE_API_URL definida no Vercel
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: 10000,
});

// Interceptor de Requisição: Antes de enviar qualquer chamada pro Back-end...
api.interceptors.request.use(
    (config) => {
        // ...ele vai lá no LocalStorage procurar se o usuário já tem um Token salvo
        const token = localStorage.getItem('@WebWallet:token');

        // Se tiver, ele injeta automaticamente no cabeçalho (Header) de segurança
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor de Resposta: Opcional, mas ótimo para lidar com Token expirado
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Se o Node.js disser que o Token é inválido ou expirou (Erro 401 Unauthorized),
            // podemos limpar o storage e deslogar o usuário aqui futuramente.
            console.error("Token inválido ou expirado. Refaça o login.");
        }
        return Promise.reject(error);
    }
);

export default api;