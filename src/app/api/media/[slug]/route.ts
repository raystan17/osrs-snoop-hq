import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const assetNames: Record<string, string> = {
  "fire-cape":
    "c__Users_GUEST1_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_UIM_fire_cape_5.6_hours-d2b8fd19-e3ef-4e9f-b396-27df10f987fd.png",
  angler:
    "c__Users_GUEST1_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_UIM_background_pic_snoop-27c35ad1-85a5-42e7-9097-20ac9a87de3d.png",
  obsidian:
    "c__Users_GUEST1_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_Capture32421343-7aada7d9-effa-44c4-acc9-89662b697b94.png",
  "both-accounts":
    "c__Users_GUEST1_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_Snoop_accs_2026-0eb3fffa-1335-460f-bb38-931744726485.png",
  "wildy-gear":
    "c__Users_GUEST1_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_wildygear-9e524b50-6da0-4486-bdf8-8d86b7c1ed42.png",
  "snoopjoint-bis-ranged":
    "c__Users_GUEST1_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_snoopjoint_eclipse2-501c3fc6-b4f8-45d1-a48f-7d6f961ffef8.png",
  stats:
    "c__Users_GUEST1_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_UIM_firecape_stats_2nd_try-a84c0aee-26fe-4692-a2c8-2fe7dd726c17.png",
  "looting-bag":
    "c__Users_GUEST1_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_looting_bag_aug_2026_uim-007cb8e1-501f-4cc2-a71f-65d7730f7f64.png",
  loadout:
    "c__Users_GUEST1_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_Capture32421343-7aada7d9-effa-44c4-acc9-89662b697b94.png",
  "profile-snoopjoint":
    "c__Users_GUEST1_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_snoopjoint-bb3d5e2e-9346-4feb-b6df-03c54f943f5c.png",
  "profile-snoopnobank":
    "c__Users_GUEST1_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_snoopnobankks-a46b77b0-a1a0-4c71-b92c-05aebe0fdb24.png",
  "profile-wildysnoop":
    "c__Users_GUEST1_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_WildySnoop-3d930caa-804a-4cd1-b383-a7f75f69fe7e.png",
};

const fallbackLabels: Record<string, [string, string]> = {
  "fire-cape": ["THE FIRE CAPE", "5:39:50 · SNOOPNOBANK"],
  angler: ["TRAWLER TO TEMPOROSS", "FULL ANGLER · 81 FISHING"],
  obsidian: ["FULL OBSIDIAN", "THE NEXT CHAPTER"],
  "both-accounts": ["THE SNOOP LINEUP", "THREE ACCOUNTS · ONE JOURNEY"],
  "wildy-gear": ["WILDYSNOOP", "1 ATTACK · 1 DEFENCE · OBBY PURE"],
  "snoopjoint-bis-ranged": ["FULL ECLIPSE RANGED", "SNOOPJOINT · BEST IN SLOT"],
  stats: ["THE ROAD TO JAD", "TOTAL LEVEL 1333"],
  "looting-bag": ["LOOTING BAG", "AUGUST 3, 2026 · 25 SLOTS"],
  loadout: ["VERIFIED LOADOUT", "OBSIDIAN · FIRE CAPE · TOKTZ-XIL-AK"],
  "profile-snoopjoint": ["SNOOPJOINT", "IRONMAN PROFILE"],
  "profile-snoopnobank": ["SNOOPNOBANK", "ULTIMATE IRONMAN PROFILE"],
  "profile-wildysnoop": ["WILDYSNOOP", "OBBY MAUL PURE PROFILE"],
};

function fallbackImage(slug: string) {
  const [title, subtitle] = fallbackLabels[slug] ?? ["SNOOP HQ", "MEMORY IMAGE"];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760">
    <defs>
      <radialGradient id="glow" cx="72%" cy="18%" r="90%">
        <stop offset="0" stop-color="#285a54"/>
        <stop offset=".48" stop-color="#182321"/>
        <stop offset="1" stop-color="#101415"/>
      </radialGradient>
      <pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse">
        <path d="M42 0H0V42" fill="none" stroke="#b8fff5" stroke-opacity=".035"/>
      </pattern>
    </defs>
    <rect width="1200" height="760" fill="url(#glow)"/>
    <rect width="1200" height="760" fill="url(#grid)"/>
    <circle cx="940" cy="170" r="115" fill="none" stroke="#55c7b7" stroke-opacity=".18"/>
    <circle cx="940" cy="170" r="74" fill="none" stroke="#55c7b7" stroke-opacity=".1"/>
    <path d="M0 615 C235 540 384 688 612 607 S988 520 1200 607 V760 H0Z" fill="#0d1112" fill-opacity=".65"/>
    <text x="72" y="608" fill="#55c7b7" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="4">${subtitle}</text>
    <text x="68" y="666" fill="#e8e4db" font-family="Arial, sans-serif" font-size="44" font-weight="500" letter-spacing="-1">${title}</text>
    <text x="72" y="705" fill="#8b918d" font-family="Arial, sans-serif" font-size="15">Original screenshot is ready to reconnect from the local memory library.</text>
  </svg>`;
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const filename = assetNames[slug];

  if (!filename) {
    return NextResponse.json({ error: "Unknown memory image" }, { status: 404 });
  }

  const durableDirectory = path.join(process.cwd(), "data", "memories");
  const durablePath = path.join(durableDirectory, `${slug}.png`);
  const candidates = [
    process.env.USERPROFILE
      ? path.join(
          process.env.USERPROFILE,
          ".cursor",
          "projects",
          "c-Users-GUEST1-OneDrive-Desktop-osrs-snoop",
          "assets",
          filename,
        )
      : null,
    durablePath,
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const filePath of candidates) {
    try {
      const image = await readFile(filePath);
      if (filePath !== durablePath) {
        await mkdir(durableDirectory, { recursive: true });
        await writeFile(durablePath, image);
      }
      return new NextResponse(image, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      // Try the next durable/local source before using the visual fallback.
    }
  }

  return fallbackImage(slug);
}
