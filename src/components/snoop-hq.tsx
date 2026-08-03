"use client";

import Image from "next/image";
import {
  ArrowUp,
  BookOpen,
  Check,
  ChevronRight,
  CircleDot,
  Database,
  ExternalLink,
  Feather,
  LoaderCircle,
  Menu,
  MessageCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AccountKey,
  Memory,
  accounts,
  formatXp,
  initialMemories,
  journey,
  quickPrompts,
} from "@/lib/data";

type View = "companion" | "journey" | "account";
type DetailView = "skills" | "collection" | "progress";
type MessageGrounding = {
  account: AccountKey;
  researched: boolean;
  checkedAt: string;
  sources: Array<{
    title: string;
    url: string;
    kind: "account" | "wiki";
    checkedAt: string;
  }>;
  calculations: Array<{ label: string; detail: string }>;
};
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: "ai" | "ai-researched" | "grounded-local";
  grounding?: MessageGrounding;
};

type LiveProfile = {
  source?: string;
  synced?: boolean;
  fetchedAt?: string;
  skills?: { totalLevel?: number; totalXp?: number };
  quests?: { completed?: number };
  collectionLog?: { obtained?: number; total?: number };
  combatAchievements?: Array<{
    name?: string;
    completed?: number;
    total?: number;
  }>;
};

type AccountDetails = {
  skills: Array<{
    name: string;
    xp: number;
    level: number;
    xpToNextLevel: number;
  }>;
  collectionLog: {
    obtained: number;
    total: number;
    tabs: Array<{ name: string; obtained: number; total: number }>;
  };
};

const welcomeMessages: Record<AccountKey, ChatMessage> = {
  SnoopNoBank: {
    id: "welcome-uim",
    role: "assistant",
    content:
      "I’m with SnoopNoBank. I have the Fire cape journey, full obsidian setup, current looting-bag snapshot, and the reason behind the push to 81 Fishing. What are you thinking about?",
  },
  SnoopJoint: {
    id: "welcome-iron",
    role: "assistant",
    content:
      "I’m with SnoopJoint. I’ll keep every fact separate from the UIM and ground advice in this account’s progression. Where do you want to begin?",
  },
  WildySnoop: {
    id: "welcome-pure",
    role: "assistant",
    content:
      "I’m with WildySnoop. I have the 1 Attack, 1 Defence build locked in, including the 31 Prayer cap, 55 Slayer staff route, and the road to 99 Strength. What are you thinking about?",
  },
};

const navItems: Array<{
  id: View;
  label: string;
  icon: typeof MessageCircle;
}> = [
  { id: "companion", label: "Companion", icon: MessageCircle },
  { id: "journey", label: "Journey", icon: Feather },
  { id: "account", label: "Account", icon: Database },
];

function memoryLabel(kind: Memory["kind"]) {
  return {
    achievement: "Achievement",
    preference: "Preference",
    plan: "Plan",
    reflection: "Reflection",
    fact: "Verified fact",
  }[kind];
}

function Stat({
  label,
  value,
  quiet,
  onClick,
}: {
  label: string;
  value: string | number;
  quiet?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span>{label}</span>
      <strong>{value}</strong>
      {onClick && <small>View details</small>}
    </>
  );

  if (onClick) {
    return (
      <button className="stat stat-button" onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={quiet ? "stat stat-quiet" : "stat"}>{content}</div>;
}

export default function SnoopHQ() {
  const [account, setAccount] = useState<AccountKey>("SnoopNoBank");
  const [view, setView] = useState<View>("companion");
  const [mobileNav, setMobileNav] = useState(false);
  const [messages, setMessages] = useState<Record<AccountKey, ChatMessage[]>>({
    SnoopNoBank: [welcomeMessages.SnoopNoBank],
    SnoopJoint: [welcomeMessages.SnoopJoint],
    WildySnoop: [welcomeMessages.WildySnoop],
  });
  const [memories, setMemories] = useState<Memory[]>(initialMemories);
  const [liveProfiles, setLiveProfiles] = useState<
    Partial<Record<AccountKey, LiveProfile>>
  >({});
  const [syncing, setSyncing] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [memoryDraft, setMemoryDraft] = useState("");
  const [showMemoryForm, setShowMemoryForm] = useState(false);
  const [detailView, setDetailView] = useState<DetailView | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsByAccount, setDetailsByAccount] = useState<
    Partial<Record<AccountKey, AccountDetails>>
  >({});
  const threadEnd = useRef<HTMLDivElement>(null);

  const profile = accounts[account];
  const live = liveProfiles[account];
  const details = detailsByAccount[account];
  const currentMessages = messages[account];
  const accountMemories = useMemo(
    () =>
      memories.filter(
        (memory) => memory.account === account || memory.account === "Both",
      ),
    [account, memories],
  );

  const liveCombatTasks = live?.combatAchievements?.reduce(
    (total, tier) => total + (tier.completed ?? 0),
    0,
  );

  async function syncAccount(target: AccountKey = account) {
    setSyncing(true);
    try {
      const response = await fetch(`/api/account/${target}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Profile sync failed");
      const data = (await response.json()) as LiveProfile;
      setLiveProfiles((current) => ({ ...current, [target]: data }));
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem("snoop-hq-messages");
      const savedMemories = localStorage.getItem("snoop-hq-memories");
      const parsedMessages = savedMessages ? JSON.parse(savedMessages) : null;
      const parsedMemories = savedMemories ? JSON.parse(savedMemories) : null;
      const restoreTimer = window.setTimeout(() => {
        if (parsedMessages) {
          setMessages({
            SnoopNoBank:
              parsedMessages.SnoopNoBank ?? [welcomeMessages.SnoopNoBank],
            SnoopJoint:
              parsedMessages.SnoopJoint ?? [welcomeMessages.SnoopJoint],
            WildySnoop:
              parsedMessages.WildySnoop ?? [welcomeMessages.WildySnoop],
          });
        }
        if (parsedMemories) {
          const seededIds = new Set(initialMemories.map((memory) => memory.id));
          setMemories([
            ...initialMemories,
            ...parsedMemories.filter(
              (memory: Memory) => !seededIds.has(memory.id),
            ),
          ]);
        }
        void syncAccount("SnoopNoBank");
        void syncAccount("SnoopJoint");
        void syncAccount("WildySnoop");
      }, 0);
      return () => window.clearTimeout(restoreTimer);
    } catch {
      // A malformed local cache should never prevent the HQ from opening.
    }
    // Initial sync is intentionally run once for both accounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem("snoop-hq-messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("snoop-hq-memories", JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    threadEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, sending]);

  async function sendMessage(event?: FormEvent, suggested?: string) {
    event?.preventDefault();
    const content = (suggested ?? input).trim();
    if (!content || sending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    const history = currentMessages.map(({ role, content: messageContent }) => ({
      role,
      content: messageContent,
    }));

    setMessages((current) => ({
      ...current,
      [account]: [...current[account], userMessage],
    }));
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account,
          message: content,
          history,
          memories,
          liveData: live,
        }),
      });
      if (!response.ok) throw new Error("Companion unavailable");
      const data = (await response.json()) as {
        reply: string;
        mode: "ai" | "ai-researched" | "grounded-local";
        grounding?: MessageGrounding;
      };
      setMessages((current) => ({
        ...current,
        [account]: [
          ...current[account],
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.reply,
            mode: data.mode,
            grounding: data.grounding,
          },
        ],
      }));
    } catch {
      setMessages((current) => ({
        ...current,
        [account]: [
          ...current[account],
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "I couldn’t reach the companion service. Your account state and messages are still safe locally—try that again in a moment.",
            mode: "grounded-local",
          },
        ],
      }));
    } finally {
      setSending(false);
    }
  }

  function addMemory(event: FormEvent) {
    event.preventDefault();
    const text = memoryDraft.trim();
    if (!text) return;
    setMemories((current) => [
      {
        id: crypto.randomUUID(),
        account,
        kind: "reflection",
        text,
        createdAt: new Date().toISOString().slice(0, 10),
      },
      ...current,
    ]);
    setMemoryDraft("");
    setShowMemoryForm(false);
  }

  async function openDetails(nextView: DetailView) {
    setDetailView(nextView);
    if (nextView === "progress" || detailsByAccount[account]) return;

    setDetailsLoading(true);
    try {
      const response = await fetch(`/api/account/${account}/details`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Details unavailable");
      const data = (await response.json()) as AccountDetails;
      setDetailsByAccount((current) => ({ ...current, [account]: data }));
    } catch {
      // The modal provides a friendly unavailable state below.
    } finally {
      setDetailsLoading(false);
    }
  }

  function changeAccount(next: AccountKey) {
    setAccount(next);
    setDetailView(null);
    setMobileNav(false);
  }

  const sidebar = (
    <>
      <div className="brand">
        <div className="brand-mark">
          <BookOpen size={17} />
        </div>
        <div>
          <strong>Snoop HQ</strong>
          <span>Gielinor, remembered</span>
        </div>
      </div>

      <nav className="primary-nav" aria-label="Main navigation">
        <p className="nav-caption">Your space</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={view === item.id ? "nav-button active" : "nav-button"}
              onClick={() => {
                setView(item.id);
                setMobileNav(false);
              }}
            >
              <Icon size={17} />
              {item.label}
              {view === item.id && <ChevronRight size={15} />}
            </button>
          );
        })}
      </nav>

      <div className="account-switcher">
        <p className="nav-caption">Accounts</p>
        {(Object.keys(accounts) as AccountKey[]).map((key) => {
          const item = accounts[key];
          return (
            <button
              key={key}
              className={key === account ? "account-chip active" : "account-chip"}
              onClick={() => changeAccount(key)}
              style={{ "--account-accent": item.accent } as React.CSSProperties}
            >
              <span className="account-portrait">
                <Image
                  src={item.portrait}
                  alt={item.portraitAlt}
                  fill
                  unoptimized
                  sizes="32px"
                />
              </span>
              <span>
                <strong>{item.username}</strong>
                <small>{item.accountType}</small>
              </span>
              {key === account && <Check size={15} />}
            </button>
          );
        })}
      </div>

      <div className="source-card">
        <span className="source-icon">
          <ShieldCheck size={16} />
        </span>
        <div>
          <strong>{live?.synced ? "RuneProfile connected" : "Verified snapshot"}</strong>
          <span>
            {live?.fetchedAt
              ? `Checked ${new Date(live.fetchedAt).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}`
              : "Checking account facts…"}
          </span>
        </div>
        <button
          aria-label="Refresh RuneProfile"
          onClick={() => void syncAccount()}
          disabled={syncing}
        >
          <RefreshCw className={syncing ? "spin" : ""} size={15} />
        </button>
      </div>
    </>
  );

  return (
    <div
      className="app-shell"
      style={
        {
          "--accent": profile.accent,
          "--accent-soft": profile.accentSoft,
        } as React.CSSProperties
      }
    >
      <aside className="sidebar">{sidebar}</aside>

      {mobileNav && (
        <div className="mobile-drawer">
          <button
            className="drawer-close"
            onClick={() => setMobileNav(false)}
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
          {sidebar}
        </div>
      )}

      <main className="main">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="topbar-identity">
            <span className="topbar-portrait">
              <Image
                src={profile.portrait}
                alt={profile.portraitAlt}
                fill
                priority
                unoptimized
                sizes="48px"
              />
            </span>
            <div>
              <p>{profile.accountType}</p>
              <h1>{profile.username}</h1>
            </div>
          </div>
          <div className="topbar-status">
            <span className="live-dot" />
            {live?.synced ? "Live facts" : "Saved facts"}
          </div>
        </header>

        {view === "companion" && (
          <div className="companion-layout">
            <section className="conversation">
              <div className="conversation-heading">
                <div>
                  <span className="eyebrow">
                    <CircleDot size={13} />
                    Account-locked conversation
                  </span>
                  <h2>What&apos;s on your mind?</h2>
                </div>
                <div className="account-pill">{profile.shortType}</div>
              </div>

              <div className="thread">
                {currentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.role}`}
                  >
                    {message.role === "assistant" && (
                      <div className="assistant-avatar">
                        <BookOpen size={15} />
                      </div>
                    )}
                    <div className="message-body">
                      <p>{message.content}</p>
                      {message.role === "assistant" && message.mode && (
                        <span className="message-mode">
                          {message.mode === "ai-researched"
                            ? "AI · live account + current Wiki"
                            : message.mode === "ai"
                              ? "AI · verified account context"
                              : "Local · verified account context"}
                        </span>
                      )}
                      {message.role === "assistant" &&
                        message.grounding?.sources.length ? (
                          <div className="message-grounding">
                            <span>
                              <ShieldCheck size={11} />
                              {message.grounding.sources.length} checked{" "}
                              {message.grounding.sources.length === 1
                                ? "source"
                                : "sources"}
                              {message.grounding.calculations.length
                                ? ` · ${message.grounding.calculations.length} exact calculation`
                                : ""}
                            </span>
                            <div>
                              {message.grounding.sources.map((source) => (
                                <a
                                  href={source.url}
                                  key={`${source.kind}-${source.url}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {source.title}
                                  <ExternalLink size={9} />
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : null}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="message assistant">
                    <div className="assistant-avatar">
                      <BookOpen size={15} />
                    </div>
                    <div className="thinking">
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                )}
                <div ref={threadEnd} />
              </div>

              {currentMessages.length === 1 && (
                <div className="quick-prompts">
                  {quickPrompts[account].map((prompt) => (
                    <button key={prompt} onClick={() => void sendMessage(undefined, prompt)}>
                      <span>{prompt}</span>
                      <ArrowUp size={14} />
                    </button>
                  ))}
                </div>
              )}

              <form className="composer" onSubmit={(event) => void sendMessage(event)}>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder={`Ask about ${profile.username}…`}
                  rows={2}
                />
                <div className="composer-footer">
                  <span>
                    <ShieldCheck size={14} />
                    Uses this account only
                  </span>
                  <button disabled={!input.trim() || sending} aria-label="Send message">
                    {sending ? (
                      <LoaderCircle className="spin" size={18} />
                    ) : (
                      <ArrowUp size={18} />
                    )}
                  </button>
                </div>
              </form>
            </section>

            <aside className="context-panel">
              <div className="context-block identity-block">
                <span className="eyebrow">Current context</span>
                <h3>{profile.tagline}</h3>
                <div className="stat-grid">
                  <Stat
                    label="Total"
                    value={live?.skills?.totalLevel ?? profile.totalLevel}
                    onClick={() => void openDetails("skills")}
                  />
                  <Stat
                    label="XP"
                    value={formatXp(live?.skills?.totalXp ?? profile.totalXp)}
                    onClick={() => void openDetails("skills")}
                  />
                  <Stat
                    label="Collection"
                    value={live?.collectionLog?.obtained ?? profile.collections}
                    onClick={() => void openDetails("collection")}
                  />
                  <Stat
                    label="Combat tasks"
                    value={liveCombatTasks || profile.combatTasks}
                    onClick={() => void openDetails("progress")}
                  />
                </div>
              </div>

              <div className="context-block">
                <div className="block-title">
                  <span>
                    <BookOpen size={15} />
                    Remembered
                  </span>
                  <button
                    onClick={() => setShowMemoryForm((current) => !current)}
                    aria-label="Add memory"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {showMemoryForm && (
                  <form className="memory-form" onSubmit={addMemory}>
                    <textarea
                      autoFocus
                      value={memoryDraft}
                      onChange={(event) => setMemoryDraft(event.target.value)}
                      placeholder="Something worth remembering…"
                      rows={3}
                    />
                    <button>Save memory</button>
                  </form>
                )}
                <div className="memory-list">
                  {accountMemories.slice(0, 4).map((memory) => (
                    <div className="memory-item" key={memory.id}>
                      <span className={`memory-kind ${memory.kind}`} />
                      <div>
                        <small>{memoryLabel(memory.kind)}</small>
                        <p>{memory.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="truth-card">
                <ShieldCheck size={18} />
                <div>
                  <strong>No silent guessing</strong>
                  <p>
                    Missing item IDs, storage, or unlocks are asked for—not invented.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}

        {view === "journey" && (
          <section className="page-section">
            <div className="page-heading">
              <span className="eyebrow">
                <Feather size={13} />
                More than a progress log
              </span>
              <h2>The story so far</h2>
            </div>

            <div className="journey-grid">
              {journey
                .filter(
                  (entry) => entry.account === account || entry.account === "Both",
                )
                .sort(
                  (first, second) =>
                    Number(first.account === "Both") -
                    Number(second.account === "Both"),
                )
                .map((entry, index) => (
                  <article
                    className={index === 0 ? "journey-card feature" : "journey-card"}
                    key={entry.id}
                  >
                    <div className="journey-image">
                      <Image
                        src={entry.image}
                        alt={entry.title}
                        fill
                        unoptimized
                        sizes={index === 0 ? "(max-width: 900px) 100vw, 60vw" : "40vw"}
                        style={{ objectPosition: entry.imagePosition }}
                      />
                      <div className="image-shade" />
                      <span>{entry.eyebrow}</span>
                    </div>
                    <div className="journey-copy">
                      <h3>{entry.title}</h3>
                      <p>{entry.description}</p>
                      <div className="detail-row">
                        {entry.details.map((detail) => (
                          <span key={detail}>{detail}</span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}

            </div>
          </section>
        )}

        {view === "account" && (
          <section className="page-section">
            <div className="page-heading account-heading">
              <div>
                <span className="eyebrow">
                  <Database size={13} />
                  Verified account state
                </span>
                <h2>{profile.username}</h2>
                <p>
                  Live public progression plus player-confirmed private context.
                </p>
              </div>
              <button className="sync-button" onClick={() => void syncAccount()}>
                <RefreshCw className={syncing ? "spin" : ""} size={15} />
                Sync now
              </button>
            </div>

            <div className="account-dashboard">
              <div className="account-overview">
                <div className="overview-title">
                  <span className="account-portrait large">
                    <Image
                      src={profile.portrait}
                      alt={profile.portraitAlt}
                      fill
                      priority
                      unoptimized
                      sizes="72px"
                    />
                  </span>
                  <div>
                    <h3>{profile.username}</h3>
                    <p>
                      {profile.accountType} · {live?.source ?? "Verified snapshot"}
                    </p>
                  </div>
                </div>
                <div className="overview-stats">
                  <Stat
                    label="Total level"
                    value={live?.skills?.totalLevel ?? profile.totalLevel}
                    onClick={() => void openDetails("skills")}
                  />
                  <Stat
                    label="Total XP"
                    value={(live?.skills?.totalXp ?? profile.totalXp).toLocaleString()}
                    onClick={() => void openDetails("skills")}
                  />
                  <Stat
                    label="Combat"
                    value={profile.combatLevel}
                    onClick={() => void openDetails("skills")}
                  />
                  <Stat
                    label="Quests"
                    value={live?.quests?.completed ?? profile.quests}
                    onClick={() => void openDetails("progress")}
                  />
                  <Stat
                    label="Collection log"
                    value={`${live?.collectionLog?.obtained ?? profile.collections}/${
                      live?.collectionLog?.total ?? 1712
                    }`}
                    onClick={() => void openDetails("collection")}
                  />
                  <Stat
                    label="Combat tasks"
                    value={liveCombatTasks || profile.combatTasks}
                    onClick={() => void openDetails("progress")}
                  />
                </div>
              </div>

              <div className="principles-card">
                <span className="eyebrow">
                  <Target size={13} />
                  Advice principles
                </span>
                <ul>
                  {profile.priorities.map((priority) => (
                    <li key={priority}>
                      <Check size={14} />
                      {priority}
                    </li>
                  ))}
                </ul>
              </div>

              {profile.gear && (
                <div className="loadout-card">
                  <div className="loadout-image">
                    <Image
                      src={profile.loadoutImage ?? "/api/media/loadout"}
                      alt={`${profile.username} verified loadout`}
                      fill
                      unoptimized
                      sizes="(max-width: 900px) 100vw, 45vw"
                    />
                  </div>
                  <div className="loadout-copy">
                    <span className="eyebrow">Player-confirmed loadout</span>
                    <h3>Current equipment</h3>
                    <div className="gear-list">
                      {profile.gear.map((item) => (
                        <span key={item}>
                          <Check size={13} />
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {account === "SnoopNoBank" && (
                <div className="storage-card">
                    <div className="storage-copy">
                      <span className="eyebrow">Dated private context</span>
                      <h3>Looting bag snapshot</h3>
                      <p>
                        August 3, 2026 · approximately 25 occupied slots ·
                        5,959,019 coin displayed value.
                      </p>
                      <div className="verification-note">
                        <ShieldCheck size={15} />
                        Item names remain unverified until canonical RuneLite IDs
                        are available.
                      </div>
                    </div>
                    <div className="storage-image">
                      <Image
                        src="/api/media/looting-bag?v=2"
                        alt="SnoopNoBank looting bag snapshot"
                        fill
                        unoptimized
                        sizes="300px"
                      />
                    </div>
                  </div>
              )}
            </div>
          </section>
        )}
      </main>

      {detailView && (
        <div
          className="detail-backdrop"
          role="presentation"
          onMouseDown={() => setDetailView(null)}
        >
          <section
            className="detail-window"
            role="dialog"
            aria-modal="true"
            aria-label={`${profile.username} account details`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="detail-titlebar">
              <div>
                <span>{profile.username}</span>
                <strong>
                  {detailView === "skills"
                    ? "Skill levels & XP"
                    : detailView === "collection"
                      ? "Collection log"
                      : "Account progress"}
                </strong>
              </div>
              <button onClick={() => setDetailView(null)} aria-label="Close details">
                <X size={17} />
              </button>
            </header>

            <div className="detail-content">
              {detailsLoading && (
                <div className="detail-loading">
                  <LoaderCircle className="spin" size={20} />
                  Reading RuneProfile…
                </div>
              )}

              {!detailsLoading && detailView === "skills" && details && (
                <div className="skill-details">
                  {details.skills.map((skill) => (
                    <div className="skill-row" key={skill.name}>
                      <strong>{skill.name}</strong>
                      <span>Level {skill.level}</span>
                      <small>{skill.xp.toLocaleString()} XP</small>
                    </div>
                  ))}
                </div>
              )}

              {!detailsLoading && detailView === "collection" && details && (
                <>
                  <div className="detail-summary">
                    <span>Collections logged</span>
                    <strong>
                      {details.collectionLog.obtained}/{details.collectionLog.total}
                    </strong>
                  </div>
                  <div className="collection-details">
                    {details.collectionLog.tabs.map((tab) => (
                      <div className="collection-row" key={tab.name}>
                        <span>{tab.name}</span>
                        <strong>
                          {tab.obtained}/{tab.total}
                        </strong>
                        <i
                          style={{
                            width: `${Math.max(
                              2,
                              (tab.obtained / Math.max(1, tab.total)) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!detailsLoading && detailView === "progress" && (
                <div className="progress-details">
                  <div className="detail-summary">
                    <span>Quests completed</span>
                    <strong>{live?.quests?.completed ?? profile.quests}/201</strong>
                  </div>
                  <h4>Combat Achievements</h4>
                  {(live?.combatAchievements?.length
                    ? live.combatAchievements
                    : [{ name: "Completed tasks", completed: profile.combatTasks }]
                  ).map((tier) => (
                    <div className="progress-row" key={tier.name}>
                      <span>{tier.name}</span>
                      <strong>
                        {tier.completed ?? 0}
                        {tier.total ? `/${tier.total}` : ""}
                      </strong>
                    </div>
                  ))}
                </div>
              )}

              {!detailsLoading &&
                detailView !== "progress" &&
                !details && (
                  <div className="detail-loading">
                    Detailed RuneProfile data is temporarily unavailable.
                  </div>
                )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
