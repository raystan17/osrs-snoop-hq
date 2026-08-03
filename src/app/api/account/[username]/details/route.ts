import { NextResponse } from "next/server";
import { AccountKey } from "@/lib/data";

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
    const base = `https://api.runeprofile.com/v1/accounts/${encodeURIComponent(username)}`;
    const [skillsResponse, collectionResponse] = await Promise.all([
      fetch(`${base}/skills`, { cache: "no-store" }),
      fetch(`${base}/collection-log`, { cache: "no-store" }),
    ]);

    if (!skillsResponse.ok || !collectionResponse.ok) {
      throw new Error("RuneProfile details unavailable");
    }

    const skills = await skillsResponse.json();
    const collection = await collectionResponse.json();

    return NextResponse.json({
      skills: skills.data ?? [],
      collectionLog: {
        obtained: collection.obtained ?? 0,
        total: collection.total ?? 0,
        tabs: Array.isArray(collection.tabs)
          ? collection.tabs.map(
              (tab: { name: string; obtained: number; total: number }) => ({
                name: tab.name,
                obtained: tab.obtained,
                total: tab.total,
              }),
            )
          : [],
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Detailed RuneProfile data is temporarily unavailable" },
      { status: 502 },
    );
  }
}
