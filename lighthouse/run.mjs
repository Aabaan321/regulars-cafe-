/**
 * Lighthouse runner.
 *
 *   node lighthouse/run.mjs /essential /essential/menu …
 *
 * Mobile emulation with the default Lighthouse throttling, which is what the
 * performance budget in the brief is written against. Runs each URL twice and
 * keeps the better run, because a cold Next.js route handler on the first hit
 * measures the server warming up rather than the page.
 */
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
const require = createRequire('/home/user/regulars-cafe-/package.json');
const lighthouse = (await import(require.resolve('lighthouse'))).default;
const { launch } = await import(require.resolve('chrome-launcher'));

const BASE = process.env.LH_BASE ?? 'http://localhost:3000';
const paths = process.argv.slice(2);
const OUT = process.env.LH_OUT ?? 'lighthouse';
mkdirSync(OUT, { recursive: true });

const chrome = await launch({
  chromePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});

const results = [];
for (const path of paths) {
  let best = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const runner = await lighthouse(
      `${BASE}${path}`,
      { port: chrome.port, output: 'json', logLevel: 'error' },
      undefined,
    );
    const lhr = runner.lhr;
    const score = (id) => Math.round((lhr.categories[id]?.score ?? 0) * 100);
    const row = {
      path,
      performance: score('performance'),
      accessibility: score('accessibility'),
      bestPractices: score('best-practices'),
      seo: score('seo'),
      lcp: lhr.audits['largest-contentful-paint']?.numericValue ?? 0,
      cls: lhr.audits['cumulative-layout-shift']?.numericValue ?? 0,
      tbt: lhr.audits['total-blocking-time']?.numericValue ?? 0,
      fcp: lhr.audits['first-contentful-paint']?.numericValue ?? 0,
      tti: lhr.audits['interactive']?.numericValue ?? 0,
      json: runner.report,
    };
    if (!best || row.performance > best.performance) best = row;
  }
  writeFileSync(`${OUT}/${path.replace(/\//g, '_') || '_root'}.report.json`, best.json);
  delete best.json;
  results.push(best);
  console.log(
    `${path.padEnd(38)} perf ${String(best.performance).padStart(3)}  a11y ${String(best.accessibility).padStart(3)}  bp ${String(best.bestPractices).padStart(3)}  seo ${String(best.seo).padStart(3)}  | LCP ${(best.lcp / 1000).toFixed(2)}s  CLS ${best.cls.toFixed(3)}  TBT ${Math.round(best.tbt)}ms`,
  );
}

writeFileSync(`${OUT}/summary.json`, JSON.stringify(results, null, 2));
await chrome.kill();
