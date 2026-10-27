import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../../', import.meta.url));
export function loadUiModule(relative) {
  const file = path.resolve(root, relative);
  const source = readFileSync(file, 'utf8');
  const exports = {};
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, Date, Intl, console, require(name) {
    if (name.endsWith('.css')) return {};
    if (name === 'next/image') return { __esModule: true, default: ({ src, alt }) => require('react').createElement('img', { src, alt }) };
    if (name.startsWith('.') || name.startsWith('@/')) {
      const resolved = name.startsWith('@/') ? path.resolve(root, name.slice(2)) : path.resolve(path.dirname(file), name);
      const target = [resolved + '.tsx', resolved + '.ts', resolved].find(existsSync);
      if (!target) throw new Error('Unknown UI dependency: ' + name);
      return loadUiModule(path.relative(root, target));
    }
    return require(name);
  } });
  return exports;
}
