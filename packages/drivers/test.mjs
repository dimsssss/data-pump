import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const results = JSON.parse(await fs.readFile('dist/build-result.json', 'utf8'));
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'driver-smoke-'));

const tests = {
  async mysql(driver) {
    const cases = [
      { name: 'plain', ssl: undefined },
      { name: 'tls', ssl: { rejectUnauthorized: false } }, // CI MySQL은 자체 서명 인증서
    ];

    for (const c of cases) {
      const conn = driver
        .createConnection({
          host: '127.0.0.1',
          port: 3306,
          user: 'root',
          password: process.env.MYSQL_PASSWORD,
          ssl: c.ssl,
        })
        .promise();

      const [rows] = await conn.query('SELECT 1 AS ok, VERSION() AS v');
      if (rows[0].ok !== 1) throw new Error('unexpected query result');

      const [[status]] = await conn.query("SHOW SESSION STATUS LIKE 'Ssl_cipher'");
      const cipher = status?.Value || '';
      if (c.ssl && !cipher) throw new Error('TLS was not negotiated');

      console.log(`  mysql ${c.name}: server=${rows[0].v} cipher=${cipher || '(none)'}`);
      await conn.end();
    }
  },
};

for (const r of results) {
  const test = tests[r.id];
  if (!test) throw new Error(`no smoke test defined for "${r.id}"`);

  const isolated = path.join(tmp, r.file);
  await fs.copyFile(path.join('dist', r.file), isolated);

  const driver = createRequire(isolated)(isolated);
  await test(driver);
  console.log(`✓ ${r.id} ${r.version}`);
}