import { SignatureSigil } from "@/components/signature/SignatureSigil";
import { SIGNATURE_ORDER, SIGNATURE_IDENTITY } from "@/lib/signature-identity";

export const dynamic = "force-static";

export default function SignaturesShowcase() {
  return (
    <div style={{ background: "#0E0B16", minHeight: "100vh", padding: "56px 40px", color: "#FFFFFF" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 36, color: "#FFFFFF" }}>
        Cognitive Signature · Sigil Showcase
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
        {SIGNATURE_ORDER.map((key) => {
          const id = SIGNATURE_IDENTITY[key];
          return (
            <div key={key} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "28px 20px", textAlign: "center", boxShadow: `0 18px 44px rgba(${id.accentRgb},0.12)` }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                <SignatureSigil signatureKey={key} size={128} withGlow />
              </div>
              <p style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: `rgba(${id.accentRgb},1)`, marginBottom: 6 }}>Class · {id.classIndex}</p>
              <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.025em", marginBottom: 4 }}>{key}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: "0.08em" }}>{id.essence}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
