# 🏰 HotsDrafter React App — Your Friendly Codebase Guide

> **You already know this app inside and out — you built the Windows version!**
> This guide maps everything you know from the C++ app to where it lives in React.
> Same logic, same heroes, same drafting — just organized differently.

---

## 📁 The Big Picture

```
ReactVercelApp/
├── src/
│   ├── app/          ← 🖥️  PAGES (what the user sees)
│   ├── components/   ← 🧩  REUSABLE UI PIECES
│   ├── contexts/     ← 🎨  SHARED STATE (theme)
│   └── data/         ← 🧠  BRAINS (all the logic you wrote in C++)
├── public/           ← 📸  Images, hero portraits
├── package.json      ← 📦  Dependencies (like your .vcxproj)
└── next.config.ts    ← ⚙️  Build settings
```

**That's it.** Four folders in `src/` and you know the whole app.

---

## 🖥️ Pages (`src/app/`)

> **How it works:** Each folder = a URL. `app/draft/page.tsx` = `yoursite.com/draft`
> This is called "file-based routing" — no router config needed!

| Folder | URL | What It Is | C++ Equivalent |
|--------|-----|------------|----------------|
| `page.tsx` | `/` | **Home** — Map selection, hero spotlight, action buttons | `StartupPage` |
| `draft/page.tsx` | `/draft` | **Interactive Draft** — The main event! Bans, picks, smart suggestions | `InteractiveDraftPage` |
| `draft/result/page.tsx` | `/draft/result` | **Draft Results** — Shareable summary after completing a draft | *(new in React)* |
| `sample/page.tsx` | `/sample` | **Sample Draft** — Random teams with analysis | `SampleDraftPage` |
| `team-builder/page.tsx` | `/team-builder` | **Team Builder** — Free-form 5v5 builder | `TeamBuilderPage` |
| `compare/page.tsx` | `/compare` | **Compare** — Hero vs hero matchup comparison | *(new in React)* |
| `tier-list/page.tsx` | `/tier-list` | **Tier List** — Map-specific hero rankings | *(new in React)* |
| `history/page.tsx` | `/history` | **History** — Past drafts with stats | *(new in React)* |
| `settings/page.tsx` | `/settings` | **Settings** — Weights, shortcuts, theme | Settings in StartupPage |
| `layout.tsx` | *(all pages)* | **Layout wrapper** — GlobalNav, theme, skip-link | `MainWindow` (Frame host) |
| `globals.css` | *(all pages)* | **Global styles** — Animations, theme colors | *(inline in XAML)* |

---

## 🧩 Components (`src/components/`)

> **Think of these like XAML UserControls** — reusable UI pieces used across pages.

| Component | What It Does | Used On |
|-----------|-------------|---------|
| `HeroPortrait.tsx` | Hero image with role border, ban overlay, tier badge | Everywhere |
| `TeamPanel.tsx` | Team sidebar: picks, bans, role checks, score, synergies | Draft, Sample |
| `HeroSuggestionPanel.tsx` | Suggestion cards with scores, reasons, tags | Draft |
| `DraftProgressBar.tsx` | The 16-step ban/pick progress bar | Draft |
| `RoleFilterBar.tsx` | Role filter buttons (All/Tank/Healer/DPS/Mage/Offlane/Spec) | Draft, Compare |
| `GlobalNav.tsx` | Bottom navigation dock (visible on all pages) | Layout |
| `HeroDetailPopup.tsx` | Click-a-hero popup: specialties, synergies, map performance | Draft, Tier List |
| `TutorialOverlay.tsx` | First-time spotlight walkthrough | Home, Draft |
| `MapCard.tsx` | Map selection card with specialties and top heroes | Home |
| `ErrorBoundary.tsx` | Catches crashes, shows "Try Again" button | Draft, Compare, TB |
| `FirstRunTutorial.tsx` | Legacy tutorial (replaced by TutorialOverlay) | — |

---

## 🧠 Data / Logic (`src/data/`)

> **This is where your C++ brain lives in TypeScript.**
> Same classes, same algorithms, same weights — just `.ts` instead of `.cpp`.

### The Core Engine (same as your C++ classes)

| File | C++ Equivalent | What It Does |
|------|---------------|-------------|
| `Hero.ts` | `Hero.h/cpp` | Hero class: name, nicknames, role, specialties, range |
| `HeroData.ts` | `HeroData.h/cpp` | ALL_HEROES (90 heroes), ALL_MAPS (11 maps) |
| `Map.ts` | `Map.h/cpp` | Map class with specialty weights, `scoreHero()`, `scoreTeam()` |
| `Specialty.ts` | `Specialty` enum | 59 specialties (WAVECLEAR, ENGAGE, HARD_CC, etc.) |
| `TeamComposition.ts` | `TeamComposition.h/cpp` | Wraps 5 heroes, `hasSpecialty()`, `hasHardCC()` |
| `DraftingTool.ts` | `DraftingTool.h/cpp` | Draft state: pick/ban/undo, 16-step order, available pool |
| `HeroRelationships.ts` | `HeroRelationships.h/cpp` | 85 synergy pairs, 112 counter pairs, 25 specialty rules |
| `HeroSuggestionEngine.ts` | `HeroSuggestionEngine.h/cpp` | **THE BIG ONE** — 9-factor scoring: synergy, counter, map, role, win condition, range, draft position, damage balance, counterpick risk |
| `WinConditionAnalyzer.ts` | `WinConditionAnalyzer.h/cpp` | Detects 8 win conditions (Teamfight, Dive, Poke, Split, etc.) |
| `IcyVeinsData.ts` | `IcyVeinsData.h/cpp` | Web-scraped synergies/counters/map tiers from Icy Veins |
| `SuggestionTypes.ts` | `SuggestionTypes.h` | Enums and interfaces: WinCondition, HeroSuggestion, etc. |

### React-Only Additions

| File | What It Does |
|------|-------------|
| `DraftSettings.ts` | Settings persistence (localStorage): weights, suggestion count, first pick, coaching tips |
| `DraftHistory.ts` | Save/load/clear draft history from localStorage |
| `DraftExport.ts` | Export draft as text or shareable URL |
| `TeamTemplates.ts` | 8 pre-built team templates (Dive, Poke, Macro, etc.) for Team Builder |
| `icy-veins-data.json` | The raw JSON data from the Python scraper pipeline |

---

## 🎨 Theme & State (`src/contexts/`)

| File | What It Does |
|------|-------------|
| `ThemeContext.tsx` | Dark/light mode toggle, saved to localStorage |

---

## 🔗 How It All Connects

```
User clicks "Interactive Draft" on Home
        │
        ▼
   draft/page.tsx loads
        │
        ├── Creates DraftingTool (tracks picks/bans)
        ├── Creates HeroSuggestionEngine (scores heroes)
        │       │
        │       ├── Uses HeroRelationships (synergy/counter data)
        │       ├── Uses IcyVeinsData (tier lists, web data)
        │       ├── Uses WinConditionAnalyzer (team strategy)
        │       └── Uses Map.scoreHero() (map fitness)
        │
        ├── Renders TeamPanel × 2 (left + right)
        ├── Renders HeroSuggestionPanel (center, scored suggestions)
        ├── Renders DraftProgressBar (top)
        └── Renders Hero Grid (90 clickable portraits)
                │
                ▼
        User clicks a hero → handleHeroClick()
        → draft.pickHero() or draft.banHero()
        → suggestions recompute via useMemo
        → UI updates instantly
```

---

## 🆚 C++ → React Translation Cheat Sheet

| C++ Concept | React Equivalent |
|-------------|-----------------|
| `.h` header file | TypeScript `interface` / `type` at top of file |
| `.cpp` implementation | Same `.ts` file (no header/impl split) |
| `class Hero` | `interface Hero` in `Hero.ts` |
| `static s_heroes` | `export const ALL_HEROES` in `HeroData.ts` |
| `std::wstring` | `string` (TypeScript) |
| `std::vector<Hero>` | `Hero[]` (array) |
| `std::map<K,V>` | `Map<K,V>` or plain object `Record<K,V>` |
| XAML `<Page>` | `page.tsx` file in `app/` folder |
| XAML `<UserControl>` | Component `.tsx` file in `components/` |
| XAML data binding | React `useState` + JSX `{variable}` |
| `PropertyChanged` | `useState` setter → auto re-render |
| `Frame.Navigate()` | `router.push('/draft')` or `<Link href="/draft">` |
| WinUI `DispatcherTimer` | `useEffect` + `setInterval` |
| `LocalSettings` | `localStorage.getItem/setItem` |
| MSBuild | `npx next build` |
| F5 Debug | `npx next dev --port 3000` |

---

## 🏗️ How to Make Changes

### Want to change how suggestions are scored?
→ Edit `src/data/HeroSuggestionEngine.ts`

### Want to add a new hero?
→ Add to the array in `src/data/HeroData.ts`
→ Add a portrait image to `public/hero_portraits/`

### Want to change how a page looks?
→ Edit the `page.tsx` in the corresponding `src/app/` folder

### Want to add a new reusable widget?
→ Create a new `.tsx` file in `src/components/`
→ Import it in the page that needs it

### Want to add a new page?
→ Create a new folder in `src/app/` with a `page.tsx` inside
→ It automatically gets a URL matching the folder name

### Want to build and test?
```bash
npx next dev --port 3000   # Start dev server (hot reload)
npx next build              # Production build (checks for errors)
vercel deploy --prod        # Deploy to Vercel (live URL)
```

---

## 📊 By the Numbers

| Metric | Count |
|--------|-------|
| Pages | 9 (+1 layout) |
| Components | 11 |
| Data modules | 15 |
| Heroes | 90 |
| Maps | 11 |
| Specialties | 59 |
| Synergy pairs | 85 |
| Counter pairs | 112 |
| Scoring factors | 9 |
| Win conditions | 8 |
| Team templates | 8 |
| Commits | 21+ cycles |

---

> **Remember:** You built all the hard stuff already in C++.
> The React version is the same brain in a web-friendly body.
> Every scoring weight, every synergy pair, every win condition formula —
> it's all here, just wearing a `.ts` jacket instead of `.cpp` armor. 🛡️
