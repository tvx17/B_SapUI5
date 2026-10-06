# SAPUI5 + Electron Boilerplate

Eine gemeinsame SAPUI5-Anwendung für Browser und Electron. Die Vorlage enthält XML-Views, Controller, Hash-Routing, deutsche und englische Texte sowie einen minimalen Desktop-Adapter. Sie verwendet SAPUI5, nicht OpenUI5; das vollständige Demo Kit ist nicht Bestandteil der Anwendung.

## Voraussetzungen und Start

Node.js ab 22.12.0 (empfohlen: Node.js 24) und npm. Internet wird für die erste Installation und den ersten Download des SAPUI5-Frameworks und der Electron-Laufzeit benötigt.

```sh
npm ci
npm start
```

Browser: http://localhost:8080/index.html. Änderungen unter `webapp/` werden automatisch per Live Reload übernommen.

Für Electron während der Entwicklung in einem zweiten Terminal:

```sh
npm run desktop:dev
```

Der mit `npm start` gestartete UI5-Server übersetzt die TypeScript-UI bei Anfragen direkt aus den Quellen. Ein Produktionsbuild ist dafür nicht erforderlich. `npm start` und `npm run desktop:dev` kompilieren zuvor die Node-/Electron-Quellen nach `build/`. TypeScript, XML, JSON und Übersetzungsdateien lösen einen Seitenreload aus; CSS wird üblicherweise direkt aktualisiert. Die Hash-Route bleibt erhalten, ungespeicherter Anwendungszustand kann verloren gehen. Dies ist Live Reload, kein zustandserhaltendes Hot Module Replacement.

Den Server über `localhost:8080` verwenden; Live Reload benötigt zusätzlich den freien Port `35729`. Änderungen an `electron/` erfordern einen Neustart von `npm run desktop:dev`, Änderungen an `ui5.yaml` einen Neustart von `npm start`. Die Startbefehle kompilieren die Node-/Electron-Quellen automatisch neu. Beide Prozesse mit Strg+C beenden bzw. das Electron-Fenster schließen.

Der Entwicklungsserver erlaubt den lokalen Live-Reload-Dienst sowie Inline-Skripte und dynamische Codeauswertung des ungebauten UI5-Loaders über eine nur zur Laufzeit angepasste Content Security Policy. Die CSP in `webapp/index.html` und im Produktionsbuild bleibt unverändert. `--dev` wird von der gepackten Anwendung ignoriert.

Für einen Test des Produktionsstands:

```sh
npm run desktop
```

Baut die Anwendung inklusive UI5-Ressourcen und öffnet Electron. Nach Änderungen erneut ausführen. `npm run desktop:start` öffnet den vorhandenen Build ohne Neubau. Browser und Desktop können gleichzeitig laufen; Electron verwendet einen automatisch vergebenen lokalen Port.

## Build und Auslieferung

| Befehl | Ergebnis |
| --- | --- |
| `npm run build` | Statische Anwendung mit lokalen UI5-Ressourcen in `dist/` |
| `npm run preview` | Prüft den Build unter http://127.0.0.1:8080 |
| `npm run package` | Entpackte Desktop-Anwendung für das aktuelle Betriebssystem in `release/` |
| `npm run dist:win` | Portable Windows-EXE in `release/` |
| `npm run typecheck` | Strikte Typprüfung für UI und Node-/Electron-Code |
| `npm run build:node` | Node-/Electron-Code aus `.cts` nach CommonJS in `build/` kompilieren |
| `npm test` | Tests für den lokalen HTTP-Server |
| `npm run test:reload` | Bei laufendem `npm start`: automatischer Reload-Test in Browser-Modus und Electron |
| `npm run test:desktop` | Build und automatisierter Test in Chromium mit und ohne Electron-Adapter (verborgene Fenster) |

Für Web-Hosting den gesamten Inhalt von `dist/` auf einen statischen Webserver kopieren. Auch Unterverzeichnisse werden durch relative Ressourcenpfade unterstützt. Hash-Routing benötigt keine serverseitigen Routing-Regeln. `index.html` über HTTP(S) öffnen, nicht per Doppelklick. Der Preview-Server bindet ausschließlich an Loopback und ist für lokale Prüfungen vorgesehen.

Die gebaute Anwendung benötigt für ihre UI keine CDN-Verbindung. Die Desktop-App liefert `dist/` über einen internen HTTP-Server aus. Offline-Nutzung im Browser setzt einen erreichbaren lokalen Webserver voraus; es ist kein Service Worker enthalten. Ein Backend ist nicht eingerichtet.

Windows-Artefakte auf Windows erstellen. macOS-/Linux-Ziele sind in `package.json` vorbereitet und sollten auf dem jeweiligen Betriebssystem gebaut werden. Produktive Signierung, eigene Icons und Installer-Metadaten sind projektspezifisch zu ergänzen.

## Als Vorlage verwenden

1. Repository als Template verwenden oder die Quelldateien in ein neues Verzeichnis kopieren; `node_modules/`, `build/`, `dist/`, `release/` und `.git/` nicht mitkopieren.
2. In `package.json` `name`, `description`, `author`, `build.appId` und `build.productName` anpassen.
3. Den UI5-Namespace `com.example.boilerplate` und seine Pfadform `com/example/boilerplate` projektweit ersetzen. Insbesondere `ui5.yaml`, `manifest.json`, `Component.ts`, Bootstrap, Views und Controller berücksichtigen.
4. Anwendungstitel in `webapp/i18n/`, `webapp/index.html` und `electron/main.cts` anpassen.
5. `npm install` ausführen, damit die Lockdatei zum neuen Paketnamen passt. Danach `npm ci` für reproduzierbare Installationen verwenden.
6. Neue Views und Controller unter `webapp/` anlegen und Routen in `manifest.json` ergänzen.

```text
webapp/             Gemeinsame SAPUI5-Anwendung
  Component.ts      Initialisierung und Laufzeitmodell
  manifest.json     App-Metadaten, Modelle und Routing
  view/             XML-Views
  controller/       UI-Verhalten
  i18n/             Übersetzungen (Standard Deutsch, Englisch)
  css/              Eigene Styles
electron/           Desktop-Fenster, isolierter Preload, lokaler Server
scripts/            Vorschau und Entwicklungs-Middleware (.cts)
tests/              Server- und Live-Reload-Tests (.cts)
types/              Gemeinsamer Vertrag für window.desktop
build/              Generierte CommonJS-Dateien (nicht versioniert)
tsconfig.json       UI-Typprüfung
tsconfig.node.json  Node-/Electron-Typprüfung und Kompilierung
ui5.yaml            SAPUI5-Version und verwendete Bibliotheken
```

Zusätzliche UI5-Bibliotheken in `ui5.yaml` und `webapp/manifest.json` eintragen. Bei Versionswechseln `framework.version` und `minUI5Version` zusammen prüfen und einen vollständigen Build ausführen.


## TypeScript

Die UI verwendet ES-Module und Klassen mit `@namespace` für die UI5-Klassennamen. `ui5-tooling-transpile` übersetzt sie bei Entwicklung und Build in das UI5-Modulformat. Die SAPUI5-Typdefinitionen sind auf die Framework-Version 1.152.0 abgestimmt. Bei einem Framework-Update auch `@sapui5/types` aktualisieren.

`npm run build` führt zuerst die Typprüfung für beide Umgebungen aus. Die UI-Konfiguration prüft den Anwendungscode strikt; `skipLibCheck` überspringt die interne Prüfung fremder Deklarationsdateien, weil das vollständige SAPUI5-Typpaket auch hier ungenutzte Bibliotheken mit zusätzlichen Typabhängigkeiten enthält. XML-Bindings und Handlernamen werden dadurch nicht statisch geprüft; dafür den Desktop-Test verwenden.

Electron und Hilfsskripte liegen als `.cts` vor und werden mit `tsc` nach `build/` kompiliert. Die Endung sichert CommonJS und erhält den sandboxfähigen Preload. Die Paketierung enthält ausschließlich die kompilierten Electron-Dateien und den UI-Build. `npm run desktop:start` verwendet den zuletzt erstellten Build; nach einer frischen Installation zuerst `npm run build` ausführen.

## Desktop-Schnittstelle

Die UI greift nicht direkt auf Node.js zu. `electron/preload.cts` stellt ausschließlich `window.desktop.platform` bereit. Im Browser fehlt dieser Adapter; das `environment`-Modell bietet in beiden Laufzeiten dieselbe Struktur. Neue native Funktionen über eng begrenzte, validierte IPC-Methoden ergänzen. Context Isolation und Sandbox sind aktiviert, neue Fenster, externe Navigation und Berechtigungsanfragen werden blockiert.

Die Content Security Policy in `webapp/index.html` erlaubt lokale Ressourcen. Für ein späteres API-Backend `connect-src` gezielt erweitern und dessen CORS-/Authentifizierungskonfiguration passend einrichten.

## Referenzen

- [UI5 CLI-Konfiguration](https://ui5.github.io/cli/v4/pages/Configuration/)
- [Electron Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [Electron-Builder-Konfiguration](https://www.electron.build/v26/docs/configuration/)

SAPUI5 bleibt den zugehörigen SAP-Lizenzbedingungen unterworfen; diese Vorlage vergibt keine Rechte an Framework- oder Drittanbieterdateien.

Stand der Abhängigkeitsprüfung: `npm audit` meldet sieben Funde (drei moderate, vier hohe) in der Entwicklungskette von `@ui5/cli@4.0.69`. Der vorgeschlagene automatische Major-Fix würde die CLI auf Version 2 zurücksetzen und wird deshalb nicht angewendet. Die CLI ist nicht Teil des ausgelieferten Desktop-Pakets. Vor produktiver Übernahme auf eine korrigierte CLI-Version prüfen.
