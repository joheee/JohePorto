import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/settings";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iPhone home-screen icon (iOS rounds the corners itself).
export default async function AppleIcon() {
  const { name } = await getProfile();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#818cf8", color: "#0a0a0a", fontSize: 120, fontWeight: 700 }}>
        {(name.trim()[0] ?? "J").toUpperCase()}
      </div>
    ),
    size,
  );
}
