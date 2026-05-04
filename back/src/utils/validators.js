// Módulo: validators
// Responsabilidade: Funções puras de validação de entrada, reutilizadas por controllers e testes.
//   Centralizar aqui evita duplicação e facilita manutenção das regras de negócio.
// Depende de: (nada — sem efeitos colaterais)

'use strict';

const { TIPOS_VALIDOS } = require('../models/Investment');

/**
 * Valida se uma string está no formato "YYYY-MM".
 * @param {*} valor
 * @returns {boolean}
 */
const competenciaEhValida = (valor) => /^\d{4}-\d{2}$/.test(String(valor ?? ''));

/**
 * Valida se o tipo de ativo está na lista permitida.
 * @param {*} tipo
 * @returns {boolean}
 */
const tipoInvestimentoEhValido = (tipo) => TIPOS_VALIDOS.includes(tipo);

/**
 * Valida se o valor é um número finito maior que zero.
 * @param {*} valor
 * @returns {boolean}
 */
const valorPositivo = (valor) => {
    const n = Number(valor);
    return Number.isFinite(n) && n > 0;
};

/**
 * Valida se o valor é um número finito maior ou igual a zero.
 * @param {*} valor
 * @returns {boolean}
 */
const valorNaoNegativo = (valor) => {
    const n = Number(valor);
    return Number.isFinite(n) && n >= 0;
};

/**
 * Valida cor hexadecimal no formato #rrggbb.
 * @param {*} cor
 * @returns {boolean}
 */
const corHexEhValida = (cor) => /^#[0-9a-fA-F]{6}$/.test(String(cor ?? ''));

/**
 * Valida se um prazo é nulo/vazio ou está no formato "YYYY-MM".
 * @param {*} prazo
 * @returns {boolean}
 */
const prazoEhValido = (prazo) => !prazo || /^\d{4}-\d{2}$/.test(String(prazo));

/**
 * Valida se uma string não está vazia após trim.
 * @param {*} valor
 * @param {number} [max=120]
 * @returns {boolean}
 */
const stringObrigatoria = (valor, max = 120) => {
    const s = String(valor ?? '').trim();
    return s.length > 0 && s.length <= max;
};

/**
 * Sanitiza e converte `valor` para Number arredondado a 2 casas decimais.
 * Retorna 0 para entradas inválidas.
 * @param {*} valor
 * @returns {number}
 */
const sanitizarValor = (valor) => {
    const n = Number(valor);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100) / 100;
};

module.exports = {
    competenciaEhValida,
    tipoInvestimentoEhValido,
    valorPositivo,
    valorNaoNegativo,
    corHexEhValida,
    prazoEhValido,
    stringObrigatoria,
    sanitizarValor,
};
