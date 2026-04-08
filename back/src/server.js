require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();

// --- 1. CONEXÃO COM O BANCO ---
connectDB();

// --- 2. MIDDLEWARES GLOBAIS ---
app.use(cors());
app.use(express.json());

// --- 3. ROTA DE TESTE (Health Check) ---
app.get('/', (req, res) => {
    res.json({
        status: 'Online',
        mensagem: 'API da Web-Wallet rodando com sucesso!',
        timestamp: new Date().toISOString() // Bom para monitoramento de uptime
    });
});

// --- 4. DEFINIÇÃO DAS ROTAS (API) ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));

// --- 5. MIDDLEWARE DE TRATAMENTO DE ERRO (O "Pulo do Gato" de Infra) ---
// Se alguma rota der erro interno, este middleware captura e responde em JSON
// Evitando que o servidor mande aquele HTML de erro padrão do Express
app.use((err, req, res, next) => {
    console.error(`[SERVER ERROR] ${new Date().toISOString()}:`, err.stack);

    res.status(500).json({
        error: 'Erro interno no servidor',
        mensagem: err.message
    });
});

// --- 6. ROTA 404 (Endpoint não encontrado) ---
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado. Verifique a URL e o método (GET/POST).' });
});

// --- 7. INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor voando na porta ${PORT}`);
    console.log(`✅ Infraestrutura: CORS, JSON e ErrorHandler ativos.`);
});