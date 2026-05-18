import { ImageResponse } from "next/og";
import { BRAIN_OS } from "@/lib/positioning";

export const alt = `${BRAIN_OS.lineTm} · Personalized ADHD Profile`;
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
          alignItems: "center",
          justifyContent: "center",
          background: "#F6F2EA",
          backgroundImage:
            "radial-gradient(circle, #E8E1D4 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          padding: "64px",
          position: "relative",
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(54,96,122,0.10)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "rgba(92,138,94,0.08)",
            display: "flex",
          }}
        />

        {/* Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "#FFFFFF",
            borderRadius: "32px",
            padding: "60px 80px",
            boxShadow:
              "0 1px 3px rgba(28,26,46,0.05), 0 32px 80px rgba(28,26,46,0.10)",
            maxWidth: 900,
            width: "100%",
          }}
        >
          {/* Logo row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "36px",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "16px",
            background: "#3F6F8F",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="32"
                height="22"
                viewBox="0 0 22 16"
                fill="none"
              >
                <path
                  d="M1 8 Q3 3 5 8 Q7 13 9 8 Q11 3 13 8 Q15 13 17 8 Q19 3 21 8"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#1C1A2E",
                letterSpacing: "-0.02em",
              }}
            >
              FocusRoute
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize: 58,
              fontWeight: 800,
              color: "#1C1A2E",
              textAlign: "center",
              lineHeight: 1.18,
              letterSpacing: "-0.03em",
              marginBottom: "20px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>{BRAIN_OS.heroTitleBefore}</span>
            <span style={{ color: "#3F6F8F" }}>{BRAIN_OS.heroTitleAccent}</span>
            <span>Map in ~12 minutes</span>
          </div>

          {/* Subline */}
          <p
            style={{
              fontSize: 22,
              color: "#4A4A6A",
              textAlign: "center",
              lineHeight: 1.5,
              marginBottom: "36px",
            }}
          >
            Cognitive Mapping Assessment™ · Brain Profile™ · 28-Day Protocol™
          </p>

          {/* Pill badges */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
            }}
          >
            {["🧠 Brain-first", "⏱ ~12 min", "📘 Personalized profile", "🛡 7-day guarantee"].map(
              (label) => (
                <div
                  key={label}
                  style={{
                    padding: "10px 22px",
                    borderRadius: "99px",
                    background: "#E8F1F6",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#3F6F8F",
                    display: "flex",
                  }}
                >
                  {label}
                </div>
              )
            )}
          </div>
        </div>

        {/* Bottom CTA hint */}
        <p
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 16,
            color: "#9B9BB5",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          getfocusroute.com
        </p>
      </div>
    ),
    { ...size }
  );
}
