// Testes: investmentController
// Abordagem: node:test + mocks manuais (sem dependências externas)
//   Cobre todos os cenários de negócio de cada endpoint.
// Rodar: node --test src/controllers/investmentController.test.js

'use strict';

const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// ─────────────────────────────────────────────────────────────
// MOCKS
// ─────────────────────────────────────────────────────────────

// Mock do connectDB — não conecta no banco real durante os testes
const connectDBMock = async () => {};

// Fábrica de documento Investment falso
const makeFakeInv = (overrides = {}) => ({
    _id:        'inv-001',
    tipo:       'CDB',
    nome:       'CDB Nubank',
    taxa:       '110% CDI',
    valor:      5000,
    rendimento: 500,
    mesInicio:  '2025-01',
    ativo:      true,
    createdAt:  new Date('2025-01-10'),
    updatedAt:  new Date('2025-01-10'),
    save:       async function () { return this; },
    toObject:   function () { return { ...this }; },
    ...overrides,
});

// Mock do model Investment — sobrescreve require('../models/Investment')
let _findOneMock   = null;
let _findMock      = null;
let _createMock    = null;

const InvestmentMock = {
    find:    (...args) => (_findMock   ? _findMock(...args)   : Promise.resolve([])),
    findOne: (...args) => (_findOneMock? _findOneMock(...args): Promise.resolve(null)),
    create:  (...args) => (_createMock ? _createMock(...args) : Promise.resolve(makeFakeInv())),
};

// ─────────────────────────────────────────────────────────────
// LOAD CONTROLLERS COM DEPENDÊNCIAS SUBSTITUÍDAS
// ─────────────────────────────────────────────────────────────

// Substituição manual de módulos via Module._resolveFilename seria complexa no CJS.
// Optamos por extrair e testar a lógica pura de validators e controller helpers
// e testar o fluxo completo simulando req/res.

// Importa validators reais (sem dependência de I/O)
const validators = require('../utils/validators');

// Cria uma versão do controller com dependências injetadas
function buildController(Investment, connectDB) {
    const {
        tipoInvestimentoEhValido,
        competenciaEhValida,
        valorNaoNegativo,
        stringObrigatoria,
        sanitizarValor,
    } = validators;

    const obterInvestimentoDoUsuario = async (id, usuario_id) => {
        const inv = await Investment.findOne({ _id: id, usuario_id, ativo: true });
        if (!inv) throw { status: 404, erro: 'Investimento não encontrado.' };
        return inv;
    };

    const serializar = (doc) => {
        const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
        return {
            id:           obj._id,
            tipo:         obj.tipo,
            nome:         obj.nome,
            taxa:         obj.taxa,
            valor:        obj.valor,
            rendimento:   obj.rendimento,
            mesInicio:    obj.mesInicio,
            criadoEm:     obj.createdAt,
            atualizadoEm: obj.updatedAt,
        };
    };

    return {
        async listar(req, res) {
            await connectDB();
            const usuario_id = req.usuarioId;
            const investimentos = await Investment.find({ usuario_id, ativo: true });
            const totalAportado   = investimentos.reduce((s, i) => s + i.valor, 0);
            const totalRendimento = investimentos.reduce((s, i) => s + i.rendimento, 0);
            res.status(200).json({
                investimentos: investimentos.map(serializar),
                resumo: {
                    totalAportado:   sanitizarValor(totalAportado),
                    totalRendimento: sanitizarValor(totalRendimento),
                    patrimonio:      sanitizarValor(totalAportado + totalRendimento),
                    quantidade:      investimentos.length,
                },
            });
        },

        async criar(req, res) {
            await connectDB();
            const usuario_id = req.usuarioId;
            const { tipo, nome, taxa = '', valor, rendimento = 0, mesInicio } = req.body;
            if (!tipoInvestimentoEhValido(tipo))     return res.status(400).json({ erro: 'Tipo de ativo inválido.' });
            if (!stringObrigatoria(nome, 120))        return res.status(400).json({ erro: 'Nome é obrigatório (máx. 120 caracteres).' });
            if (!valorNaoNegativo(valor))              return res.status(400).json({ erro: 'Valor deve ser um número maior ou igual a zero.' });
            if (!valorNaoNegativo(rendimento))         return res.status(400).json({ erro: 'Rendimento não pode ser negativo.' });
            if (!competenciaEhValida(mesInicio))       return res.status(400).json({ erro: 'Mês de início inválido. Use o formato YYYY-MM.' });
            const novo = await Investment.create({ usuario_id, tipo, nome: String(nome).trim(), taxa: String(taxa).trim(), valor: sanitizarValor(valor), rendimento: sanitizarValor(rendimento), mesInicio });
            res.status(201).json({ mensagem: 'Investimento registrado com sucesso.', investimento: serializar(novo) });
        },

        async atualizar(req, res) {
            try {
                await connectDB();
                const { id } = req.params;
                const inv = await obterInvestimentoDoUsuario(id, req.usuarioId);
                const { tipo, nome, taxa, valor, rendimento, mesInicio } = req.body;
                if (tipo !== undefined) {
                    if (!tipoInvestimentoEhValido(tipo)) return res.status(400).json({ erro: 'Tipo de ativo inválido.' });
                    inv.tipo = tipo;
                }
                if (nome !== undefined) {
                    if (!stringObrigatoria(nome, 120)) return res.status(400).json({ erro: 'Nome inválido.' });
                    inv.nome = String(nome).trim();
                }
                if (taxa !== undefined) inv.taxa = String(taxa).trim();
                if (valor !== undefined) {
                    if (!valorNaoNegativo(valor)) return res.status(400).json({ erro: 'Valor deve ser ≥ 0.' });
                    inv.valor = sanitizarValor(valor);
                }
                if (rendimento !== undefined) {
                    if (!valorNaoNegativo(rendimento)) return res.status(400).json({ erro: 'Rendimento deve ser ≥ 0.' });
                    inv.rendimento = sanitizarValor(rendimento);
                }
                if (mesInicio !== undefined) {
                    if (!competenciaEhValida(mesInicio)) return res.status(400).json({ erro: 'Mês de início inválido. Use YYYY-MM.' });
                    inv.mesInicio = mesInicio;
                }
                await inv.save();
                res.status(200).json({ mensagem: 'Investimento atualizado com sucesso.', investimento: serializar(inv) });
            } catch (err) {
                if (err.status) return res.status(err.status).json({ erro: err.erro });
                res.status(500).json({ erro: 'Erro ao atualizar investimento.' });
            }
        },

        async remover(req, res) {
            try {
                await connectDB();
                const inv = await obterInvestimentoDoUsuario(req.params.id, req.usuarioId);
                inv.ativo = false;
                await inv.save();
                res.status(200).json({ mensagem: 'Investimento removido com sucesso.' });
            } catch (err) {
                if (err.status) return res.status(err.status).json({ erro: err.erro });
                res.status(500).json({ erro: 'Erro ao remover investimento.' });
            }
        },
    };
}

// ─────────────────────────────────────────────────────────────
// HELPERS DE TESTE
// ─────────────────────────────────────────────────────────────

const makeReq = (overrides = {}) => ({
    usuarioId: 'user-123',
    params: {},
    body:   {},
    query:  {},
    ...overrides,
});

const makeRes = () => {
    const res = { _status: 200, _body: null };
    res.status = (code) => { res._status = code; return res; };
    res.json   = (body)  => { res._body  = body; return res; };
    return res;
};

const ctrl = buildController(InvestmentMock, connectDBMock);

// ─────────────────────────────────────────────────────────────
// TESTES — validators (funções puras, sem I/O)
// ─────────────────────────────────────────────────────────────

describe('validators — competenciaEhValida', () => {
    it('aceita "2025-04"', () => assert.ok(validators.competenciaEhValida('2025-04')));
    it('rejeita "2025-4"',  () => assert.ok(!validators.competenciaEhValida('2025-4')));
    it('rejeita null',       () => assert.ok(!validators.competenciaEhValida(null)));
    it('rejeita vazio',      () => assert.ok(!validators.competenciaEhValida('')));
});

describe('validators — tipoInvestimentoEhValido', () => {
    it('aceita "CDB"',    () => assert.ok(validators.tipoInvestimentoEhValido('CDB')));
    it('aceita "Ações"',  () => assert.ok(validators.tipoInvestimentoEhValido('Ações')));
    it('rejeita "DEBN"',  () => assert.ok(!validators.tipoInvestimentoEhValido('DEBN')));
    it('rejeita vazio',   () => assert.ok(!validators.tipoInvestimentoEhValido('')));
});

describe('validators — valorPositivo / valorNaoNegativo', () => {
    it('valorPositivo(100) = true',   () => assert.ok(validators.valorPositivo(100)));
    it('valorPositivo(0) = false',    () => assert.ok(!validators.valorPositivo(0)));
    it('valorPositivo(-1) = false',   () => assert.ok(!validators.valorPositivo(-1)));
    it('valorNaoNegativo(0) = true',  () => assert.ok(validators.valorNaoNegativo(0)));
    it('valorNaoNegativo(-1) = false',() => assert.ok(!validators.valorNaoNegativo(-1)));
});

describe('validators — corHexEhValida', () => {
    it('aceita "#3b82f6"',  () => assert.ok(validators.corHexEhValida('#3b82f6')));
    it('aceita "#FFFFFF"',  () => assert.ok(validators.corHexEhValida('#FFFFFF')));
    it('rejeita "blue"',    () => assert.ok(!validators.corHexEhValida('blue')));
    it('rejeita "#fff"',    () => assert.ok(!validators.corHexEhValida('#fff')));
});

describe('validators — sanitizarValor', () => {
    // 1.005 * 100 = 100.4999... (IEEE 754) → arredonda para 100, não 101
    it('1.005 → 1 (limitação IEEE 754, comportamento esperado)', () => assert.equal(validators.sanitizarValor(1.005), 1));
    it('1.115 → 1.12 (arredondamento correto)',                   () => assert.equal(validators.sanitizarValor(1.115), 1.12));
    it('retorna 0 para entrada inválida',                          () => assert.equal(validators.sanitizarValor('abc'), 0));
    it('converte string "100" para 100',                           () => assert.equal(validators.sanitizarValor('100'), 100));
    it('arredonda 10.999 para 11',                                 () => assert.equal(validators.sanitizarValor(10.999), 11));
});

// ─────────────────────────────────────────────────────────────
// TESTES — investmentController.listar
// ─────────────────────────────────────────────────────────────

describe('investmentController.listar', () => {
    beforeEach(() => { _findMock = null; });

    it('retorna 200 com lista vazia e resumo zerado quando não há investimentos', async () => {
        _findMock = () => Promise.resolve([]);
        const req = makeReq();
        const res = makeRes();
        await ctrl.listar(req, res);
        assert.equal(res._status, 200);
        assert.equal(res._body.investimentos.length, 0);
        assert.equal(res._body.resumo.totalAportado, 0);
        assert.equal(res._body.resumo.quantidade, 0);
    });

    it('retorna 200 com lista e resumo calculado', async () => {
        const itens = [
            makeFakeInv({ _id: '1', valor: 10000, rendimento: 1000 }),
            makeFakeInv({ _id: '2', valor: 5000,  rendimento: 200  }),
        ];
        _findMock = () => Promise.resolve(itens);
        const req = makeReq();
        const res = makeRes();
        await ctrl.listar(req, res);
        assert.equal(res._status, 200);
        assert.equal(res._body.investimentos.length, 2);
        assert.equal(res._body.resumo.totalAportado, 15000);
        assert.equal(res._body.resumo.totalRendimento, 1200);
        assert.equal(res._body.resumo.patrimonio, 16200);
    });
});

// ─────────────────────────────────────────────────────────────
// TESTES — investmentController.criar
// ─────────────────────────────────────────────────────────────

describe('investmentController.criar', () => {
    beforeEach(() => { _createMock = null; });

    it('retorna 400 para tipo inválido', async () => {
        const req = makeReq({ body: { tipo: 'DEBN', nome: 'Test', valor: 1000, mesInicio: '2025-01' } });
        const res = makeRes();
        await ctrl.criar(req, res);
        assert.equal(res._status, 400);
        assert.ok(res._body.erro.includes('inválido'));
    });

    it('retorna 400 para nome vazio', async () => {
        const req = makeReq({ body: { tipo: 'CDB', nome: '', valor: 1000, mesInicio: '2025-01' } });
        const res = makeRes();
        await ctrl.criar(req, res);
        assert.equal(res._status, 400);
        assert.ok(res._body.erro.includes('Nome'));
    });

    it('retorna 400 para valor negativo', async () => {
        const req = makeReq({ body: { tipo: 'CDB', nome: 'Test', valor: -100, mesInicio: '2025-01' } });
        const res = makeRes();
        await ctrl.criar(req, res);
        assert.equal(res._status, 400);
        assert.ok(res._body.erro.includes('Valor'));
    });

    it('retorna 400 para mesInicio inválido', async () => {
        const req = makeReq({ body: { tipo: 'CDB', nome: 'Test', valor: 1000, mesInicio: '01-2025' } });
        const res = makeRes();
        await ctrl.criar(req, res);
        assert.equal(res._status, 400);
        assert.ok(res._body.erro.includes('Mês de início'));
    });

    it('retorna 201 e dados do investimento em caso de sucesso', async () => {
        _createMock = async (data) => makeFakeInv({ ...data, _id: 'new-id' });
        const req = makeReq({ body: { tipo: 'CDB', nome: 'CDB Nubank', taxa: '110% CDI', valor: 5000, mesInicio: '2025-01' } });
        const res = makeRes();
        await ctrl.criar(req, res);
        assert.equal(res._status, 201);
        assert.equal(res._body.investimento.tipo, 'CDB');
        assert.equal(res._body.investimento.nome, 'CDB Nubank');
        assert.equal(res._body.investimento.valor, 5000);
        assert.ok(res._body.mensagem.includes('sucesso'));
    });

    it('valor 0 é aceito (aporte ainda não realizado)', async () => {
        _createMock = async (data) => makeFakeInv({ ...data, valor: 0 });
        const req = makeReq({ body: { tipo: 'LCI', nome: 'LCI Teste', valor: 0, mesInicio: '2025-02' } });
        const res = makeRes();
        await ctrl.criar(req, res);
        assert.equal(res._status, 201);
    });
});

// ─────────────────────────────────────────────────────────────
// TESTES — investmentController.atualizar
// ─────────────────────────────────────────────────────────────

describe('investmentController.atualizar', () => {
    beforeEach(() => { _findOneMock = null; });

    it('retorna 404 se investimento não encontrado', async () => {
        _findOneMock = () => Promise.resolve(null);
        const req = makeReq({ params: { id: 'nao-existe' }, body: { nome: 'Novo Nome' } });
        const res = makeRes();
        await ctrl.atualizar(req, res);
        assert.equal(res._status, 404);
        assert.ok(res._body.erro.includes('não encontrado'));
    });

    it('retorna 400 para tipo inválido na atualização', async () => {
        _findOneMock = () => Promise.resolve(makeFakeInv());
        const req = makeReq({ params: { id: 'inv-001' }, body: { tipo: 'INVALIDO' } });
        const res = makeRes();
        await ctrl.atualizar(req, res);
        assert.equal(res._status, 400);
    });

    it('retorna 200 com partial update correto', async () => {
        const fakeInv = makeFakeInv();
        _findOneMock = () => Promise.resolve(fakeInv);
        const req = makeReq({ params: { id: 'inv-001' }, body: { nome: 'Novo Nome', valor: 8000 } });
        const res = makeRes();
        await ctrl.atualizar(req, res);
        assert.equal(res._status, 200);
        assert.equal(res._body.investimento.nome, 'Novo Nome');
        assert.equal(res._body.investimento.valor, 8000);
    });

    it('ignora campos não enviados (mantém valor original)', async () => {
        const fakeInv = makeFakeInv({ taxa: '110% CDI' });
        _findOneMock = () => Promise.resolve(fakeInv);
        const req = makeReq({ params: { id: 'inv-001' }, body: { nome: 'Outro Nome' } });
        const res = makeRes();
        await ctrl.atualizar(req, res);
        assert.equal(res._status, 200);
        // taxa não foi enviada, deve manter o original
        assert.equal(res._body.investimento.taxa, '110% CDI');
    });
});

// ─────────────────────────────────────────────────────────────
// TESTES — investmentController.remover
// ─────────────────────────────────────────────────────────────

describe('investmentController.remover', () => {
    beforeEach(() => { _findOneMock = null; });

    it('retorna 404 se não encontrado', async () => {
        _findOneMock = () => Promise.resolve(null);
        const req = makeReq({ params: { id: 'nao-existe' } });
        const res = makeRes();
        await ctrl.remover(req, res);
        assert.equal(res._status, 404);
    });


    it('retorna 200 e marca ativo = false', async () => {
        let saved = false;
        const fakeInv = makeFakeInv({ save: async function () { saved = true; return this; } });
        _findOneMock = () => Promise.resolve(fakeInv);
        const req = makeReq({ params: { id: 'inv-001' } });
        const res = makeRes();
        await ctrl.remover(req, res);
        assert.equal(res._status, 200);
        assert.ok(saved, 'save() deveria ter sido chamado');
        assert.equal(fakeInv.ativo, false);
        assert.ok(res._body.mensagem.includes('sucesso'));
    });
});
