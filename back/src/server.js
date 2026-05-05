require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./config/logger');

const app = express();

// --- 2. MIDDLEWARES GLOBAIS ---
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'same-site' },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc:  ["'self'"],
            styleSrc:   ["'self'"],
            imgSrc:     ["'self'", 'data:'],
            connectSrc: ["'self'"],
            frameSrc:   ["'none'"],
            objectSrc:  ["'none'"],
        },
    },
}));

const defaultAllowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://www.waltrix.com.br',
    'https://waltrix.com.br',
    'https://web-wallet-orcin.vercel.app',
];

const envAllowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

const corsOptions = {
    origin: (origin, callback) => {
        // Permite requisições sem origin (ex: curl, Postman, mobile)
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`Origem bloqueada pelo CORS: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
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
app.use('/api/auth',        require('./routes/authRoutes'));
app.use('/api/wallet',      require('./routes/walletRoutes'));
app.use('/api/ai',          require('./routes/aiRoutes'));
app.use('/api/investments', require('./routes/investmentRoutes'));

// --- 5. MIDDLEWARE DE TRATAMENTO DE ERRO (O "Pulo do Gato" de Infra) ---
// Se alguma rota der erro interno, este middleware captura e responde em JSON
// Evitando que o servidor mande aquele HTML de erro padrão do Express
app.use((err, req, res, next) => {
    logger.error(`[SERVER ERROR] ${req.method} ${req.path} — ${err.message}`, { stack: err.stack });

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
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        logger.info(`Servidor iniciado na porta ${PORT}`);
        logger.info(`Infraestrutura: CORS, JSON e ErrorHandler ativos.`);
    });
}

module.exports = app;
