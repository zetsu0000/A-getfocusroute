"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { Lock } from "lucide-react";
import { useQuizStore } from "@/store/quizStore";
import { safeName } from "@/lib/personalization";
import { getSignatureFromAnswers, echoSentence } from "@/lib/signature";
import { getSignatureIdentity } from "@/lib/signature-identity";
import { resultLockedRows } from "@/lib/paid-value";
import { SigilArtifact } from "@/components/v2/SigilArtifact";
import { FocusField } from "@/components/v2/FocusField";
import { ResultSocialProof } from "@/components/signature/SocialProof";
import { HudLabel } from "@/components/v2/primitives";
import { setPersistedQuizResultId } from "@/lib/quizResultId";
import { createClient } from "@/lib/supabase/client";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/client";

export function ChartScreen() {
  const {
    name,
    email,
    setEmail,
    setStep,
    retakeMode,
    answers,
    quizResultId,
    setQuizResultId,
  } = useQuizStore();
  const router = useRouter();
  const personalName = safeName(name, "");
  const signature = getSignatureFromAnswers(answers);
  const identity = getSignatureIdentity(signature.signature);
  const echo = echoSentence(answers);

  /* The locked preview teases the paid value as practical outcomes (audit PR4):
     a 6-point focus map, the conditions that help you start/stay/recover, and one
     pattern-specific outcome that stays unique per signature. Centralized in
     paid-value so the result and the paywall stay in sync; every line is grounded
     in a real shipped Brain Profile section. */
  const lockedRows = resultLockedRows(signature.signature);
  const saveStarted = useRef(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [saveEmail, setSaveEmail] = useState<string | null>(null);

  /* Reset the page to the top when the result screen first mounts. The prior
     screen can leave the window scrolled down, which would otherwise clip the
     top of the result. Mount-only (empty deps) so it never reruns on state
     changes, and an instant (non-smooth) scroll so it can't interfere with the
     testimonials or the unlock CTA. */
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  /* The free preview now lives on the email gate (result_preview_viewed
     fires there); this screen is the full result. */
  const fullResultTracked = useRef(false);
  useEffect(() => {
    if (fullResultTracked.current) return;
    fullResultTracked.current = true;
    trackEvent(FIRST_PARTY_EVENTS.fullResultViewed, {
      meta: false,
      metadata: { signature_key: signature.signature, retake: retakeMode },
    });
  }, [signature.signature, retakeMode]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (cancelled) return;

        const authEmail =
          typeof user?.email === "string" && user.email.includes("@")
            ? user.email
            : null;
        const funnelEmail = email?.includes("@") ? email : null;
        const resolved = authEmail ?? funnelEmail;

        if (authEmail && authEmail !== email) {
          setEmail(authEmail);
        }

        if (process.env.NODE_ENV === "development") {
          console.info("[ChartScreen] quiz-result email resolve", {
            authenticated: Boolean(authEmail),
            submittedEmailPresent: Boolean(funnelEmail),
            finalEmailPresent: Boolean(resolved),
          });
        }

        setSaveEmail(resolved);
        setAuthChecked(true);
      } catch (e) {
        if (!cancelled) {
          console.warn("[ChartScreen] auth check failed", e);
          setSaveEmail(email?.includes("@") ? email : null);
          setAuthChecked(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [email, setEmail]);

  useEffect(() => {
    if (!authChecked) {
      return;
    }
    if (quizResultId) {
      return;
    }
    if (!saveEmail?.includes("@") || answers.length === 0) {
      return;
    }
    if (saveStarted.current) {
      return;
    }
    saveStarted.current = true;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/quiz-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: saveEmail,
            name,
            answers,
          }),
        });
        const data = (await res.json()) as {
          quiz_result_id?: string;
          error?: string;
        };
        if (!res.ok || !data.quiz_result_id) {
          console.warn(
            "[ChartScreen] quiz-result save failed",
            data.error ?? res.status,
          );
          saveStarted.current = false;
          return;
        }
        if (!cancelled) {
          setQuizResultId(data.quiz_result_id);
          setPersistedQuizResultId(data.quiz_result_id);
        }
      } catch (e) {
        console.warn("[ChartScreen] quiz-result save error", e);
        saveStarted.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authChecked, saveEmail, name, answers, quizResultId, setQuizResultId]);

  const handleRetakeDone = () => {
    router.push("/dashboard");
  };

  return (
    <m.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.28 }}
      style={{
        position: "relative",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "44px 24px",
        overflow: "hidden",
      }}
    >
      {/* fully-organized field in the user's accent — the route has been found */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <FocusField
          coherence={0.95}
          intensity={0.5}
          showRoute
          accentRgb={identity.accentRgb}
          accentRgb2="155,232,255"
        />
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <HudLabel tone="signal">Route located — preview unlocked</HudLabel>
        </div>

        <SigilArtifact
          signatureKey={signature.signature}
          signatureName={signature.signature}
          essence={signature.title}
          summary={signature.preview}
          variant="reveal"
        />

        {/* What the answers point to */}
        <m.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="v2-panel"
          style={{ position: "relative", padding: "19px 20px", overflow: "hidden" }}
        >
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: `linear-gradient(to bottom, ${identity.accent}, transparent)`,
            }}
          />
          <HudLabel style={{ marginBottom: 10 }}>What your answers point to</HudLabel>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--v2-ink)", lineHeight: 1.55 }}>
            {signature.frictionLine}
          </p>
          {echo && (
            <p style={{ marginTop: 8, fontSize: 13, color: "var(--v2-ink-dim)", lineHeight: 1.65 }}>
              {echo}
            </p>
          )}
        </m.div>

        {/* Strengths */}
        <m.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="v2-panel"
          style={{ padding: "19px 20px" }}
        >
          <HudLabel style={{ marginBottom: 14 }}>Pattern strengths</HudLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {signature.strengths.map((bullet, i) => (
              <m.div
                key={bullet}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.75 + i * 0.1, duration: 0.4 }}
                style={{ display: "flex", alignItems: "flex-start", gap: 11 }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    marginTop: 5,
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: identity.accent,
                    boxShadow: `0 0 10px ${identity.accent}`,
                    flexShrink: 0,
                  }}
                />
                <p
                  style={{
                    fontSize: 13.5,
                    color: "var(--v2-ink-dim)",
                    lineHeight: 1.55,
                  }}
                >
                  {bullet}
                </p>
              </m.div>
            ))}
          </div>
        </m.div>

        {/* Locked continuation */}
        <m.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="v2-panel"
          style={{ padding: "19px 20px", position: "relative", overflow: "hidden" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
            <Lock size={13} color="var(--v2-gold)" />
            <HudLabel tone="gold">Locked — full focus profile</HudLabel>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {lockedRows.map((line) => (
              <div
                key={line}
                style={{
                  borderRadius: 12,
                  background: "rgba(148,163,255,0.05)",
                  border: "1px solid var(--v2-line)",
                  padding: "11px 13px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <p style={{ fontSize: 12.5, color: "var(--v2-ink-dim)", filter: "blur(0.4px)" }}>
                  {line}
                </p>
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(90deg, transparent 55%, rgba(6,7,13,0.7))",
                    pointerEvents: "none",
                  }}
                />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--v2-ink-ghost)", marginTop: 10 }}>
            This preview is educational and not a medical diagnosis.
          </p>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <p
            className="v2-display"
            style={{
              fontSize: 19,
              fontWeight: 550,
              color: "var(--v2-ink)",
              lineHeight: 1.45,
            }}
          >
            {personalName ? (
              <>
                <em style={{ fontStyle: "italic", color: identity.accent }}>{personalName},</em>{" "}
                your full profile shows where momentum breaks — and how to get it back.
              </>
            ) : (
              <>Your full profile shows where momentum breaks — and how to get it back.</>
            )}
          </p>
        </m.div>

        {/* Three compact, real customer proofs at the decision point. The
            session-level selector keeps these unique from the paywall proofs. */}
        {!retakeMode && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95 }}
          >
            <ResultSocialProof />
          </m.div>
        )}

        {retakeMode ? (
          <m.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            onClick={handleRetakeDone}
            className="v2-cta"
            style={{ width: "100%", minHeight: 58, fontSize: 16 }}
          >
            Save New Profile Preview
          </m.button>
        ) : (
          <m.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            onClick={() => {
              trackEvent(FIRST_PARTY_EVENTS.resultUnlockClicked, {
                meta: false,
                metadata: { signature_key: signature.signature },
              });
              setStep("paywall");
            }}
            className="v2-cta v2-cta-gold"
            style={{ width: "100%", minHeight: 58, fontSize: 16 }}
          >
            <Lock size={15} strokeWidth={2.4} />
            Unlock My Full Profile
          </m.button>
        )}
      </div>
    </m.div>
  );
}
