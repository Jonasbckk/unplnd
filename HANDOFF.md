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

## 3. Zuletzt gemacht (Nachtschicht 23.→24.07., Teil 2)
- **Sicherheits-Fixes** (`f8778a0`): Ein Audit fand, dass JEDER Client sich selbst `premium=true` (und `is_founder=true`!) setzen konnte — Migration `0039` schließt das per Trigger. Dazu: **RevenueCat-Webhook** (`revenuecat-webhook`, neu) setzt `profiles.premium` serverseitig; der Voice-Concierge prüft Premium jetzt auch **serverseitig** (vorher nur im Client); Founder laufen nicht mehr ins Tageslimit.
- **Creator-Programm** (`d9473d8`, Punkt aus der 7er-Liste ✓): Bewerbung in der App (Einstellungen → Creator-Programm), **Founder reviewen direkt in der App** (annehmen/ablehnen vom Handy), Badge (Funken-Icon) überall neben dem Namen wie das CEO-Band. Migration `0040`.
- **Paywall ehrlich gemacht** (`b3c9be2`): Kein versprochener Vorteil mehr, den es nicht gibt. Sprach-Concierge ist jetzt DER Premium-Vorteil auf der Paywall; Lieblingsorte haben ein echtes Soft-Limit (20 gratis); der Tageslimit-Screen hat endlich einen „Unbegrenzt planen"-CTA (der ehrlichste Upsell-Moment). Album-Fotos bleiben **unbegrenzt** — die Bibel verbietet, Erinnerungen zu sperren.
- **Design-Runde 2** (`62ea64c`): Community-Detail, Posteingang und Chat auf v2-Niveau — Skeletons statt Spinner/Blank-Flash, Bottom-Sheets, Press-Feedback + Haptik überall, Dark-Mode-Token statt hartem Weiß, Zeitstempel im Posteingang.
- **Multi-Agent-Review über den ganzen Diff**: 10 bestätigte Findings, alle gefixt — darunter ein kritischer (der erste Wurf des Sicherheits-Triggers wäre ein No-Op gewesen) und die Erkenntnis, dass `hitSlop` in PressableScale-Wrappern tot ist (jetzt `hitTarget`-Prop, 44-pt-Ziele garantiert).

## Zuvor (Nachtschicht Teil 1)
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

## 4. Offen / als Nächstes (Morgen-Checkliste)
1. **Migrationen `0038` + `0039` + `0040`** (SQL-Editor, in dieser Reihenfolge): Live-Abend, Entitlement-Schutz, Creator-Programm. Danach mit **`supabase/check-migrations.sql`** prüfen — alles muss TRUE sein. Ohne sie degradiert die App sauber (nichts crasht), aber die Sicherheitslücke bleibt bis 0039 offen!
2. **Edge Functions deployen** (alle drei):
   ```
   npx supabase functions deploy generate-plan
   npx supabase functions deploy voice-planner
   npx supabase functions deploy revenuecat-webhook --no-verify-jwt
   ```
   Der Webhook braucht ein Secret: Dashboard → Edge Functions → Secrets → `REVENUECAT_WEBHOOK_SECRET` = ein langer Zufallsstring. Dann in **RevenueCat** (Project → Integrations → Webhooks): URL `https://<projekt-ref>.supabase.co/functions/v1/revenuecat-webhook`, Authorization-Header = derselbe String. **Optional aber empfohlen:** `REVENUECAT_API_KEY` = der geheime RC-API-Key (sk_…, RevenueCat → API Keys) — damit übersteht ein Lifetime-Käufer den Ablauf eines alten Abos und frisch Zahlende haben den Concierge sofort.
3. **RevenueCat scharf schalten** (Blocker für Umsatz): 3 Produkte in **App Store Connect** auf „Bereit zum Senden" (Preis + Lokalisierung + Review-Screenshot) **+ Paid-Apps-Vertrag**. Webhook (Punkt 2) VOR dem Live-Gang einrichten.
4. Noch offen aus der 7er-Liste: **Sprachnachrichten** für Planer (1×/Woche frei, sonst Premium). *(Weekly Challenges ✓, Freunde-treten-bei ✓, Creator-Programm ✓.)*
5. App-Store-Screenshots aus echten iPhone-Shots rahmen. Kleinkram: `deno check generate-plan` hat jetzt **5** bekannte Alt-Fehler (vorher 6) — jede andere Zahl heißt, etwas ist kaputt.

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
