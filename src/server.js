require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');

const app = express();

// Middleware para entender JSON (Deve vir ANTES das rotas)
app.use(express.json());

// Conecta ao Banco de Dados
connectDB();

// Rota de Teste Base
app.get('/', (req, res) => {
    res.json({ mensagem: 'API da Web-Wallet rodando com sucesso! ' });
});

// ==========================================
// ROTAS DA APLICAÇÃO
// ==========================================
// Sistema de Login e Cadastro (Pública)
app.use('/api/auth', require('./routes/authRoutes'));

// Sistema da Carteira (Protegida pelo Middleware)
app.use('/api/wallet', require('./routes/walletRoutes'));
// ==========================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(` Servidor rodando na porta ${PORT}`);
});