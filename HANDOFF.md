# HANDOFF — UNPLND

> **Hallo Flavio 👋** — kompakte Übergabe, damit du sofort weitermachen kannst.
> **Wichtig:** Der Claude-Chatverlauf synct **nicht** über Rechner (auch nicht bei gleichem Account) — er lag nur lokal auf Jonas' Rechner. Deshalb steht alles Nötige hier + im Obsidian-Vault. Diese Datei kommt per `git pull` automatisch mit.
>
> _Stand: 07.07.2026_

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
- **Visuelles Redesign v2** (dunkel-first, zweifarbige Statement-Titel, Gradient-CTAs) — app-weit ausgerollt.
- **3D-Maskottchen** auf der Paywall (pures Vektor-SVG, animiert).
- **Kritischer Bugfix:** Auth-Token lief nach ~1 h ab → erster Request danach schlug still fehl (Ursache für „erste Chat-Nachricht geht nicht" + fehlendes Profilbild). Gefixt (RN AppState-Auto-Refresh).
- **Premium-Upsell-Popups** (2. App-Start / 3. Einstellungen / 3. Stil-Änderung; nie für Premium).
- **Bilder laden schneller** (signierte URLs gecacht), **Abend-DNA** als Prozent-Balken.
- **Monetarisierung:** RevenueCat-SDK + Paywall + Store + Upsell verdrahtet.

## 4. Offen / als Nächstes
1. **RevenueCat scharf schalten** (Blocker für Käufe): 3 Produkte in **App Store Connect** auf „Bereit zum Senden" (Preis + Lokalisierung + Review-Screenshot) **+ Paid-Apps-Vertrag** aktivieren. Erst dann echte Preise + Käufe.
2. **TestFlight-Build** erstellen → dich als internen Tester (geht jetzt schon, Käufe kommen später).
3. **Migration `0030_sync_author_identity.sql`** im Supabase-SQL-Editor ausführen, falls noch nicht (Profilbild/Name-Sync auf veröffentlichten Plänen).
4. **Premium-Gates** scharf ziehen (Album-Foto-Limit, Discover-Favoriten) + **RevenueCat-Webhook → `profiles.premium`**.
5. Optional: Redesign-Feinschliff auf Chat-Screens + Community-Feed.

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
