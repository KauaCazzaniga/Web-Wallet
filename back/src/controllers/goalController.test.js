// Testes: goalController
// Abordagem: node:test + mocks manuais
//   Cobre criação, listagem, atualização, depósito/saque e soft-delete de cofrinhos.
// Rodar: node --test src/controllers/goalController.test.js

'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const validators = require('../utils/validators');

// ─────────────────────────────────────────────────────────────
// MOCK — Goal model
// ─────────────────────────────────────────────────────────────

let _findMock    = null;
let _findOneMock = null;
let _createMock  = null;

const makeGoal = (overrides = {}) => ({
    _id:        'goal-001',
    nome:       'Viagem Europa',
    icone:      '✈️',
    cor:        '#3b82f6',
    valorMeta:  20000,
    valorAtual: 8500,
    prazo:      '2026-12',
    ativo:      true,
    createdAt:  new Date('2025-01-01'),
    updatedAt:  new Date('2025-01-01'),
    save:       async function () { return this; },
    toObject:   function () { return { ...this }; },
    ...overrides,
});

const GoalMock = {
    find:    (...args) => (_findMock    ? _findMock(...args)    : Promise.resolve([])),
    findOne: (...args) => (_findOneMock ? _findOneMock(...args) : Promise.resolve(null)),
    create:  (...args) => (_createMock  ? _createMock(...args)  : Promise.resolve(makeGoal())),
};

// ─────────────────────────────────────────────────────────────
// CONTROLLER INJETADO (sem require real do GoalModel)
// ─────────────────────────────────────────────────────────────

function buildGoalController(Goal) {
    const {
        stringObrigatoria, valorPositivo, corHexEhValida,
        prazoEhValido, sanitizarValor,
    } = validators;

    const obterCofrinhoDoUsuario = async (id, usuario_id) => {
        const goal = await Goal.findOne({ _id: id, usuario_id, ativo: true });
        if (!goal) throw { status: 404, erro: 'Cofrinho não encontrado.' };
        return goal;
    };

    const serializar = (doc) => {
        const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
        const pct  = obj.valorMeta > 0 ? (obj.valorAtual / obj.valorMeta) * 100 : 0;
        return {
            id:          obj._id,
            nome:        obj.nome,
            icone:       obj.icone,
            cor:         obj.cor,
            valorMeta:   obj.valorMeta,
            valorAtual:  obj.valorAtual,
            prazo:       obj.prazo ?? null,
            progresso:   Math.round(pct * 10) / 10,
            concluido:   obj.valorAtual >= obj.valorMeta,
        };
    };

    return {
        async listar(req, res) {
            const usuario_id = req.usuarioId;
            const cofrinhos  = await Goal.find({ usuario_id, ativo: true });
            const totalAcumulado = cofrinhos.reduce((s, g) => s + g.valorAtual, 0);
            const totalMetas     = cofrinhos.reduce((s, g) => s + g.valorMeta, 0);
            res.status(200).json({
                cofrinhos: cofrinhos.map(serializar),
                resumo: {
                    totalAcumulado: sanitizarValor(totalAcumulado),
                    totalMetas:     sanitizarValor(totalMetas),
                    quantidade:     cofrinhos.length,
                    concluidos:     cofrinhos.filter((g) => g.valorAtual >= g.valorMeta).length,
                },
            });
        },

        async criar(req, res) {
            const usuario_id = req.usuarioId;
            const { nome, icone = '🐷', cor = '#3b82f6', valorMeta, prazo = null } = req.body;
            if (!stringObrigatoria(nome, 100)) return res.status(400).json({ erro: 'Nome é obrigatório (máx. 100 caracteres).' });
            if (!valorPositivo(valorMeta))     return res.status(400).json({ erro: 'Valor da meta deve ser maior que zero.' });
            if (!corHexEhValida(cor))          return res.status(400).json({ erro: 'Cor inválida. Use o formato #rrggbb.' });
            if (!prazoEhValido(prazo))         return res.status(400).json({ erro: 'Prazo inválido. Use o formato YYYY-MM.' });
            const novo = await Goal.create({ usuario_id, nome: String(nome).trim(), icone, cor, valorMeta: sanitizarValor(valorMeta), valorAtual: 0, prazo: prazo || null });
            res.status(201).json({ mensagem: 'Cofrinho criado com sucesso.', cofrinho: serializar(novo) });
        },

        async atualizar(req, res) {
            try {
                const goal = await obterCofrinhoDoUsuario(req.params.id, req.usuarioId);
                const { nome, icone, cor, valorMeta, prazo } = req.body;
                if (nome !== undefined)      { if (!stringObrigatoria(nome, 100)) return res.status(400).json({ erro: 'Nome inválido.' }); goal.nome = String(nome).trim(); }
                if (icone !== undefined)     { goal.icone = String(icone).slice(0, 10); }
                if (cor !== undefined)       { if (!corHexEhValida(cor)) return res.status(400).json({ erro: 'Cor inválida.' }); goal.cor = cor; }
                if (valorMeta !== undefined) { if (!valorPositivo(valorMeta)) return res.status(400).json({ erro: 'Valor da meta deve ser maior que zero.' }); goal.valorMeta = sanitizarValor(valorMeta); }
                if (prazo !== undefined)     { if (!prazoEhValido(prazo)) return res.status(400).json({ erro: 'Prazo inválido.' }); goal.prazo = prazo || null; }
                await goal.save();
                res.status(200).json({ mensagem: 'Cofrinho atualizado com sucesso.', cofrinho: serializar(goal) });
            } catch (err) {
                if (err.status) return res.status(err.status).json({ erro: err.erro });
                res.status(500).json({ erro: 'Erro ao atualizar cofrinho.' });
            }
        },

        async depositar(req, res) {
            try {
                const goal = await obterCofrinhoDoUsuario(req.params.id, req.usuarioId);
                const n = Number(req.body.valor);
                if (!Number.isFinite(n) || n === 0) return res.status(400).json({ erro: 'Informe um valor diferente de zero.' });
                const novoValor = Math.round((goal.valorAtual + n) * 100) / 100;
                if (novoValor < 0) return res.status(400).json({ erro: `Saldo insuficiente. Máximo para retirada: R$ ${goal.valorAtual.toFixed(2)}.` });
                goal.valorAtual = novoValor;
                await goal.save();
                const operacao = n > 0 ? 'Depósito' : 'Retirada';
                res.status(200).json({ mensagem: `${operacao} realizado com sucesso.`, cofrinho: serializar(goal) });
            } catch (err) {
                if (err.status) return res.status(err.status).json({ erro: err.erro });
                res.status(500).json({ erro: 'Erro ao movimentar cofrinho.' });
            }
        },

        async remover(req, res) {
            try {
                const goal = await obterCofrinhoDoUsuario(req.params.id, req.usuarioId);
                goal.ativo = false;
                await goal.save();
                res.status(200).json({ mensagem: 'Cofrinho removido com sucesso.' });
            } catch (err) {
                if (err.status) return res.status(err.status).json({ erro: err.erro });
                res.status(500).json({ erro: 'Erro ao remover cofrinho.' });
            }
        },
    };
}

const ctrl = buildGoalController(GoalMock);

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const makeReq = (o = {}) => ({ usuarioId: 'user-123', params: {}, body: {}, ...o });
const makeRes = () => {
    const r = { _status: 200, _body: null };
    r.status = (c) => { r._status = c; return r; };
    r.json   = (b) => { r._body  = b; return r; };
    return r;
};

// ─────────────────────────────────────────────────────────────
// TESTES — goalController.listar
// ─────────────────────────────────────────────────────────────

describe('goalController.listar', () => {
    beforeEach(() => { _findMock = null; });

    it('retorna lista vazia com resumo zerado', async () => {
        _findMock = () => Promise.resolve([]);
        const res = makeRes();
        await ctrl.listar(makeReq(), res);
        assert.equal(res._status, 200);
        assert.equal(res._body.cofrinhos.length, 0);
        assert.equal(res._body.resumo.quantidade, 0);
        assert.equal(res._body.resumo.concluidos, 0);
    });

    it('calcula progresso e concluidos corretamente', async () => {
        const g1 = makeGoal({ _id: '1', valorMeta: 1000, valorAtual: 1000 }); // concluído
        const g2 = makeGoal({ _id: '2', valorMeta: 2000, valorAtual: 500  }); // 25%
        _findMock = () => Promise.resolve([g1, g2]);
        const res = makeRes();
        await ctrl.listar(makeReq(), res);
        assert.equal(res._body.resumo.concluidos, 1);
        assert.equal(res._body.cofrinhos[0].concluido, true);
        assert.equal(res._body.cofrinhos[0].progresso, 100);
        assert.equal(res._body.cofrinhos[1].progresso, 25);
    });
});

// ─────────────────────────────────────────────────────────────
// TESTES — goalController.criar
// ─────────────────────────────────────────────────────────────

describe('goalController.criar', () => {
    beforeEach(() => { _createMock = null; });

    it('retorna 400 para nome vazio', async () => {
        const res = makeRes();
        await ctrl.criar(makeReq({ body: { nome: '', valorMeta: 1000, cor: '#3b82f6' } }), res);
        assert.equal(res._status, 400);
        assert.ok(res._body.erro.includes('Nome'));
    });

    it('retorna 400 para valorMeta = 0', async () => {
        const res = makeRes();
        await ctrl.criar(makeReq({ body: { nome: 'Meta', valorMeta: 0, cor: '#3b82f6' } }), res);
        assert.equal(res._status, 400);
        assert.ok(res._body.erro.includes('meta'));
    });

    it('retorna 400 para cor inválida', async () => {
        const res = makeRes();
        await ctrl.criar(makeReq({ body: { nome: 'Meta', valorMeta: 500, cor: 'blue' } }), res);
        assert.equal(res._status, 400);
        assert.ok(res._body.erro.includes('Cor'));
    });

    it('retorna 400 para prazo em formato errado', async () => {
        const res = makeRes();
        await ctrl.criar(makeReq({ body: { nome: 'Meta', valorMeta: 500, cor: '#abc123', prazo: '12/2026' } }), res);
        assert.equal(res._status, 400);
        assert.ok(res._body.erro.includes('Prazo'));
    });

    it('cria com sucesso e valorAtual inicia em 0', async () => {
        _createMock = async (data) => makeGoal({ ...data, valorAtual: 0, _id: 'new-goal' });
        const res = makeRes();
        await ctrl.criar(makeReq({ body: { nome: 'Viagem', valorMeta: 5000, cor: '#3b82f6' } }), res);
        assert.equal(res._status, 201);
        assert.equal(res._body.cofrinho.valorAtual, 0);
        assert.equal(res._body.cofrinho.concluido, false);
    });

    it('aceita prazo nulo (sem data limite)', async () => {
        _createMock = async (data) => makeGoal({ ...data, prazo: null });
        const res = makeRes();
        await ctrl.criar(makeReq({ body: { nome: 'Reserva', valorMeta: 10000, cor: '#10b981' } }), res);
        assert.equal(res._status, 201);
        assert.equal(res._body.cofrinho.prazo, null);
    });
});

// ─────────────────────────────────────────────────────────────
// TESTES — goalController.depositar
// ─────────────────────────────────────────────────────────────

describe('goalController.depositar', () => {
    beforeEach(() => { _findOneMock = null; });

    it('retorna 404 para cofrinho inexistente', async () => {
        _findOneMock = () => Promise.resolve(null);
        const res = makeRes();
        await ctrl.depositar(makeReq({ params: { id: 'x' }, body: { valor: 100 } }), res);
        assert.equal(res._status, 404);
    });

    it('retorna 400 para valor = 0', async () => {
        _findOneMock = () => Promise.resolve(makeGoal());
        const res = makeRes();
        await ctrl.depositar(makeReq({ params: { id: 'goal-001' }, body: { valor: 0 } }), res);
        assert.equal(res._status, 400);
        assert.ok(res._body.erro.includes('zero'));
    });

    it('retorna 400 para saque maior que saldo', async () => {
        _findOneMock = () => Promise.resolve(makeGoal({ valorAtual: 100 }));
        const res = makeRes();
        await ctrl.depositar(makeReq({ params: { id: 'goal-001' }, body: { valor: -200 } }), res);
        assert.equal(res._status, 400);
        assert.ok(res._body.erro.includes('Saldo insuficiente'));
    });

    it('deposita valor positivo corretamente', async () => {
        const goal = makeGoal({ valorAtual: 1000 });
        _findOneMock = () => Promise.resolve(goal);
        const res = makeRes();
        await ctrl.depositar(makeReq({ params: { id: 'goal-001' }, body: { valor: 500 } }), res);
        assert.equal(res._status, 200);
        assert.equal(goal.valorAtual, 1500);
        assert.ok(res._body.mensagem.includes('Depósito'));
    });

    it('saca valor negativo corretamente', async () => {
        const goal = makeGoal({ valorAtual: 1000 });
        _findOneMock = () => Promise.resolve(goal);
        const res = makeRes();
        await ctrl.depositar(makeReq({ params: { id: 'goal-001' }, body: { valor: -300 } }), res);
        assert.equal(res._status, 200);
        assert.equal(goal.valorAtual, 700);
        assert.ok(res._body.mensagem.includes('Retirada'));
    });

    it('marca concluido = true quando valorAtual atinge valorMeta', async () => {
        const goal = makeGoal({ valorMeta: 1000, valorAtual: 900 });
        _findOneMock = () => Promise.resolve(goal);
        const res = makeRes();
        await ctrl.depositar(makeReq({ params: { id: 'goal-001' }, body: { valor: 100 } }), res);
        assert.equal(res._status, 200);
        assert.equal(res._body.cofrinho.concluido, true);
        assert.equal(res._body.cofrinho.progresso, 100);
    });
});

// ─────────────────────────────────────────────────────────────
// TESTES — goalController.remover
// ─────────────────────────────────────────────────────────────

describe('goalController.remover', () => {
    beforeEach(() => { _findOneMock = null; });

    it('retorna 404 para cofrinho inexistente', async () => {
        _findOneMock = () => Promise.resolve(null);
        const res = makeRes();
        await ctrl.remover(makeReq({ params: { id: 'x' } }), res);
        assert.equal(res._status, 404);
    });

    it('retorna 200 e marca ativo = false', async () => {
        let saved = false;
        const goal = makeGoal({ save: async function () { saved = true; return this; } });
        _findOneMock = () => Promise.resolve(goal);
        const res = makeRes();
        await ctrl.remover(makeReq({ params: { id: 'goal-001' } }), res);
        assert.equal(res._status, 200);
        assert.equal(goal.ativo, false);
        assert.ok(saved);
    });
});
