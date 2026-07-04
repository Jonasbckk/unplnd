# Onboarding demo photos

Curated photos for the sample evenings shown in the onboarding planner demo
(`src/app/onboarding/demo.tsx`, data in `src/features/onboarding/demo-plans.ts`).

Save each photo here with the exact filename below (all lowercase, `.jpg`, no umlauts).
Order matches the three stops of each mood, top to bottom.

## Stay In (Zuhause)
- `zuhause-1.jpg` — 19:30 · Zutaten besorgen (groceries / vegetables)
- `zuhause-2.jpg` — 20:30 · Zusammen kochen & essen (cooking at the stove)
- `zuhause-3.jpg` — 22:00 · Filmabend mit Decke und Snacks (movie night)

## Romantic (Romantisch)
- `romantisch-1.jpg` — 19:00 · Abendessen in einer Trattoria
- `romantisch-2.jpg` — 21:00 · Sonnenuntergangs-Spaziergang am Fluss
- `romantisch-3.jpg` — 22:30 · Cocktails in der Rooftop-Bar

## Activities (Aktivitäten)
- `aktivitaeten-1.jpg` — 18:30 · Bouldern oder Minigolf
- `aktivitaeten-2.jpg` — 20:30 · Streetfood-Markt
- `aktivitaeten-3.jpg` — 22:00 · Craft-Beer-Bar

## Party
- `party-1.jpg` — 20:00 · Vorglühen in einer Cocktailbar
- `party-2.jpg` — 22:00 · Live-Musik oder DJ-Set
- `party-3.jpg` — 23:30 · Tanzen im Club

Once a file is here, wire it in `demo-plans.ts`:
`image: require('../../../assets/onboarding/zuhause-1.jpg')`
