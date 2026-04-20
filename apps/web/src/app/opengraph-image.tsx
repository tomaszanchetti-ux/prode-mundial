import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Prode Mundial — Pronósticos Mundial 2026";
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
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #0052CC 0%, #0A3A8F 55%, #061F4F 100%)",
          color: "#FFFFFF",
          fontFamily: "system-ui, -apple-system, sans-serif"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: 900,
              letterSpacing: "-1px"
            }}
          >
            PM
          </div>
          <span
            style={{
              fontSize: "26px",
              fontWeight: 600,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              opacity: 0.9
            }}
          >
            Prode Mundial
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <span
            style={{
              fontSize: "104px",
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: "-3px"
            }}
          >
            Pronosticá el
            <br />
            Mundial 2026.
          </span>
          <span
            style={{
              fontSize: "34px",
              fontWeight: 500,
              opacity: 0.85,
              letterSpacing: "-0.5px"
            }}
          >
            Competí en ligas privadas y sumá puntos.
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "22px",
            fontWeight: 600,
            opacity: 0.8
          }}
        >
          <span>prode-mundial.app</span>
          <span style={{ display: "flex", gap: "18px" }}>
            <span>104 partidos</span>
            <span>·</span>
            <span>Ligas privadas</span>
            <span>·</span>
            <span>Tu Mundial</span>
          </span>
        </div>
      </div>
    ),
    size
  );
}
