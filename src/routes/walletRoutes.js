const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middlewares/auth'); // O nosso segurança!

// Todas as rotas abaixo desta linha vão exigir o Token (Crachá)
router.use(authMiddleware);

// POST /api/wallet/iniciar
router.post('/iniciar', walletController.iniciarMes);

// POST /api/wallet/transacao
router.post('/transacao', walletController.adicionarTransacao);

// GET /api/wallet/:competencia (Ex: /api/wallet/2026-03)
router.get('/:competencia', walletController.obterExtrato);

module.exports = router;