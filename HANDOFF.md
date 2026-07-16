# HANDOFF — UNPLND

> **Hallo Flavio 👋** — kompakte Übergabe, damit du sofort weitermachen kannst.
> **Wichtig:** Der Claude-Chatverlauf synct **nicht** über Rechner (auch nicht bei gleichem Account) — er lag nur lokal auf Jonas' Rechner. Deshalb steht alles Nötige hier + im Obsidian-Vault. Diese Datei kommt per `git pull` automatisch mit.
>
> _Stand: 16.07.2026_

## 1. Stand ziehen (immer zuerst)
```bash
git fetch origin
git reset --hard origin/main
npm install
```
`reset --hard` = exakt der aktuelle Stand. Deine **`.env` bleibt** erhalten (nicht im Repo). Eigenen, noch nicht gepushten Code vorher committen/`git stash`.

## 2. App testen — kein Expo Go mehr!
Die App hat native Module (In-App-Käufe/RevenueCat, Sprachnachrichten) → **Expo Go crasht**.
- **Nur nutzen/testen → TestFlight** (Production-Build + `eas submit`, dann als interner Tester rein).
- **Live am Code → Dev-Build** + `npx expo start --dev-client`.
- Schritt für Schritt: Obsidian-Vault → **„Flavio - App testen"**.

## 3. Zuletzt gemacht
- **Planer-Überarbeitung (Kern-Feature)** — Backup-Tag `planner-v1-stable`. Fixes: Stopp-Anzahl passt jetzt zur Zeit (5 h → mehr Stopps), keine Wiederholungen mehr (Anti-Repeat pro Nutzer, 3 Tage), Öffnungszeiten werden **im Code** geprüft (geschlossene/gleich-schließende Stopps fliegen raus), Transport-Verbindungen zwischen Stopps, jede Stimmung hat einen eigenen Suchplan, neue Stimmung **„Abseits"** (ruhige Plätze mit Aussicht) + Rollen-Design als animierte Roadmap.
- **TestFlight:** Production-Build ist drin, Flavio als interner Tester eingeladen.
- **Profile (heute):** man sieht auf **fremden** Profilen jetzt Abend-DNA + Badges (nur anonyme Aggregate via RPC, Alben bleiben privat) → **braucht Migration `0032`**. „Eigenen Plan erstellen" ist prominenter. **6 Premium-App-Icons** als Assets erstellt (Verdrahtung Picker/Rebuild folgt).
- **Visuelles Redesign v2** (dunkel-first, zweifarbige Statement-Titel, Gradient-CTAs) — app-weit.
- **3D-Maskottchen** auf der Paywall (Vektor-SVG, animiert).
- **Kritischer Bugfix:** Auth-Token lief nach ~1 h ab → erster Request danach schlug still fehl. Gefixt (RN AppState-Auto-Refresh).
- **Premium-Upsell-Popups**, **Bilder laden schneller**, **Monetarisierung** (RevenueCat verdrahtet).

> **⚠️ TestFlight ≠ automatisch aktuell.** Es ist **kein** OTA/EAS-Update eingerichtet — GitHub-Pushes erscheinen dort **nicht** von selbst. Neuer Stand = neuer Build: `npx eas-cli@latest build -p ios --profile production` → `npx eas-cli@latest submit -p ios --profile production` (läuft jetzt non-interactive, `ascAppId` steht in `eas.json`). Zum Mitentwickeln: `npx eas-cli@latest build -p ios --profile development` + `npx expo start --dev-client`.
>
> **Letzter TestFlight-Build: Nr. 5 (16.07.2026, Commit f2704ba)** — enthält Memory Map + Live-Standort, Tutorial-Video, App-Icons, Highlights, Verifizierungs-Ratsche, Weekly Challenges.

## 4. Offen / als Nächstes
1. **Supabase nachziehen** (SQL-Editor, in Reihenfolge, falls noch offen): `0034_album_highlights.sql`, `0035_highlight_title_cover.sql`, `0036_live_location.sql`, `0037_verify_level_ratchet.sql`. (0030–0033 sind durch.) Prüfen mit `supabase/check-migrations.sql`.
2. **RevenueCat scharf schalten** (Blocker für Käufe): 3 Produkte in **App Store Connect** auf „Bereit zum Senden" (Preis + Lokalisierung + Review-Screenshot) **+ Paid-Apps-Vertrag**. Erst dann echte Preise + Käufe.
3. **Premium-Gates** scharf ziehen (Album-Foto-Limit, Discover-Favoriten) + **RevenueCat-Webhook → `profiles.premium`**.
5. Noch offen aus der 7er-Liste: **Sprachnachrichten** für Planer (1×/Woche frei, sonst Premium), **Creator-Programm** (Bewerbung + Badge wie CEO), **Freunde treten Abend bei**. *(Weekly Challenges sind fertig — eine Einladung pro Woche auf Home, ohne Punkte/Level, erfüllt durch echte Abende.)*
5. **Redesign-Feinschliff offen:** `community.tsx` (Community-Feed) + die Chat-Screens hängen noch im alten Design — der Rest der App ist auf v2. App-Store-Screenshots aus echten iPhone-Shots rahmen.

## 5. Vor jedem Commit (Verifizierungs-Gates)
```bash
npx tsc --noEmit        # Typen
npx jest                # Tests (u. a. i18n-Parität de/en)
npx expo export -p web  # Bundling (fängt native-Module-Leaks)
```
Secret-Scan nicht vergessen: keine Keys/Passwörter ins Repo. `.env` bleibt lokal.

## 6. Mehr Kontext
- **Obsidian-Vault** (separat, nicht im Repo): Dashboard → **„Übergabe 2026-07-07"**, plus Aufgaben/CRM/Kennzahlen. Vault-Ordner müsst ihr syncen (OneDrive o. ä.) oder Obsidian auf demselben Rechner öffnen.
- **`git log`** — jede Commit-Message erklärt das Warum.
- **`CLAUDE.md`** — die Build-Charter (Stack, Regeln, Definition of Done).
