/**
 * Convierte PDFs a .md extrayendo texto plano (sin IA, costo cero).
 * Uso: node pdf-to-md.js <carpeta_pdfs> [carpeta_salida]
 * Si no se da carpeta_salida, crea ./md-output dentro de la carpeta de PDFs.
 */
const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

async function convert(pdfPath, outDir) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;

  const parts = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(' ');
    if (text.trim()) parts.push(text.trim());
  }
  doc.destroy();

  const name = path.basename(pdfPath, path.extname(pdfPath));
  const outPath = path.join(outDir, `${name}.md`);
  const md = `# ${name}\n\n${parts.join('\n\n---\n\n')}`;
  fs.writeFileSync(outPath, md, 'utf-8');

  return { outPath, chars: md.length, pages: doc.numPages };
}

async function main() {
  const src = process.argv[2];
  if (!src) {
    console.log('Uso: node pdf-to-md.js <carpeta_pdfs> [carpeta_salida]');
    process.exit(1);
  }

  const out = process.argv[3] || path.join(src, 'md-output');
  fs.mkdirSync(out, { recursive: true });

  const pdfs = fs.readdirSync(src).filter(f => /\.pdf$/i.test(f) && !f.startsWith('.'));
  if (!pdfs.length) {
    console.log(`No hay PDFs en ${src}`);
    process.exit(0);
  }

  console.log(`Convirtiendo ${pdfs.length} PDFs...\n`);
  let ok = 0, fail = 0;
  for (const f of pdfs) {
    try {
      const { outPath, chars, pages } = await convert(path.join(src, f), out);
      console.log(`  OK  ${f} -> ${path.basename(outPath)} (${pages} pags, ${chars.toLocaleString()} chars)`);
      ok++;
    } catch (err) {
      console.log(`  ERR ${f} -> ${err.message}`);
      fail++;
    }
  }

  console.log(`\n${ok} convertidos, ${fail} fallaron.`);
  console.log(`Archivos .md en: ${out}`);
}

main().catch(err => { console.error(err); process.exit(1); });
