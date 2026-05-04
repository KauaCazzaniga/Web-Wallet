// Middleware: validate
// Responsabilidade: valida req.body com um schema Joi antes de chegar ao controller
const Joi = require('joi');

/**
 * Retorna um middleware Express que valida req.body contra o schema Joi fornecido.
 * Erros de validação resultam em 400 com a mensagem do primeiro erro.
 * @param {Joi.Schema} schema
 */
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: true, allowUnknown: false });
    if (error) {
        return res.status(400).json({ erro: error.details[0].message });
    }
    next();
};

// ── Schemas ───────────────────────────────────────────────────────────────────

const CATEGORIAS_VALIDAS = [
    'Alimentação', 'Transporte', 'Lazer', 'Saúde',
    'Salário', 'Investimentos', 'Outros',
    'gastos_fixos.aluguel', 'gastos_fixos.energia', 'gastos_fixos.agua',
    'gastos_fixos.internet', 'gastos_fixos.celular', 'gastos_fixos.gas',
    'gastos_fixos.streaming', 'gastos_fixos.cartaoCredito',
    'gastos_fixos.assinaturasIA', 'gastos_fixos.planoSaude',
    'gastos_fixos.seguroCarro', 'gastos_fixos.condominio',
];

const transacaoSchema = Joi.object({
    competencia: Joi.string().pattern(/^\d{4}-\d{2}$/).required().messages({
        'string.pattern.base': 'competencia deve estar no formato YYYY-MM.',
        'any.required': 'competencia é obrigatória.',
    }),
    tipo: Joi.string().valid('receita', 'despesa').required().messages({
        'any.only': 'tipo deve ser "receita" ou "despesa".',
        'any.required': 'tipo é obrigatório.',
    }),
    categoria: Joi.string().valid(...CATEGORIAS_VALIDAS).required().messages({
        'any.only': 'categoria inválida.',
        'any.required': 'categoria é obrigatória.',
    }),
    valor: Joi.number().positive().required().messages({
        'number.positive': 'valor deve ser positivo.',
        'any.required': 'valor é obrigatório.',
    }),
    descricao: Joi.string().min(1).max(200).required().messages({
        'string.min': 'descricao não pode estar vazia.',
        'string.max': 'descricao não pode ter mais de 200 caracteres.',
        'any.required': 'descricao é obrigatória.',
    }),
    tags: Joi.array().items(Joi.string().max(50)).max(10).default([]),
    data_hora: Joi.string().isoDate().allow('', null).optional(),
    importadoViaPdf: Joi.boolean().optional(),
});

const iniciarMesSchema = Joi.object({
    competencia: Joi.string().pattern(/^\d{4}-\d{2}$/).required().messages({
        'string.pattern.base': 'competencia deve estar no formato YYYY-MM.',
        'any.required': 'competencia é obrigatória.',
    }),
});

const importacaoItemSchema = Joi.object({
    competencia: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
    tipo: Joi.string().valid('receita', 'despesa').required(),
    categoria: Joi.string().valid(...CATEGORIAS_VALIDAS).required(),
    valor: Joi.number().positive().required(),
    descricao: Joi.string().min(1).max(200).required(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).default([]),
    data_hora: Joi.string().isoDate().allow('', null).optional(),
});

const importacaoSchema = Joi.object({
    transacoes: Joi.array().items(importacaoItemSchema).min(1).max(200).required().messages({
        'array.min': 'Informe ao menos uma transação.',
        'array.max': 'Máximo de 200 transações por importação.',
        'any.required': 'transacoes é obrigatório.',
    }),
});

const limiteValorSchema = Joi.number().min(0).required();
const definirLimitesSchema = Joi.object({
    limites: Joi.object().pattern(Joi.string(), limiteValorSchema).required().messages({
        'any.required': 'limites é obrigatório.',
    }),
});

module.exports = {
    validate,
    schemas: {
        transacao: transacaoSchema,
        iniciarMes: iniciarMesSchema,
        importacao: importacaoSchema,
        definirLimites: definirLimitesSchema,
    },
};
