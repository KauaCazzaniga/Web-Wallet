// Rotas: investmentRoutes
// Responsabilidade: mapear os endpoints de investimentos e cofrinhos.
//   Todas as rotas exigem autenticação via authMiddleware (JWT).
// Depende de: investmentController, goalController, authMiddleware

'use strict';

const express = require('express');

const authMiddleware        = require('../middlewares/auth');
const investmentController  = require('../controllers/investmentController');
const goalController        = require('../controllers/goalController');

const router = express.Router();

// Aplica autenticação em todas as rotas deste arquivo
router.use(authMiddleware);

// ── Investimentos (Carteira) ──────────────────────────────────────────────────
// GET    /api/investments           → lista todos os ativos ativos + resumo
// POST   /api/investments           → cria novo investimento
// PUT    /api/investments/:id       → atualiza campos de um investimento
// DELETE /api/investments/:id       → soft-delete (ativo = false)

router.get('/',    investmentController.listar);
router.post('/',   investmentController.criar);
router.put('/:id', investmentController.atualizar);
router.delete('/:id', investmentController.remover);

// ── Cofrinhos (Metas) ─────────────────────────────────────────────────────────
// GET    /api/investments/goals              → lista cofrinhos ativos + resumo
// POST   /api/investments/goals              → cria cofrinho
// PUT    /api/investments/goals/:id          → atualiza metadados do cofrinho
// PATCH  /api/investments/goals/:id/depositar → depósito ou retirada de valor
// DELETE /api/investments/goals/:id          → soft-delete

// IMPORTANTE: rotas de /goals ANTES de /:id para evitar conflito de parâmetro dinâmico
router.get('/goals',                    goalController.listar);
router.post('/goals',                   goalController.criar);
router.put('/goals/:id',                goalController.atualizar);
router.patch('/goals/:id/depositar',    goalController.depositar);
router.delete('/goals/:id',             goalController.remover);

module.exports = router;
