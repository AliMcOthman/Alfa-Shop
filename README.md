# alfaShop – Online-Shop

## 1. Projektbeschreibung

alfaShop ist ein Online-Shop für technische Produkte. Kunden können Produkte ansehen, suchen, filtern, in den Warenkorb legen und Bestellungen aufgeben. Registrierte Kunden können ihre Bestellungen in ihrem persönlichen Kundenkonto einsehen.

Das Projekt wurde im Rahmen einer Weiterbildung entwickelt.

## 2. Verwendete Technologien

### Frontend
- React
- TypeScript
- Vite
- Bootstrap
- React Router

### Backend
- Node.js
- Express
- SQLite
- Sequelize ORM
- JSON Web Token (JWT)
- Multer für den Bildupload
- bcryptjs für die Passwortverschlüsselung

## 3. Funktionen

### Kundenbereich
- Kundenregistrierung und Anmeldung
- Produkte anzeigen, suchen und nach Kategorien filtern
- Warenkorb verwalten und Produktmengen ändern
- Bestellungen aufgeben
- Eigene Bestellungen im Kundenkonto ansehen
- Lagerbestände nach einer erfolgreichen Bestellung automatisch aktualisieren

### Administrationsbereich
- Anmeldung als Administrator
- Produkte hinzufügen, bearbeiten und löschen
- Produktbilder hochladen
- Bestellungen anzeigen und drucken
- Bestellungen löschen
- Bestellstatus ändern
- Lagerbestände verwalten

## 4. Projektstruktur

- `frontend/` – React-Anwendung
- `backend/` – Express-Server, API und Datenbankmodelle
- `backend/uploads/` – hochgeladene Produktbilder
- `backend/alfaShop.db` – SQLite-Datenbank, wird lokal verwendet

Die Datenbankdatei und geheime Umgebungsvariablen werden nicht in das GitHub-Repository hochgeladen.

## 5. Voraussetzungen

- Node.js
- npm

## 6. Installation und Start

### Backend starten

Ein Terminal im Projektverzeichnis öffnen und folgende Befehle ausführen:

```bash
cd backend
npm install
npm start
```

Vor dem ersten Start muss eine `.env`-Datei im Ordner `backend/` erstellt werden. Sie enthält mindestens einen eigenen, sicheren JWT-Schlüssel:

```env
JWT_SECRET=HIER_EINEN_SICHEREN_GEHEIMEN_SCHLUESSEL_EINTRAGEN
```

Der Schlüssel ist durch einen selbst erzeugten, ausreichend langen Zufallswert zu ersetzen. Die `.env`-Datei darf nicht in das GitHub-Repository hochgeladen werden.

Der Backend-Server läuft unter:

http://127.0.0.1:3000

### Frontend starten

Ein zweites Terminal öffnen:

```bash
cd frontend
npm install
npm run dev
```

Die Anwendung ist normalerweise unter folgender Adresse erreichbar:

http://localhost:5173

## 7. Datenbank und Produktbilder

Die Produkt- und Bestelldaten werden in einer SQLite-Datenbank gespeichert. Sequelize wird für die Verwaltung der Datenbank und der Datenmodelle verwendet.

Produktbilder werden im Backend gespeichert. Die zugehörigen Bildpfade werden in der Datenbank hinterlegt.

Beim Start verbindet sich das Backend mit der Datenbank und synchronisiert die Modelle mit der vorhandenen Datenbankstruktur.

## 8. Qualitätssicherung

Die Frontend-Prüfungen werden mit folgenden Befehlen ausgeführt:

```bash
cd frontend
npm run lint
npm run build
```

Beide Befehle wurden erfolgreich ausgeführt.

Vor der Abgabe werden zusätzlich die wichtigsten Funktionen manuell getestet, insbesondere Anmeldung, Produktverwaltung, Warenkorb, Bestellvorgang, Lagerbestand und Bestellverwaltung.

## 9. Sicherheit

- Passwörter werden mit bcryptjs gehasht.
- Geschützte Administrator-Funktionen werden serverseitig überprüft.
- JWT-Schlüssel und andere geheime Umgebungsvariablen dürfen nicht veröffentlicht werden.
- Die `.env`-Datei und lokale Datenbankdateien werden durch `.gitignore` ausgeschlossen.

## 10. Projektstatus

Die wesentlichen Funktionen des Online-Shops und des Administrationsbereichs sind implementiert. Die Frontend-Lint-Prüfung und der Produktionsbuild wurden erfolgreich abgeschlossen. Der abschließende manuelle Funktionstest erfolgt vor der Abgabe.
