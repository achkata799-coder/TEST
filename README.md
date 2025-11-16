# AI Dungeon × Friends & Fables Lab

A Next.js + Tailwind prototype that exercises the hybrid UX described in the new product brief: a **Story Mode** pane focused on freeform chat plus a **Campaign Mode** HUD that surfaces sheets, clocks, quests, and dice output. Everything in this repo is self-contained so designers and narrative engineers can tinker before wiring the production backend.

## What's inside?

- **Three-panel layout** – session controls, log/terminal, and HUD cards that mirror the reference mockups.
- **Mode blending slider** – quickly flip between narrative-first and rules-forward assumptions.
- **Action composer** – tagged inputs, quick-actions, and mock dice resolution to show the AI+rules loop.
- **Persistent data models** – characters, quests, clocks, and sample story beats that map to the architecture doc.

## Getting started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to explore the playground UI.

## Roadmap checkpoints

1. Replace the mock Zustand store with live data from the core platform (sessions, quests, world state, AI deltas).
2. Move dice + rules helpers to the shared rules engine service and call them via tool invocation / server actions.
3. Thread real-time updates over WebSockets so multiple players can see HUD changes in sync.
4. Layer in authentication, campaign browser, and configurable GM prompt packs per the design brief.
