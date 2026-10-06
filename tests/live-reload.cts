import { app, BrowserWindow } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
const windows: BrowserWindow[] = [];
const probe = path.join(__dirname, '..', '..', 'webapp', 'reload-smoke-probe.ts');
let ownsProbe = false;

async function waitForUI(window: BrowserWindow, runtime: string) {
  await window.webContents.executeJavaScript(`new Promise((resolve, reject) => {
    const deadline = Date.now() + 30000;
    const timer = setInterval(() => {
      const Component = window.sap && sap.ui.require('sap/ui/core/Component');
      const component = Component && Component.get('container-boilerplate');
      if (component && document.querySelector('.sapMPage') && window.LiveReload?.connector?.socket?.readyState === 1) {
        clearInterval(timer);
        if (component.getModel('environment').getProperty('/runtime') !== '${runtime}') {
          reject(new Error('Unexpected runtime'));
        } else resolve();
      } else if (Date.now() > deadline) {
        clearInterval(timer); reject(new Error('UI or Live Reload connection unavailable'));
      }
    }, 100);
  })`);
}

function nextLoad(window: BrowserWindow) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      window.webContents.removeListener('did-finish-load', loaded);
      reject(new Error('No automatic reload after source change'));
    }, 15000);
    function loaded() { clearTimeout(timer); resolve(); }
    window.webContents.once('did-finish-load', loaded);
  });
}

app.whenReady().then(async () => {
  for (const runtime of ['Browser', 'Electron']) {
    const window = new BrowserWindow({ show: false, webPreferences: {
      sandbox: true, contextIsolation: true, nodeIntegration: false,
      backgroundThrottling: false,
      preload: runtime === 'Electron' ? path.join(__dirname, '..', 'electron', 'preload.cjs') : undefined
    } });
    windows.push(window);
    window.webContents.on('console-message', (event) => console.log(event.message));
    await window.loadURL('http://localhost:8080/?sap-ui-language=de#about');
    await waitForUI(window, runtime);
  }
  // A new application resource must trigger all connected clients without a build.
  const reloads = windows.map(nextLoad);
  await fs.writeFile(probe, 'export const value: number = 42;', { flag: 'wx' });
  ownsProbe = true;
  await Promise.all(reloads);
  for (const [index, window] of windows.entries()) {
    await waitForUI(window, index === 0 ? 'Browser' : 'Electron');
    if (!window.webContents.getURL().endsWith('#about')) throw new Error('Route lost on reload');
    await window.webContents.executeJavaScript(`new Promise((resolve, reject) => {
      sap.ui.require(['com/example/boilerplate/reload-smoke-probe'], (probe) => {
        if (probe.value === 42) resolve();
        else reject(new Error('TypeScript resource was not transpiled correctly'));
      }, reject);
    })`);
  }
  console.log('PASS: Browser and Electron reloaded TypeScript changes, preserved the route and loaded the transpiled module.');
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  for (const window of windows) window.destroy();
  if (ownsProbe) await fs.unlink(probe);
  app.exit(Number(process.exitCode || 0));
});
app.on('window-all-closed', () => {});
