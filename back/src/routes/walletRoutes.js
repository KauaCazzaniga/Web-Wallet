const express = require('express');

const walletController = require('../controllers/walletController');
const authMiddleware = require('../middlewares/auth');
const { verifyTransactionOwnership } = require('../middlewares/resourceOwnership');
const { validate, schemas } = require('../middlewares/validate');

const router = express.Router();

router.use(authMiddleware);

router.get('/meses', walletController.listarMeses);
router.get('/total-investido', walletController.totalInvestido);
router.get('/dashboard', walletController.obterDashboard);
router.post('/iniciar', validate(schemas.iniciarMes), walletController.iniciarMes);
router.post('/transacao', validate(schemas.transacao), walletController.adicionarTransacao);
router.post('/transacoes/importar', validate(schemas.importacao), walletController.importarTransacoes);
router.get('/extrato/:competencia', walletController.obterExtrato);
router.delete('/transacao/:transacaoId', verifyTransactionOwnership, walletController.deletarTransacao);
router.delete('/:competencia/transacao/:transacaoId', verifyTransactionOwnership, walletController.deletarTransacao);
router.delete('/:competencia/transacoes', walletController.deletarTodasTransacoes);
router.put('/:competencia/limites', validate(schemas.definirLimites), walletController.definirLimites);

module.exports = router;
