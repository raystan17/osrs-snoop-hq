import "server-only";

import { AccountKey, accounts } from "@/lib/data";

export type GroundingSource = {
  title: string;
  url: string;
  kind: "account" | "wiki";
  checkedAt: string;
};

export type GroundingCalculation = {
  label: string;
  detail: string;
};

export type GroundingMeta = {
  account: AccountKey;
  researched: boolean;
  checkedAt: string;
  sources: GroundingSource[];
  calculations: GroundingCalculation[];
};

type RuneProfileSkill = {
  name: string;
  xp: number;
  level: number;
  virtualLevel?: number;
  xpToNextLevel?: number;
};

type RuneProfileQuest = {
  name: string;
  state: "finished" | "in_progress" | "not_started";
  type?: string;
};

type WikiPage = {
  title: string;
  extract: string;
  fullurl: string;
  touched?: string;
  index?: number;
};

type ResearchBundle = {
  promptContext: string;
  grounding: GroundingMeta;
};

const SKILLS = [
  "Attack",
  "Hitpoints",
  "Mining",
  "Strength",
  "Agility",
  "Smithing",
  "Defence",
  "Herblore",
  "Fishing",
  "Ranged",
  "Thieving",
  "Cooking",
  "Prayer",
  "Crafting",
  "Firemaking",
  "Magic",
  "Fletching",
  "Woodcutting",
  "Runecraft",
  "Slayer",
  "Farming",
  "Construction",
  "Hunter",
  "Sailing",
] as const;

const RESEARCH_CUES =
  /\b(best|better|how|method|option|route|should|train|training|grind|gear|setup|upgrade|quest|boss|kill|fight|drop|rate|xp|level|lvl|profit|cost|gp|inventory|storage|death|risk|pk|pking|build|combat|unlock|worth)\b/i;

const CASUAL_ONLY =
  /^(hi|hey|hello|thanks|thank you|okay|ok|cool|nice|perfect|what do you remember)\W*$/i;

function xpForLevel(level: number) {
  let points = 0;
  for (let current = 1; current < level; current += 1) {
    points += Math.floor(current + 300 * 2 ** (current / 7));
  }
  return Math.floor(points / 4);
}

function detectSkill(message: string) {
  const lower = message.toLowerCase();
  return SKILLS.find((skill) => {
    const name = skill.toLowerCase();
    if (lower.includes(name)) return true;
    if (skill === "Runecraft" && /\b(rc|runecrafting)\b/i.test(message)) return true;
    if (skill === "Hitpoints" && /\b(hp)\b/i.test(message)) return true;
    if (skill === "Defence" && /\bdef\b/i.test(message)) return true;
    return false;
  });
}

function detectTargetLevel(message: string) {
  const patterns = [
    /\b(?:to|until|reach|get|goal(?:\s+is|\s+of)?|going\s+for)\s+(?:level|lvl)?\s*(\d{1,2})\b/i,
    /\b(?:level|lvl)\s*(\d{1,2})\b/i,
    /\b(\d{1,2})\s+(?:attack|defence|strength|hitpoints|prayer|ranged|magic|runecraft|smithing|mining|fishing|cooking|woodcutting|firemaking|agility|herblore|thieving|crafting|fletching|slayer|farming|construction|hunter|sailing)\b/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    const level = match ? Number(match[1]) : Number.NaN;
    if (Number.isInteger(level) && level >= 2 && level <= 99) return level;
  }
  return null;
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}…`;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "SnoopHQ/1.0 (private OSRS companion)",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function wikiApiUrl(parameters: Record<string, string>) {
  const search = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    redirects: "1",
    prop: "extracts|info",
    explaintext: "1",
    inprop: "url",
    ...parameters,
  });
  return `https://oldschool.runescape.wiki/api.php?${search.toString()}`;
}

async function fetchWikiPagesByTitle(titles: string[]) {
  if (!titles.length) return [];
  const results = await Promise.all(
    titles.map((title) =>
      fetchJson<{
        query?: { pages?: Array<WikiPage & { missing?: boolean }> };
      }>(wikiApiUrl({ titles: title })),
    ),
  );

  return results
    .flatMap((data) => data?.query?.pages ?? [])
    .filter((page) => !page.missing && page.extract && page.fullurl)
    .map((page) => ({
      ...page,
      extract: truncate(compactWhitespace(page.extract), 28_000),
    }));
}

async function searchWiki(query: string) {
  const data = await fetchJson<{
    query?: { pages?: Array<WikiPage & { missing?: boolean }> };
  }>(
    wikiApiUrl({
      generator: "search",
      gsrsearch: query,
      gsrnamespace: "0",
      gsrlimit: "4",
      exintro: "1",
    }),
  );

  return (data?.query?.pages ?? [])
    .filter((page) => !page.missing && page.extract && page.fullurl)
    .sort((first, second) => (first.index ?? 99) - (second.index ?? 99))
    .map((page) => ({
      ...page,
      extract: compactWhitespace(page.extract),
    }));
}

function guideTitles(account: AccountKey, skill?: string) {
  if (!skill) return [];
  if (account === "SnoopNoBank") {
    return [`Ultimate Ironman Guide/${skill}`, `Pay-to-play ${skill} training`];
  }
  if (account === "SnoopJoint") {
    return [`Ironman Guide/${skill}`, `Pay-to-play ${skill} training`];
  }
  return [`Pay-to-play ${skill} training`];
}

function buildWikiSearch(account: AccountKey, message: string, skill?: string) {
  const accountQualifier =
    account === "SnoopNoBank"
      ? "Ultimate Ironman"
      : account === "SnoopJoint"
        ? "Ironman"
        : "1 defence pure obby maul pure";
  const cleaned = compactWhitespace(message.replace(/[^\w\s'-]/g, " "));
  return truncate(`${accountQualifier} ${skill ?? ""} ${cleaned}`, 220);
}

function shouldResearch(message: string) {
  const trimmed = message.trim();
  if (!trimmed || CASUAL_ONLY.test(trimmed)) return false;
  return RESEARCH_CUES.test(trimmed) || trimmed.includes("?");
}

function dedupeWikiPages(pages: WikiPage[]) {
  const seen = new Set<string>();
  return pages.filter((page) => {
    if (seen.has(page.fullurl)) return false;
    seen.add(page.fullurl);
    return true;
  });
}

function relevantQuestStates(
  quests: RuneProfileQuest[],
  message: string,
  pages: WikiPage[],
) {
  const evidence = `${message} ${pages.map((page) => page.extract).join(" ")}`.toLowerCase();
  return quests
    .filter((quest) => evidence.includes(quest.name.toLowerCase()))
    .slice(0, 40)
    .map((quest) => ({ name: quest.name, state: quest.state }));
}

export async function researchQuestion(
  account: AccountKey,
  message: string,
  clientLiveData?: unknown,
): Promise<ResearchBundle> {
  const checkedAt = new Date().toISOString();
  const base = `https://api.runeprofile.com/v1/accounts/${encodeURIComponent(account)}`;
  const researchRequested = shouldResearch(message);
  const skill = detectSkill(message);
  const targetLevel = skill ? detectTargetLevel(message) : null;

  const [summaryResult, skillsResult, questsResult, directWiki, searchedWiki] =
    await Promise.all([
      fetchJson<Record<string, unknown>>(base),
      fetchJson<{ data?: RuneProfileSkill[] }>(`${base}/skills`),
      fetchJson<{ data?: RuneProfileQuest[] }>(`${base}/quests`),
      researchRequested
        ? fetchWikiPagesByTitle(guideTitles(account, skill))
        : Promise.resolve([]),
      researchRequested
        ? searchWiki(buildWikiSearch(account, message, skill))
        : Promise.resolve([]),
    ]);

  const skills = Array.isArray(skillsResult?.data) ? skillsResult.data : [];
  const quests = Array.isArray(questsResult?.data) ? questsResult.data : [];
  const wikiPages =
    account === "WildySnoop"
      ? dedupeWikiPages([...searchedWiki, ...directWiki]).slice(0, 4)
      : directWiki.length
        ? dedupeWikiPages(directWiki).slice(0, 3)
        : dedupeWikiPages(searchedWiki).slice(0, 4);
  const matchedQuests = relevantQuestStates(quests, message, wikiPages);
  const selectedSkill = skill
    ? skills.find((entry) => entry.name.toLowerCase() === skill.toLowerCase())
    : undefined;

  const calculations: GroundingCalculation[] = [];
  if (
    selectedSkill &&
    targetLevel &&
    targetLevel > selectedSkill.level &&
    targetLevel <= 99
  ) {
    const targetXp = xpForLevel(targetLevel);
    const remainingXp = Math.max(0, targetXp - selectedSkill.xp);
    calculations.push({
      label: `${skill} ${selectedSkill.level} → ${targetLevel}`,
      detail: `${selectedSkill.xp.toLocaleString()} current XP; ${targetXp.toLocaleString()} target XP; ${remainingXp.toLocaleString()} XP remaining.`,
    });
  }

  const accountSourceAvailable = Boolean(summaryResult || skills.length || quests.length);
  const sources: GroundingSource[] = [
    ...(accountSourceAvailable
      ? [
          {
            title: `${account} live RuneProfile`,
            url: base,
            kind: "account" as const,
            checkedAt,
          },
        ]
      : []),
    ...wikiPages.map((page) => ({
      title: page.title,
      url: page.fullurl,
      kind: "wiki" as const,
      checkedAt: page.touched ?? checkedAt,
    })),
  ];

  const promptContext = JSON.stringify(
    {
      evidenceTimestamp: checkedAt,
      account: {
        lockedIdentity: account,
        permanentProfile: accounts[account],
        liveSummary: summaryResult ?? clientLiveData ?? null,
        liveSkills: skills,
        relevantQuestStates: matchedQuests,
        questFeedAvailable: quests.length > 0,
      },
      deterministicCalculations: calculations,
      currentWikiResearch: wikiPages.map((page) => ({
        title: page.title,
        url: page.fullurl,
        lastUpdated: page.touched ?? null,
        extract: page.extract,
      })),
      evidenceNotes: [
        "RuneProfile fields are live public account data.",
        "Player-confirmed profile facts and memories override visual inference.",
        "Wiki extracts are current research, not player-specific proof.",
        "Only quests named in relevantQuestStates have been matched to this question; absence from that list proves nothing about another quest.",
      ],
    },
    null,
    2,
  );

  return {
    promptContext,
    grounding: {
      account,
      researched: wikiPages.length > 0,
      checkedAt,
      sources,
      calculations,
    },
  };
}
