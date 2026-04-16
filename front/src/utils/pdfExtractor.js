import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

const PDF_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const LINE_Y_TOLERANCE = 2.5;
const PAGE_BATCH_SIZE = 3;

pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_CDN;

const normalizarFragmento = (item) => ({
  texto: String(item?.str || '').trim(),
  x: Number(item?.transform?.[4] || 0),
  y: Number(item?.transform?.[5] || 0),
});

const agruparItensPorLinha = (items = []) => {
  const normalizados = items
    .map(normalizarFragmento)
    .filter((item) => item.texto)
    .sort((a, b) => {
      if (Math.abs(a.y - b.y) > LINE_Y_TOLERANCE) {
        return b.y - a.y;
      }

      return a.x - b.x;
    });

  return normalizados.reduce((linhas, item) => {
    const ultimaLinha = linhas[linhas.length - 1];

    if (!ultimaLinha || Math.abs(ultimaLinha.y - item.y) > LINE_Y_TOLERANCE) {
      linhas.push({ y: item.y, itens: [item] });
      return linhas;
    }

    ultimaLinha.itens.push(item);
    return linhas;
  }, []);
};

const montarTextoDaLinha = (itens = []) =>
  itens
    .sort((a, b) => a.x - b.x)
    .map((item) => item.texto)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

const montarTextoDaPagina = (items = []) =>
  agruparItensPorLinha(items)
    .map((linha) => montarTextoDaLinha(linha.itens))
    .filter(Boolean)
    .join('\n')
    .trim();

const extrairPagina = async (pdf, pageNumber) => {
  const page = await pdf.getPage(pageNumber);
  const content = await page.getTextContent({ normalizeWhitespace: true });
  return montarTextoDaPagina(content.items);
};

const extrairPaginas = async (pdf) => {
  const paginas = [];

  for (let inicio = 1; inicio <= pdf.numPages; inicio += PAGE_BATCH_SIZE) {
    const numeros = Array.from(
      { length: Math.min(PAGE_BATCH_SIZE, pdf.numPages - inicio + 1) },
      (_, index) => inicio + index,
    );

    const textos = await Promise.all(numeros.map((numero) => extrairPagina(pdf, numero)));
    paginas.push(...textos);
  }

  return paginas;
};

export const extractTextFromPdf = async (file) => {
  try {
    const data = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    const paginas = await extrairPaginas(pdf);

    const texto = paginas.filter(Boolean).join('\n\n').trim();

    if (!texto) {
      throw new Error('Nao foi possivel ler este arquivo. Tente um extrato em formato texto.');
    }

    return texto;
  } catch (error) {
    console.error('[extractTextFromPdf]', error);
    throw new Error('Nao foi possivel ler este arquivo. Tente um extrato em formato texto.');
  }
};
