import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const [results, dashboardFile] = process.argv.slice(2);
assert(results && dashboardFile && process.env.RUNNER_TEMP);
const dashboard = JSON.parse(await readFile(dashboardFile, 'utf8'));
const grafanaReadyExpression = `(() => {
  let painted = 0;
  for (const canvas of document.querySelectorAll('canvas')) {
    if (canvas.width < 40 || canvas.height < 40) continue;
    const context = canvas.getContext('2d');
    if (!context) continue;
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const colors = new Set();
    const stride = Math.max(4, Math.floor(data.length / 16384) * 4);
    for (let i = 0; i < data.length; i += stride) {
      if (data[i + 3]) colors.add(data[i] + ',' + data[i + 1] + ',' + data[i + 2]);
      if (colors.size > 8) { painted++; break; }
    }
  }
  return painted >= EXPECTED_PLOTS && !document.body.innerText.includes('Loading dashboard')
    && !document.body.innerText.includes('No data');
})()`;
const profile = await mkdtemp(path.join(process.env.RUNNER_TEMP, 'cloud-chrome-'));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const browser = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
  '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
let browserError;
browser.on('error', error => { browserError = error; });
let ws;
try {
  let port;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (browserError) throw browserError;
    try { port = Number((await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); break; }
    catch { await sleep(100); }
  }
  assert(Number.isInteger(port) && port > 0 && port < 65536, 'Chrome CDP did not start');
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(5000) })).json();
  ws = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', ({ data }) => {
    const reply = JSON.parse(data);
    const waiter = pending.get(reply.id);
    if (!waiter) return;
    pending.delete(reply.id);
    clearTimeout(waiter.timer);
    if (reply.error) waiter.reject(new Error(reply.error.message)); else waiter.resolve(reply.result);
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const request = ++id;
    const timer = setTimeout(() => { pending.delete(request); reject(new Error(`CDP timeout: ${method}`)); }, 30000);
    pending.set(request, { resolve, reject, timer });
    ws.send(JSON.stringify({ id: request, method, params }));
  });
  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1600, height: 3000, deviceScaleFactor: 1, mobile: false });
  const cases = [
    ['mkdocs', 'http://127.0.0.1:30080/docs/', `!!document.querySelector('[role="main"] h1')`],
    ['swagger', 'http://127.0.0.1:30080/docs/swagger.html', "document.querySelectorAll('.swagger-ui .opblock').length > 0"],
    ['grafana', `http://127.0.0.1:3100/d/${dashboard.uid}?orgId=1&from=now-30m&to=now&kiosk`, grafanaReadyExpression.replace('EXPECTED_PLOTS', dashboard.panels.filter(panel => panel.type === 'timeseries').length)],
  ];
  for (const [name, url, expression] of cases) {
    await cdp('Page.navigate', { url });
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      const state = await cdp('Runtime.evaluate', { expression, returnByValue: true });
      if (state.result?.value === true) { ready = true; break; }
      await sleep(1000);
    }
    assert(ready, `${name} did not render`);
    await sleep(3000);
    const image = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    const png = Buffer.from(image.data, 'base64');
    assert(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
    await writeFile(path.join(results, name + '.png'), png);
    console.log('BROWSER_RENDER_VERIFIED', name);
  }
} finally {
  ws?.close();
  browser.kill('SIGTERM');
  for (let attempt = 0; attempt < 30 && browser.exitCode === null && browser.signalCode === null; attempt++) await sleep(100);
  if (browser.exitCode === null && browser.signalCode === null) browser.kill('SIGKILL');
  await rm(profile, { recursive: true, force: true });
}
