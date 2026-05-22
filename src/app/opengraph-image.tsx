import { ImageResponse } from "next/og";

export const alt = "FocusRoute — Understand how your focus works.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F6F2EA",
          padding: "72px 88px",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Subtle warm accent */}
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -180,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "rgba(63,111,143,0.08)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -160,
            left: -120,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: "rgba(92,138,94,0.06)",
            display: "flex",
          }}
        />

        {/* Wordmark row */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              background: "#3F6F8F",
              display: "flex",
            }}
          />
          <span
            style={{
              fontSize: 34,
              fontWeight: 800,
              color: "#1C1A2E",
              letterSpacing: "-0.02em",
            }}
          >
            FocusRoute
          </span>
        </div>

        {/* Headline block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            maxWidth: 920,
          }}
        >
          <span
            style={{
              fontSize: 84,
              fontWeight: 800,
              color: "#1C1A2E",
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
            }}
          >
            Understand how your
          </span>
          <span
            style={{
              fontSize: 84,
              fontWeight: 800,
              color: "#3F6F8F",
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
            }}
          >
            focus works.
          </span>
          <span
            style={{
              fontSize: 26,
              color: "#4A4A6A",
              lineHeight: 1.45,
              maxWidth: 780,
              marginTop: 8,
            }}
          >
            A guided assessment and Brain Profile for self-understanding and productivity support.
          </span>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            color: "#9B9BB5",
            fontSize: 18,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          <span>getfocusroute.com</span>
          <span>Not a diagnosis.</span>
        </div>
      </div>
    ),
    { ...size }
  );
}