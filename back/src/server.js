require('dotenv').config();
const express = require('express');
const cors = require('cors'); // 1. Importa o "segurança" das portas
const connectDB = require('./config/database');

const app = express();

// --- 1. CONEXÃO COM O BANCO ---
connectDB();

// --- 2. MIDDLEWARES GLOBAIS ---
// IMPORTANTE: O CORS deve vir ANTES das rotas
app.use(cors()); // Libera o acesso para o seu Front (Vite na porta 5173)
app.use(express.json()); // Permite que o Express entenda JSON no corpo das requisições

// --- 3. ROTA DE TESTE (Health Check) ---
app.get('/', (req, res) => {
    res.json({
        status: 'Online',
        mensagem: 'API da Web-Wallet rodando com sucesso!'
    });
});

// --- 4. DEFINIÇÃO DAS ROTAS (API) ---
// Sistema de Login e Cadastro (Rotas Públicas)
app.use('/api/auth', require('./routes/authRoutes'));

// Sistema da Carteira e Transações (Rotas Protegidas)
app.use('/api/wallet', require('./routes/walletRoutes'));

// --- 5. INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor voando na porta ${PORT}`);
    console.log(`✅ CORS habilitado para comunicação com o Front-end`);
    console.log(`📡 Rotas de carteira: http://localhost:${PORT}/api/wallet`);
});