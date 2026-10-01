import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const drivers = JSON.parse(
  await fs.readFile(new URL('./drivers.config.json', import.meta.url), 'utf8'),
);

// CI의 Node 버전을 Electron의 Node 버전과 맞춰두므로 그대로 타깃으로 사용
const target = `node${process.versions.node.split('.')[0]}`;

await fs.rm('dist', { recursive: true, force: true });
await fs.mkdir('dist', { recursive: true });

const results = [];

for (const d of drivers) {
  const version = require(`${d.package}/package.json`).version;

  const out = await build({
    entryPoints: [require.resolve(d.entry)],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target,
    minify: true,
    external: d.external,
    write: false,
    logLevel: 'warning',
  });

  const contents = Buffer.from(out.outputFiles[0].contents);
  const sha256 = createHash('sha256').update(contents).digest('hex');
  const file = `${d.id}-${version}-${sha256.slice(0, 12)}.js`;

  await fs.writeFile(`dist/${file}`, contents);

  results.push({ id: d.id, package: d.package, version, file, sha256, size: contents.length });
  console.log(`built ${file} (${(contents.length / 1024).toFixed(1)} KB)`);
}

await fs.writeFile('dist/build-result.json', JSON.stringify(results, null, 2));
