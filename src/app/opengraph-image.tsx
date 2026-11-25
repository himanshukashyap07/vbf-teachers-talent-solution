import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

// Social-share preview (WhatsApp, Facebook, LinkedIn, X). Generated once at build time.
export const alt = `${siteConfig.name}: ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f6f3ea",
          padding: "72px 80px",
          borderLeft: "24px solid #1f3a5f",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              background: "#1f3a5f",
              color: "#f8f6f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              fontWeight: 700,
            }}
          >
            S
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#1c2733" }}>{siteConfig.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 70, fontWeight: 700, color: "#1c2733", lineHeight: 1.1 }}>
            Screened teachers for schools. Genuine vacancies for teachers.
          </div>
          <div style={{ fontSize: 32, color: "#4a5663" }}>Teacher recruitment in Uttar Pradesh</div>
        </div>

        <div style={{ display: "flex", gap: 16, fontSize: 26, color: "#8f4f12", fontWeight: 700 }}>
          <span>Interviewed</span>
          <span>·</span>
          <span>Summarised</span>
          <span>·</span>
          <span>Placed with consent</span>
        </div>
      </div>
    ),
    size,
  );
}
