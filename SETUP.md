# UNPLND — Setup für Mitentwickler

Willkommen im Team! Diese Anleitung bringt dich in ~15 Minuten zum Laufen.
Die App ist **React Native + Expo (TypeScript)** mit **Supabase** als Backend.
Lies vor dem ersten Feature die **`CLAUDE.md`** (die Bau-Charta) und die Docs in `docs/` —
Claude Code liest die `CLAUDE.md` beim Start automatisch mit.

---

## 1. Voraussetzungen (einmalig installieren)

- **Node.js 20 oder neuer** — https://nodejs.org
- **Git** — https://git-scm.com
- **Claude Code** (die KI) — im Terminal installieren:
  ```bash
  npm install -g @anthropic-ai/claude-code
  ```
  Den **Login für den geteilten Claude-Account** bekommst du von Jonas (siehe Abschnitt 6).
- Ein Editor (z. B. VS Code)
- Auf dem Handy: **Expo Go** aus dem App Store / Play Store
  - ⚠️ Das Projekt läuft aktuell auf **Expo SDK 54** — deine Expo-Go-Version muss dazu passen (die aktuelle Store-Version ist SDK 54).

## 2. Repo holen

> **Zuerst:** Jonas muss dich als **Collaborator** ins private GitHub-Repo einladen
> (GitHub → Repo → *Settings* → *Collaborators* → deinen GitHub-Namen eintragen).
> Du bekommst eine E-Mail → **Einladung annehmen**, sonst schlägt `git clone` fehl.

```bash
git clone https://github.com/Jonasbckk/unplnd.git
cd unplnd
npm install --legacy-peer-deps
```

> ⚠️ Das `--legacy-peer-deps` ist **wichtig** — ohne den Zusatz bricht `npm install` wegen
> eines bekannten Peer-Konflikts (Expo SDK 54) ab. Das gilt für **jedes** `npm install` im Projekt.

## 3. Umgebungsvariablen

```bash
cp .env.example .env
# Windows PowerShell stattdessen: Copy-Item .env.example .env
```

Dann `.env` öffnen und die zwei Werte eintragen (bekommst du von Jonas oder aus dem
Supabase-Dashboard → Settings → API):

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

> Der `anon`/publishable Key ist **öffentlich unbedenklich** (durch Row Level Security geschützt).
> **Niemals** den `service_role`-Key oder das DB-Passwort in `.env` oder ins Repo schreiben.

## 4. Starten & auf dem Handy testen

```bash
npm start
```

Firewall-Abfrage → **zulassen**. Dann den QR-Code mit der Handy-Kamera (iOS) bzw.
in Expo Go (Android) scannen. Handy und PC müssen im **selben WLAN** sein.
Falls nichts lädt: `npx expo start --tunnel`.

## 5. Backend-Zugang (Supabase)

Damit du an Datenbank, Login und den Edge Functions mitarbeiten kannst, lass dich von
Jonas ins **Supabase-Projekt** einladen (Organisation → Team → Invite).
Ihr arbeitet dann an **derselben** Datenbank/Backend — das ist Cloud, nicht lokal.

Edge Functions (der KI-Planer `generate-plan`, `discover`, `delete-account`) werden im
Supabase-Dashboard unter **Edge Functions** deployt. Der Code dazu liegt in
`supabase/functions/`.

## 6. Mit Claude Code arbeiten

Wir teilen uns **einen** Claude-Account (ein Max-Abo). Ablauf:

1. Im Projektordner Claude Code starten:
   ```bash
   cd unplnd
   claude
   ```
2. Beim **ersten Start** fragt er nach Login → im Browser mit den **geteilten Account-Daten**
   anmelden (bekommst du von Jonas).
3. ⚠️ **Nicht gleichzeitig** beide arbeiten — es ist **ein** Account, ihr teilt euch Sitzung
   und Nutzungslimit. Kurz absprechen, wer gerade dran ist.
4. Claude Code liest die **`CLAUDE.md`** automatisch mit — er kennt Stack, Regeln und Struktur
   sofort. Guter erster Prompt:
   > „Lies CLAUDE.md und die Docs in docs/, dann erklär mir den aktuellen Projektstand."

Er kann Dateien lesen und ändern, Terminal-Befehle ausführen und dir alles erklären.
Für ein neues Feature: erst das passende Doc in `docs/` lesen lassen, dann umsetzen.

---

## Arbeitsweise (damit wir uns nicht in die Quere kommen)

- **Vor dem Loslegen** immer `git pull`, damit du den neuesten Stand hast.
- Für größere Änderungen einen **eigenen Branch** anlegen:
  ```bash
  git checkout -b mein-feature
  ```
- Wenn fertig: committen und pushen, dann auf GitHub einen Pull Request stellen.
- **Nicht gleichzeitig dieselbe Datei** bearbeiten (sonst Merge-Konflikte).
- **Never commit:** `.env`, Keys, Passwörter. (`.gitignore` schützt das meiste automatisch.)

## Nützliche Befehle

```bash
npm start            # Dev-Server + QR-Code
npx tsc --noEmit     # Typen prüfen (sollte 0 Fehler zeigen)
npx expo export -p web   # Produktions-Build testen (bundelt alles)
```

## Projektstruktur (Kurzüberblick)

```
/src/app          Screens (Expo Router, dateibasiert)
/src/features     Feature-Logik (planner, albums, evening, auth, …)
/src/components   Wiederverwendbare UI-Bausteine
/src/lib          Supabase, Maps, Wetter, i18n, Standort, …
/src/theme        Design-Tokens (Farben, Typo, Spacing, Motion)
/supabase         Migrationen + Edge Functions (das Backend)
/docs             Die „Bibel" (50 Docs) + Synthese
CLAUDE.md         Bau-Charta — höchste Priorität, zuerst lesen
```

Bei Fragen: Jonas fragen oder Claude Code fragen („Lies CLAUDE.md und erklär mir X").
Viel Spaß! 🚀
