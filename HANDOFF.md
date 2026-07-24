# HANDOFF — UNPLND

> **Hallo Flavio 👋** — kompakte Übergabe, damit du sofort weitermachen kannst.
> **Wichtig:** Der Claude-Chatverlauf synct **nicht** über Rechner (auch nicht bei gleichem Account) — er lag nur lokal auf Jonas' Rechner. Deshalb steht alles Nötige hier + im Obsidian-Vault. Diese Datei kommt per `git pull` automatisch mit.
>
> _Stand: 24.07.2026 (Nachtschicht)_

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

## 3. Zuletzt gemacht (Nachtschicht 23.→24.07.)
- **Map v4** (`8144b30`): Karte komplett neu aufgebaut — SVG-interne Kamera (gestochen scharf bei jedem Zoom, kein Blur mehr), Gesten rechnen auf dem UI-Thread (Worklets), korrekte Pan-Grenzen. Ein Multi-Agent-Review fand 3 echte Bugs vor dem Commit (u. a. falsche Pan-Grenze, die die Karte „weggeschleudert" hätte). **Muss auf dem Gerät verifiziert werden** — Reload reicht (JS-only).
- **Freunde treten Abend bei** (`452eb34`, letzter Punkt der 3er-Liste): Läuft bei einer Verbindung ein Abend, zeigt ihr Pin auf der Karte „Abend läuft · ansehen" → Live-Ansicht mit aktuellem Stopp + „Hin & dazustoßen" (öffnet Maps). Nur für angenommene Verbindungen, nur solange der Abend aktiv ist. **Braucht Migration `0038`.**
- **Design-Sweep** (`5b9b170`, aus einem 8-Screen-Design-Audit): Button-Schatten auf iOS repariert (waren komplett unsichtbar — `overflow:hidden`-Bug), Press-Feedback + Haptik app-weit (Planner-Auswahl, Tab-Bar), echte Dark-Mode-Schatten + Kanten (die warmen Schatten waren auf Dunkel unsichtbar), Voice-Screen: Tippfeld nicht mehr unter der iOS-Tastatur, Aufnahme in Akzent-Orange statt Fehler-Rot, viele A11y-Fixes (44-pt-Ziele, Rollen, Reduce Motion).

## Zuvor (16.07.)
- **Memory Map** — Vektor-Weltkarte im Profil + Vollbild (`/map`): deine Pins aus echten Abenden, Cluster, Pan/Pinch. **Kein Kartendienst, kein Client-Key** (bewusst: dafür kein Zoom auf Straßenebene). Plus **Live-Standort** für Verbindungen: opt-in, standardmäßig AUS, ~1 km gerundet, nur im Vordergrund, Ausschalten löscht sofort.
- **Planer-Spaßfaktor:** einzelne Stopps **tauschen** (statt alles neu zu würfeln) · **Mystery-Stopp** nur bei Stimmung „Überrasch mich", enthüllt sich beim Ankommen.
- **Budget rechnet jetzt wirklich:** pro Person für den ganzen Abend, Summe aller Stopps, **im Code erzwungen** (nicht der KI überlassen). Angezeigter Preis wird aus den Stopps berechnet, nicht von der KI behauptet.
- **Profil-Highlights** (Insta-Stil): Abende bewusst teilen, Story-Ansicht, eigener Name + Titelbild. Alben bleiben privat — geteilt wird nur, was du auswählst.
- **Verifizierung ist eine Ratsche:** einmal verdient = für immer (vorher nahm eine gerissene Serie den Badge weg).
- **Tutorial-Video** (Remotion, 38 s, in die App gebündelt) unter Einstellungen → Support.
- **App-Icons:** Standard · Lavendel/Mint/Limette (Premium) · Holografisch (14 Tage Serie). Unter Einstellungen → Darstellung.
- **Weekly Challenges**, **Redesign-Feinschliff** (Community-Feed + Posteingang).

> **⚠️ TestFlight ≠ automatisch aktuell.** Kein OTA — GitHub-Pushes erscheinen dort **nicht** von selbst. Neuer Stand = neuer Build:
> `npx eas-cli@latest build -p ios --profile production` → `npx eas-cli@latest submit -p ios --profile production` (läuft non-interactive).
> Zum Mitentwickeln: `--profile development` + `npx expo start --dev-client`.
>
> **⚠️ Der Planer lebt serverseitig.** App-Reload/Build reichen NICHT — nach Änderungen an `supabase/functions/generate-plan`:
> `npx supabase functions deploy generate-plan`

## 4. Offen / als Nächstes
1. **Migration `0038`** (SQL-Editor): `supabase/migrations/0038_join_evening.sql` — ohne sie gibt es keine Live-Abend-Ansicht (die App degradiert sauber, nichts crasht). Danach mit `check-migrations.sql` prüfen.
2. **`generate-plan` deployen** falls noch nicht geschehen: `npx supabase functions deploy generate-plan` — enthält Takeout-Bewusstsein, Freund-Stimme-Narrativ und die Open-Air-Ausnahme (Aussichtspunkt um 23 Uhr ist nicht „geschlossen").
3. **RevenueCat scharf schalten** (Blocker für Umsatz): 3 Produkte in **App Store Connect** auf „Bereit zum Senden" (Preis + Lokalisierung + Review-Screenshot) **+ Paid-Apps-Vertrag**. Erst dann echte Preise + Käufe. Danach **RevenueCat-Webhook → `profiles.premium`** + Premium-Gates (Album-Foto-Limit, Discover-Favoriten).
4. Noch offen aus der 7er-Liste: **Sprachnachrichten** für Planer (1×/Woche frei, sonst Premium), **Creator-Programm** (Bewerbung + Badge wie CEO). *(Weekly Challenges ✓, Freunde-treten-bei ✓.)*
5. **Redesign-Feinschliff offen:** `community.tsx` (Community-Feed) + die Chat-Screens hängen noch im alten Design — der Rest der App ist auf v2. App-Store-Screenshots aus echten iPhone-Shots rahmen. Aus dem Design-Audit noch offen: Skeleton-Loader für `community/[id]`, Pressed-States in den Settings-Rows.

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
