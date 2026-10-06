import path from 'node:path';
import { startServer } from '../electron/server.cjs';
startServer(path.join(__dirname, '..', '..', 'dist'), Number(process.env.PORT || 8080))
  .then(({ server, url }) => {
    console.log(`Vorschau: ${url}`);
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
  })
  .catch((error) => { console.error(`Vorschau fehlgeschlagen: ${error.message}. Zuerst npm run build ausführen.`); process.exitCode = 1; });
