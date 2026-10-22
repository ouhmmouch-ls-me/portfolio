// Dependency-free integration checks against a running Chrome DevTools endpoint.
// Start the static server on :4173 and headless Chrome on :9223 before running.
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4173';
const debug = process.env.CHROME_DEBUG_URL || 'http://127.0.0.1:9223';
const targets = await fetch(`${debug}/json/list`).then(r => r.json());
const target = targets.find(item => item.type === 'page');
assert(target, 'Chrome must have an open page');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let requestId = 0;
const requests = new Map();
const errors = [];
const failures = [];
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) failures.push(`${message.params.response.status} ${message.params.response.url}`);
  if (!message.id) return;
  const request = requests.get(message.id);
  if (!request) return;
  requests.delete(message.id);
  clearTimeout(request.timer);
  if (message.error) request.reject(new Error(JSON.stringify(message.error))); else request.resolve(message.result);
});
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    const timer = setTimeout(() => { requests.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
    requests.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function navigate(url) {
  await send('Page.navigate', { url });
  for (let i = 0; i < 50; i++) {
    await delay(70);
    if (await evaluate('document.readyState === "complete"')) break;
  }
  await delay(150);
}
async function click(selector) {
  assert(await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`), `Element exists: ${selector}`);
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
}
async function key(key, code, extra = {}) {
  const keyCode = { Escape: 27, Enter: 13, ArrowDown: 40, ArrowUp: 38, Home: 36, End: 35, KeyK: 75 }[code];
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, windowsVirtualKeyCode: keyCode, ...extra });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode, ...extra });
}
let passes = 0;
async function check(name, run) { await run(); passes++; console.log(`PASS ${name}`); }
await mkdir('.preview', { recursive: true });

try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(base);
  await check('Site and CV are served successfully', async () => {
    assert.match(await evaluate('document.title'), /Mohamed Ouhmmouch/);
    assert.match(await evaluate('document.querySelector("h1").textContent'), /Mohamed.*Ouhmmouch/);
    for (const path of ['/', '/styles.css', '/app.js', '/signal-lab.js', '/assets/favicon.svg', '/assets/CV_Mohamed_Ouhmmouch_EN.pdf']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200, path);
      if (path.endsWith('.pdf')) assert.equal(response.headers.get('content-type'), 'application/pdf');
    }
  });
  await check('Project filters show only matching work and restore all four projects', async () => {
    for (const [filter, count] of [['firmware', 2], ['validation', 1], ['research', 1], ['all', 4]]) {
      await click(`.project-filters [data-filter="${filter}"]`);
      assert.equal(await evaluate('document.querySelectorAll("#work-collection article:not([hidden])").length'), count);
      assert.match(await evaluate('document.querySelector("#work-count").textContent'), new RegExp(String(count)));
      assert.equal(await evaluate('document.querySelectorAll(".project-filters [aria-pressed=true]").length'), 1);
    }
  });
  await check('System explorer changes content and pressed state', async () => {
    await click('[data-node="meter"]');
    assert.match(await evaluate('document.querySelector("#node-copy").textContent'), /STPM34/);
    assert.equal(await evaluate('document.querySelectorAll(".board-node[aria-pressed=true]").length'), 1);
    await click('[data-node="network"]');
    assert.match(await evaluate('document.querySelector("#node-copy").textContent'), /UDP/);
    await click('[data-node="core"]');
  });
  await check('All project dialogs have grounded details and restore scrolling', async () => {
    for (const project of ['qometer', 'metering', 'testing', 'mimo']) {
      await click(`[data-project="${project}"]`);
      assert(await evaluate('document.querySelector("#project-dialog").open'));
      assert(await evaluate('document.body.classList.contains("modal-open")'));
      assert.equal(await evaluate('document.querySelectorAll("#dialog-contributions li").length'), 3);
      assert.equal(await evaluate('document.querySelectorAll("#dialog-flow > div").length'), 3);
      if (project === 'metering') assert.match(await evaluate('document.querySelector("#dialog-intro").textContent'), /apprenticeship/);
      await key('Escape', 'Escape');
      await delay(50);
      assert.equal(await evaluate('document.querySelector("#project-dialog").open'), false);
      assert.equal(await evaluate('document.body.classList.contains("modal-open")'), false);
    }
  });
  await check('Phase controls change current, align it at zero degrees, and toggle the reference', async () => {
    await click('[data-signal="current"]');
    const original = await evaluate('document.querySelector("#wave-path").getAttribute("d")');
    await evaluate('document.querySelector("#phase-control").value="60";document.querySelector("#phase-control").dispatchEvent(new Event("input"))');
    assert.notEqual(await evaluate('document.querySelector("#wave-path").getAttribute("d")'), original);
    assert.equal(await evaluate('document.querySelector("#phase-value").textContent'), '60°');
    assert.match(await evaluate('document.querySelector("#signal-explanation").textContent'), /60°/);
    assert.equal(await evaluate('document.querySelector("#reference-wave").hasAttribute("hidden")'), false);
    await click('#show-reference');
    assert.equal(await evaluate('document.querySelector("#reference-wave").hasAttribute("hidden")'), true);
    await click('#show-reference');
    await evaluate('document.querySelector("#phase-control").value="0";document.querySelector("#phase-control").dispatchEvent(new Event("input"))');
    assert.equal(await evaluate('document.querySelector("#wave-path").getAttribute("d") === document.querySelector("#reference-wave").getAttribute("d")'), true);
    await evaluate('document.querySelector("#phase-control").value="37";document.querySelector("#phase-control").dispatchEvent(new Event("input"))');
    await click('[data-signal="voltage"]');
  });
  await check('Skill tabs support mouse and keyboard navigation', async () => {
    await click('[data-skill="protocols"]');
    assert.match(await evaluate('document.querySelector(".skill-chips").textContent'), /Modbus/);
    assert.equal(await evaluate('document.querySelector("#skill-panel").getAttribute("aria-labelledby")'), 'tab-protocols');
    await evaluate('document.querySelector("#tab-protocols").focus()');
    await key('ArrowDown', 'ArrowDown');
    assert.equal(await evaluate('document.activeElement.id'), 'tab-tools');
    assert.match(await evaluate('document.querySelector(".skill-chips").textContent'), /GDB/);
    await key('End', 'End');
    assert.equal(await evaluate('document.activeElement.id'), 'tab-performance');
    await key('Home', 'Home');
    assert.equal(await evaluate('document.activeElement.id'), 'tab-firmware');
  });
  await check('Signal selector changes waveform and pause freezes animation', async () => {
    await evaluate('document.querySelector(".signal-chart").scrollIntoView({block:"center",behavior:"instant"})');
    await delay(150);
    await click('#signal-pause');
    const original = await evaluate('document.querySelector("#wave-path").getAttribute("d")');
    await click('[data-signal="current"]');
    const current = await evaluate('document.querySelector("#wave-path").getAttribute("d")');
    assert.notEqual(original, current);
    await click('[data-signal="power"]');
    assert.match(await evaluate('document.querySelector("#wave-title").textContent'), /power/);
    const frozen = await evaluate('document.querySelector("#wave-path").getAttribute("d")');
    await delay(150);
    assert.equal(await evaluate('document.querySelector("#wave-path").getAttribute("d")'), frozen);
    await click('[data-signal="voltage"]');
  });
  await check('Quick navigation searches, announces selection, and performs action', async () => {
    await click('[data-open-command]');
    assert(await evaluate('document.querySelector("#command-dialog").open'));
    assert.equal(await evaluate('document.activeElement.id'), 'command-search');
    await key('ArrowDown', 'ArrowDown');
    assert.equal(await evaluate('document.querySelector("#command-search").getAttribute("aria-activedescendant")'), 'command-option-1');
    assert.equal(await evaluate('document.querySelectorAll("#command-options [aria-selected=true]").length'), 1);
    await evaluate('document.querySelector("#command-search").value="contact"; document.querySelector("#command-search").dispatchEvent(new Event("input"))');
    assert.equal(await evaluate('document.querySelectorAll("#command-options button").length'), 1);
    await key('Enter', 'Enter');
    assert.equal(await evaluate('location.hash'), '#contact');
    assert.equal(await evaluate('document.querySelector("#command-dialog").open'), false);
    await key('k', 'KeyK', { modifiers: 4 });
    assert(await evaluate('document.querySelector("#command-dialog").open'));
    await evaluate('document.querySelector("#command-search").value="zzzzzz"; document.querySelector("#command-search").dispatchEvent(new Event("input"))');
    assert.match(await evaluate('document.querySelector(".command-list").textContent'), /No matches/);
    await key('Escape', 'Escape');
  });
  await check('Email copy gives visible feedback', async () => {
    await click('#copy-email');
    await delay(200);
    assert.match(await evaluate('document.querySelector(".toast").textContent'), /Email address copied|Copy this address/);
  });
  await check('Theme choice persists after reload and dark contact focus is visible', async () => {
    await click('.theme-toggle');
    assert.equal(await evaluate('document.documentElement.dataset.theme'), 'dark');
    await navigate(base);
    assert.equal(await evaluate('document.documentElement.dataset.theme'), 'dark');
    assert.equal(await evaluate('getComputedStyle(document.querySelector("#copy-email")).outlineColor'), 'rgb(29, 41, 35)');
    await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }).then(r => writeFile('.preview/desktop-dark.png', Buffer.from(r.data, 'base64')));
    await click('.theme-toggle');
  });
  await check('Desktop and mobile layouts have no horizontal overflow', async () => {
    for (const width of [1440, 1024, 768, 680, 390, 375, 320]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      await evaluate('window.scrollTo({top:0,behavior:"instant"})');
      await delay(120);
      const dimensions = await evaluate('({scroll:document.documentElement.scrollWidth, viewport:window.innerWidth})');
      assert(dimensions.scroll <= dimensions.viewport, `${width}px overflow: ${JSON.stringify(dimensions)}`);
      if (width === 1440 || width === 390) {
        const name = width === 1440 ? 'desktop' : 'mobile';
        await evaluate('document.querySelectorAll(".reveal").forEach(e=>e.classList.add("is-visible"))');
        await delay(750);
        const metrics = await send('Page.getLayoutMetrics');
        const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: metrics.cssContentSize.height, scale: 1 } });
        await writeFile(`.preview/${name}-full.png`, Buffer.from(shot.data, 'base64'));
        const hero = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        await writeFile(`.preview/${name}.png`, Buffer.from(hero.data, 'base64'));
      }
    }
  });
  await check('Navigation stays visible and mobile controls have usable touch targets', async () => {
    await evaluate('document.querySelector("#journey").scrollIntoView({behavior:"instant"})');
    assert.equal(await evaluate('Math.round(document.querySelector(".site-header").getBoundingClientRect().top)'), 0);
    for (const selector of ['.menu-toggle', '.theme-toggle', '.board-node', '#signal-pause', '.circle-link']) {
      const size = await evaluate(`({width:document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().width,height:document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().height})`);
      assert(size.width >= 44 && size.height >= 44, `${selector} touch target ${JSON.stringify(size)}`);
    }
  });
  await check('Mobile menu opens and closes after selecting a destination', async () => {
    await click('.menu-toggle');
    assert.equal(await evaluate('document.querySelector("#mobile-nav").hidden'), false);
    assert.equal(await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")'), 'true');
    await click('#mobile-nav a[href="#work"]');
    assert.equal(await evaluate('document.querySelector("#mobile-nav").hidden'), true);
    assert.equal(await evaluate('location.hash'), '#work');
  });
  await check('Reduced motion pauses the diagram and preserves readable content', async () => {
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await navigate(base);
    assert.equal(await evaluate('document.querySelector("#signal-pause").getAttribute("aria-label")'), 'Play signal animation');
    assert.equal(await evaluate('getComputedStyle(document.querySelector(".signal-trace")).animationIterationCount'), '1');
    assert.equal(await evaluate('getComputedStyle(document.querySelector(".reveal")).opacity'), '1');
  });
  await check('No JavaScript exceptions or failed asset requests', async () => {
    assert.deepEqual(errors, []);
    assert.deepEqual(failures, []);
  });
  // Produce a raster social card from the original vector design.
  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
  await navigate(`${base}/assets/social-card.svg`);
  const social = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile('assets/social-card.png', Buffer.from(social.data, 'base64'));
  console.log(`\n${passes} browser checks passed. Screenshots saved in .preview/.`);
} finally {
  socket.close();
}
