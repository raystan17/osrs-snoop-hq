export type AccountKey = "SnoopNoBank" | "SnoopJoint" | "WildySnoop";

export type AccountProfile = {
  username: AccountKey;
  shortType: string;
  accountType: string;
  portrait: string;
  portraitAlt: string;
  accent: string;
  accentSoft: string;
  totalLevel: number;
  totalXp: number;
  combatLevel: number;
  collections: number;
  quests: number;
  combatTasks: number;
  tagline: string;
  priorities: string[];
  gear?: string[];
  loadoutImage?: string;
};

export type Memory = {
  id: string;
  account: AccountKey | "Both";
  kind: "achievement" | "preference" | "plan" | "reflection" | "fact";
  text: string;
  createdAt: string;
  verified?: boolean;
};

export type JourneyEntry = {
  id: string;
  account: AccountKey | "Both";
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imagePosition?: string;
  details: string[];
};

export const accounts: Record<AccountKey, AccountProfile> = {
  SnoopNoBank: {
    username: "SnoopNoBank",
    shortType: "UIM",
    accountType: "Ultimate Ironman",
    portrait: "/api/media/profile-snoopnobank?v=2",
    portraitAlt: "SnoopNoBank character portrait with light hair",
    accent: "#55c7b7",
    accentSoft: "#173f3c",
    totalLevel: 1401,
    totalXp: 14_580_263,
    combatLevel: 87,
    collections: 111,
    quests: 81,
    combatTasks: 17,
    tagline: "No bank. Every item has a story.",
    priorities: [
      "Protect scarce inventory space",
      "Prefer advice grounded in current storage",
      "Value enjoyable routes over maximum efficiency",
    ],
    gear: [
      "Full obsidian armour",
      "Toktz-xil-ak",
      "Dragon defender",
      "Amulet of power",
      "Fire cape",
      "Blue d'hide vambraces",
      "Climbing boots",
      "Ring of dueling",
      "18 broad arrows equipped",
      "Magic shortbow (i) in inventory",
    ],
    loadoutImage: "/api/media/loadout",
  },
  SnoopJoint: {
    username: "SnoopJoint",
    shortType: "IM",
    accountType: "Ironman",
    portrait: "/api/media/profile-snoopjoint?v=2",
    portraitAlt: "SnoopJoint character portrait",
    accent: "#c9a85f",
    accentSoft: "#42351c",
    totalLevel: 1827,
    totalXp: 65_474_875,
    combatLevel: 113,
    collections: 249,
    quests: 118,
    combatTasks: 98,
    tagline: "The Snoop Journey - Iron-main",
    priorities: [
      "Use banked resources before recommending new grinds",
      "Balance upgrades with varied, enjoyable play",
      "Keep this account's state separate from SnoopNoBank",
    ],
    gear: [
      "Eclipse moon helm",
      "Eclipse moon chestplate",
      "Eclipse moon tassets",
      "Eclipse atlatl",
      "Amulet of glory",
      "Barrows gloves",
      "Dragon boots",
      "Berserker ring (i)",
      "Fire cape",
    ],
    loadoutImage: "/api/media/snoopjoint-bis-ranged",
  },
  WildySnoop: {
    username: "WildySnoop",
    shortType: "PURE",
    accountType: "1 Attack / 1 Defence Obby Maul Pure",
    portrait: "/api/media/profile-wildysnoop?v=2",
    portraitAlt: "WildySnoop character portrait wearing pure gear",
    accent: "#d98255",
    accentSoft: "#46271d",
    totalLevel: 676,
    totalXp: 18_693_307,
    combatLevel: 54,
    collections: 26,
    quests: 18,
    combatTasks: 3,
    tagline: "Built to PK - Sit",
    priorities: [
      "Never gain Attack or Defence levels",
      "Keep Prayer capped at 31 to protect the combat bracket",
      "Evaluate every unlock against restricted-build combat levels",
    ],
    gear: [
      "Slayer's staff melee training weapon",
      "Bearhead",
      "Amulet of fury",
      "Unholy blessing",
      "Varrock armour 1",
      "Unholy book",
      "Fremennik kilt",
      "Spiked manacles",
      "Regen bracelet",
      "Brimstone ring",
      "Untrimmed Fletching skillcape",
    ],
    loadoutImage: "/api/media/wildy-gear?v=2",
  },
};

export const initialMemories: Memory[] = [
  {
    id: "uim-fire-cape",
    account: "SnoopNoBank",
    kind: "achievement",
    text: "Earned the Fire cape with a 5:39:50 Fight Caves completion and completed Denying the Healers.",
    createdAt: "2026-08-03",
    verified: true,
  },
  {
    id: "uim-fishing-story",
    account: "SnoopNoBank",
    kind: "reflection",
    text: "Finished full Angler at Fishing Trawler, then went directly to Tempoross for noted food and reached 81 Fishing.",
    createdAt: "2026-08-03",
    verified: true,
  },
  {
    id: "playstyle-happy-place",
    account: "Both",
    kind: "preference",
    text: "RuneScape is a happy place. Advice should protect the fun and never reduce play to maximum efficiency.",
    createdAt: "2026-08-03",
    verified: true,
  },
  {
    id: "account-separation",
    account: "Both",
    kind: "fact",
    text: "Never transfer items, stats, unlocks, or assumptions between SnoopNoBank, SnoopJoint, and WildySnoop.",
    createdAt: "2026-08-03",
    verified: true,
  },
  {
    id: "wildy-build-rules",
    account: "WildySnoop",
    kind: "fact",
    text: "WildySnoop is a 1 Attack, 1 Defence obby maul pure. Prayer is intentionally capped at 31 to remain in the low combat bracket.",
    createdAt: "2026-08-03",
    verified: true,
  },
  {
    id: "joint-bis-ranged",
    account: "SnoopJoint",
    kind: "achievement",
    text: "Completed the account's BIS ranged setup: full Eclipse moon armour with Eclipse atlatl, glory, Barrows gloves, dragon boots, Berserker ring (i), and Fire cape.",
    createdAt: "2026-08-03",
    verified: true,
  },
  {
    id: "wildy-slayer-staff",
    account: "WildySnoop",
    kind: "achievement",
    text: "Earned 55 Slayer specifically to unlock the Slayer's staff as the account's melee Strength-training weapon.",
    createdAt: "2026-08-03",
    verified: true,
  },
  {
    id: "wildy-finish-line",
    account: "WildySnoop",
    kind: "plan",
    text: "The remaining finish line is 99 Strength, making the Fletching skillcape trimmed for the account's best-in-slot cape.",
    createdAt: "2026-08-03",
    verified: true,
  },
];

export const journey: JourneyEntry[] = [
  {
    id: "fire-cape",
    account: "SnoopNoBank",
    eyebrow: "Hard-earned milestone",
    title: "The Fire Cape",
    description:
      "A five-hour Fight Caves run became the defining early combat achievement for SnoopNoBank.",
    image: "/api/media/fire-cape",
    imagePosition: "center",
    details: ["5:39:50 personal best", "1 TzTok-Jad KC", "Denying the Healers"],
  },
  {
    id: "angler",
    account: "SnoopNoBank",
    eyebrow: "The road to 81 Fishing",
    title: "Trawler to Tempoross",
    description:
      "Full Angler was the starting line. The real purpose was a UIM-friendly supply of noted food from Tempoross.",
    image: "/api/media/angler",
    imagePosition: "center 35%",
    details: ["Full Angler earned", "252 Tempoross KC", "81 Fishing reached"],
  },
  {
    id: "obsidian",
    account: "SnoopNoBank",
    eyebrow: "The next chapter",
    title: "Full obsidian",
    description:
      "Fire cape secured, then the melee setup came together: full obsidian, Toktz-xil-ak and dragon defender.",
    image: "/api/media/obsidian",
    imagePosition: "center",
    details: ["Verified equipment", "Fire cape equipped", "87 combat"],
  },
  {
    id: "both-snoops",
    account: "Both",
    eyebrow: "Three accounts, one happy place",
    title: "The Snoop lineup",
    description:
      "SnoopJoint and SnoopNoBank logged in side by side, with WildySnoop below—a snapshot of three very different journeys kept separate but celebrated together.",
    image: "/api/media/both-accounts",
    imagePosition: "center",
    details: ["SnoopJoint", "SnoopNoBank", "WildySnoop"],
  },
  {
    id: "joint-eclipse-ranged",
    account: "SnoopJoint",
    eyebrow: "Best in slot",
    title: "Full Eclipse ranged",
    description:
      "SnoopJoint's account-specific BIS ranged setup built around full Eclipse moon armour and the Eclipse atlatl.",
    image: "/api/media/snoopjoint-bis-ranged",
    imagePosition: "center",
    details: ["Full Eclipse moon", "Eclipse atlatl", "Player-confirmed BIS"],
  },
  {
    id: "wildy-build",
    account: "WildySnoop",
    eyebrow: "Restricted-build dedication",
    title: "Built around the bracket",
    description:
      "A 1 Attack, 1 Defence obby maul pure shaped deliberately around 31 Prayer, with 55 Slayer earned for a viable melee training weapon.",
    image: "/api/media/wildy-gear?v=2",
    imagePosition: "center",
    details: ["54 combat", "55 Slayer", "99 Fletching", "31 Prayer cap"],
  },
];

export const quickPrompts: Record<AccountKey, string[]> = {
  SnoopNoBank: [
    "What does my current setup say about my playstyle?",
    "Help me choose a fun next goal without wasting inventory space.",
    "Reflect on my road from Angler to the Fire cape.",
  ],
  SnoopJoint: [
    "What stands out about my current progression?",
    "Suggest three varied goals for this account.",
    "Compare my bossing and skilling progress without mixing in my UIM.",
  ],
  WildySnoop: [
    "Explain why this build's restrictions matter before giving advice.",
    "Reflect on getting 55 Slayer at 1 Attack and 1 Defence.",
    "Help me plan the road to 99 Strength without raising my combat bracket unnecessarily.",
  ],
};

export function formatXp(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
