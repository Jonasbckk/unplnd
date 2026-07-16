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

## 3. Zuletzt gemacht (16.07.)
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
1. **Supabase nachziehen** (SQL-Editor): Migrationen `0034`–`0037` (Highlights, Titelbild, Live-Standort, Verify-Ratsche). Prüfen mit **`supabase/check-migrations.sql`** — alles muss TRUE sein. Dazu `set-founders.sql` für Flavios CEO-Badge/Admin.
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
