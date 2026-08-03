# Snoop HQ

A private, account-aware Old School RuneScape companion for **SnoopNoBank**,
**SnoopJoint**, and the restricted-build PK account **WildySnoop**.

The first version includes:

- account-locked conversations with persistent local history
- player-approved memories and reflections
- live RuneProfile progression with verified snapshot fallbacks
- automatic OSRS Wiki research for current methods, requirements, and rates
- exact XP-to-target calculations using the active account's live skill XP
- a visual journey for the Fire cape, Angler/Tempoross, and obsidian milestones
- confirmed UIM equipment and dated looting-bag context
- strict separation between the UIM, regular Ironman, and obby maul pure
- a no-guessing policy for unverified item sprites and account state

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## AI dialogue

The companion works without an external key in grounded local mode. To enable
full researched dialogue, copy `.env.example` to `.env.local` and add an OpenAI
API key. The default model is GPT-5.6 Sol with high reasoning effort, matching
the model used to design the companion. API keys stay server-side and are never
stored in the browser.

For every gameplay question, the chat server locks the selected account first,
refreshes its RuneProfile skills and quest states, retrieves relevant current
OSRS Wiki guidance, performs deterministic level-target calculations, and then
asks the model to reason from that evidence. Account identity never depends on
the model remembering a phrase from an earlier message.

## Data sources

- RuneProfile supplies live skills, quests, collection-log totals, diaries, and
  Combat Achievement progress.
- OSRS Wiki pages are retrieved server-side when a question needs current game
  mechanics. Checked sources are shown beneath the answer.
- Player-confirmed facts override visual guesses.
- Conversation history and added memories are stored in browser local storage.
- Screenshot item names remain unverified until RuneLite item IDs are imported.

Before a Vercel deployment intended for use across devices, conversation
history, memories, and screenshots should be migrated to a private database and
object store. Browser local storage is intentionally sufficient for the current
single-device version but will not synchronize to a phone automatically.
