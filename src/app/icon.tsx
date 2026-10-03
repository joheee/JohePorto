import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/settings";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Favicon: the first letter of your name on the accent colour.
export default async function Icon() {
  const { name } = await getProfile();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#818cf8", color: "#0a0a0a", fontSize: 22, fontWeight: 700, borderRadius: 8 }}>
        {(name.trim()[0] ?? "J").toUpperCase()}
      </div>
    ),
    size,
  );
}
