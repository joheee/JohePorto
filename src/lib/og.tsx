import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/settings";
import { siteUrl } from "@/lib/site";

export const cardSize = { width: 1200, height: 630 };

// The social preview card (LinkedIn, Slack, X, iMessage...), drawn from your saved profile.
// Satori (the renderer behind ImageResponse) needs display:flex on any element with children.
export async function renderCard() {
  const p = await getProfile();
  const host = new URL(siteUrl).host;
  const pitch = p.pitch.length > 150 ? `${p.pitch.slice(0, 147).trimEnd()}…` : p.pitch;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0a0a0a",
          backgroundImage: "radial-gradient(circle at 88% 8%, rgba(129,140,248,0.30), rgba(10,10,10,0) 48%)",
          color: "#ededed",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: "#9ca3af" }}>
          {p.status ? (
            <>
              <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, background: "#10b981", marginRight: 16 }} />
              <div>{p.status}</div>
            </>
          ) : (
            <div>Portfolio</div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 34, color: "#818cf8", marginBottom: 18 }}>{p.roles.slice(0, 3).join("  ·  ")}</div>
          <div style={{ fontSize: p.name.length > 16 ? 96 : 112, lineHeight: 1.04, letterSpacing: "-0.04em", WebkitTextStroke: "3px #ededed" }}>{p.name}</div>
          {pitch && <div style={{ fontSize: 36, color: "#9ca3af", marginTop: 28, lineHeight: 1.35, maxWidth: 940 }}>{pitch}</div>}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#9ca3af" }}>
          <div>{host}</div>
          <div style={{ color: "#818cf8" }}>{p.socials.map((s) => s.label).join("  ·  ")}</div>
        </div>
      </div>
    ),
    cardSize,
  );
}
