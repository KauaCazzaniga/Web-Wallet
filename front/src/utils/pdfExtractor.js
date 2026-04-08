import * as pdfjsLib from 'pdfjs-dist/build/pdf';

const PDF_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_CDN;

const montarTextoDaPagina = (items = []) => {
  let texto = '';
  let ultimoY = null;

  items.forEach((item) => {
    const fragmento = String(item?.str || '').trim();
    if (!fragmento) return;

    const y = item?.transform?.[5];
    const mudouLinha = ultimoY !== null && typeof y === 'number' && Math.abs(y - ultimoY) > 2;

    if (texto && (mudouLinha || item?.hasEOL)) {
      texto += '\n';
    } else if (texto && !texto.endsWith('\n')) {
      texto += ' ';
    }

    texto += fragmento;
    ultimoY = y;

    if (item?.hasEOL) {
      texto += '\n';
    }
  });

  return texto.trim();
};

export const extractTextFromPdf = async (file) => {
  try {
    const data = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    const paginas = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      paginas.push(montarTextoDaPagina(content.items));
    }

    const texto = paginas.filter(Boolean).join('\n\n').trim();

    if (!texto) {
      throw new Error('Não foi possível ler este arquivo. Tente um extrato em formato texto.');
    }

    return texto;
  } catch (error) {
    throw new Error('Não foi possível ler este arquivo. Tente um extrato em formato texto.');
  }
};
