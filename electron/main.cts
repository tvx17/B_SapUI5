import { app, BrowserWindow, dialog, session } from 'electron';
import type { Server } from 'node:http';
import path from 'node:path';
import { startServer } from './server.cjs';
let localServer: Server | undefined;
let appUrl: string;
const smokeTest = process.argv.includes('--smoke-test');
const development = !app.isPackaged && process.argv.includes('--dev');

async function createWindow(browserMode = false) {
  const window = new BrowserWindow({
    width: 1200, height: 800, minWidth: 420, minHeight: 500,
    title: 'UI5 Boilerplate', show: false,
    webPreferences: {
      preload: browserMode ? undefined : path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false, contextIsolation: true, sandbox: true
    }
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  if (smokeTest) window.webContents.on('console-message', (event) => console.log(event.message));
  window.webContents.on('will-navigate', (event, target) => {
    if (new URL(target).origin !== appUrl) event.preventDefault();
  });
  if (!smokeTest) window.once('ready-to-show', () => window.show());
  await window.loadURL(appUrl);
  if (smokeTest) {
    const result = await window.webContents.executeJavaScript(`
      new Promise((resolve, reject) => {
        const deadline = Date.now() + 30000;
        const timer = setInterval(async () => {
          const Component = window.sap && sap.ui.require('sap/ui/core/Component');
          const component = Component && Component.get('container-boilerplate');
          if (component && document.querySelector('.sapMPage')) {
            clearInterval(timer);
            try {
              if (typeof require !== 'undefined' || typeof process !== 'undefined') throw new Error('Node exposed');
              if (component.getModel('environment').getProperty('/runtime') !== '${browserMode ? 'Browser' : 'Electron'}') throw new Error('Incorrect runtime');
              const home = component.getRootControl().byId('app').getPages()[0].getController();
              await home.onTest();
              const bundle = await component.getModel('i18n').getResourceBundle();
              if (!document.querySelector('.sapMMessageToast')?.textContent.includes(bundle.getText('testSuccess'))) throw new Error('Translated action did not render');
              component.getRouter().navTo('about');
              const navigationDeadline = Date.now() + 10000;
              const navigationTimer = setInterval(() => {
                if (document.body.textContent.includes('Plattform')) {
                  clearInterval(navigationTimer); resolve('${browserMode ? 'Browser' : 'Electron'}: SAPUI5 rendered; translated action, routing and isolation passed');
                } else if (Date.now() > navigationDeadline) {
                  clearInterval(navigationTimer); reject(new Error('Routing did not render About'));
                }
              }, 100);
            } catch (error) { reject(error); }
          } else if (Date.now() > deadline) {
            clearInterval(timer); reject(new Error('SAPUI5 did not render: ' + document.body.innerHTML.slice(0, 3000)));
          }
        }, 100);
      })
    `);
    console.log(result);
    if (browserMode) app.quit();
    else await createWindow(true);
  }
}

app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  if (development) {
    appUrl = 'http://localhost:8080';
  } else {
    const result = await startServer(path.join(app.getAppPath(), 'dist'));
    localServer = result.server;
    appUrl = result.url;
  }
  await createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow().catch(fail);
  });
}).catch(fail);

function fail(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  if (smokeTest) { console.error(error); app.exit(1); return; }
  dialog.showErrorBox('Start fehlgeschlagen', `${message}\n${development ? 'Bitte zuerst npm start in einem separaten Terminal starten.' : 'Bitte zuerst npm run build ausführen.'}`);
  app.quit();
}
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { if (localServer) localServer.close(); });
