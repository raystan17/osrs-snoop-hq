import { NextResponse } from "next/server";
import { AccountKey, accounts } from "@/lib/data";

function isAccountKey(value: string): value is AccountKey {
  return (
    value === "SnoopNoBank" ||
    value === "SnoopJoint" ||
    value === "WildySnoop"
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ username: string }> },
) {
  const { username } = await context.params;

  if (!isAccountKey(username)) {
    return NextResponse.json({ error: "Unknown Snoop account" }, { status: 404 });
  }

  try {
    const response = await fetch(
      `https://api.runeprofile.com/v1/accounts/${encodeURIComponent(username)}`,
      {
        cache: "no-store",
        headers: { Accept: "application/json" },
      },
    );

    if (!response.ok) {
      throw new Error(`RuneProfile returned ${response.status}`);
    }

    const live = await response.json();
    return NextResponse.json({
      source: "RuneProfile",
      synced: true,
      fetchedAt: new Date().toISOString(),
      ...live,
    });
  } catch {
    const fallback = accounts[username];
    return NextResponse.json({
      source: "Verified snapshot",
      synced: false,
      fetchedAt: new Date().toISOString(),
      username,
      accountType: { name: fallback.accountType },
      skills: {
        totalLevel: fallback.totalLevel,
        totalXp: fallback.totalXp,
      },
      quests: { completed: fallback.quests },
      collectionLog: { obtained: fallback.collections, total: 1712 },
      combatAchievements: [],
    });
  }
}
