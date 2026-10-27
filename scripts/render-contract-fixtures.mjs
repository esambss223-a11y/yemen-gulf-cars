import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadUiModule } from './lib/load-ui-module.mjs';
import { contractFixture } from './lib/contract-print-fixture.mjs';

const output = resolve(process.argv[2] || '.private/contract-print-qa');
await mkdir(output, { recursive: true });
const Document = loadUiModule('components/admin/contracts/RentalContractDocument.tsx').default;
const dashboardCss = await readFile('app/admin/admin.css', 'utf8');
const printCss = await readFile('components/admin/contracts/contract-print.css', 'utf8');
const logo = (await readFile('public/logoexe.png')).toString('base64');
let fontStyles = '';
// Use the same locally bundled Cairo faces as the site, including Arabic glyphs.
for (const file of await readdir('.next/static/chunks')) {
  if (!file.endsWith('.css')) continue;
  const css = await readFile('.next/static/chunks/' + file, 'utf8');
  for (const face of css.match(/@font-face\{[^}]+\}/g) || []) {
    if (!face.includes('font-family:Cairo;')) continue;
    const fontFile = face.match(/url\(\.\.\/media\/([^)]*)\)/)?.[1];
    if (!fontFile) continue;
    const fontData = (await readFile('.next/static/media/' + fontFile)).toString('base64');
    fontStyles += face.replace(/url\([^)]*\)/, 'url(data:font/woff2;base64,' + fontData + ')');
  }
}
for (const [name, booking] of [
  ['contract-a4', contractFixture],
  ['contract-a4-long', { ...contractFixture, customer: { ...contractFixture.customer, fullName: 'عميل تجريبي باسم طويل للتأكد من التفاف النص ووضوح بيانات الطرف الثاني', nationalId: 'LONG-PASSPORT-ID-' + '1234567890'.repeat(6) }, notes: Array.from({ length: 80 }, (_, i) => `ملاحظة اختبار رقم ${i + 1}: يجب ظهور النص كاملًا دون قص أو تداخل عند الانتقال بين الصفحات.`).join('\n') + '\nEND-OF-LONG-NOTES' }],
]) {
  const markup = renderToStaticMarkup(createElement(Document, { booking })).replaceAll('/logoexe.png', 'data:image/png;base64,' + logo);
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>Contract print QA</title><style>${fontStyles}body{font-family:Cairo,Tahoma,Arial,sans-serif;}@media print{header,footer,aside{display:none;}thead{display:table-row-group!important;}}</style><style>${dashboardCss}</style><style>${printCss}</style></head><body><div class="admin-ui admin-shell"><h1>SHOULD-NOT-PRINT-DASHBOARD</h1><p>CONTROL-PANEL-NOISE</p></div><div class="fleet-contract-native-print">${markup}</div></body></html>`;
  await writeFile(resolve(output, name + '.html'), html);
}
console.log('Created two isolated contract print fixtures with fake records only.');
