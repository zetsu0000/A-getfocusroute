"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { useQuizStore } from "@/store/quizStore";
import { safeName } from "@/lib/personalization";
import { getSignatureFromAnswers } from "@/lib/signature";
import { SignatureRevealCard } from "@/components/signature/SignatureRevealCard";
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
  const displayName = safeName(name, "you");
  const signature = getSignatureFromAnswers(answers);
  const saveStarted = useRef(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [saveEmail, setSaveEmail] = useState<string | null>(null);

  useEffect(() => {
    trackEvent(FIRST_PARTY_EVENTS.resultPreviewViewed, {
      metadata: { signature_key: signature.signature },
    });
  }, [signature.signature]);

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
            finalEmail: resolved ?? null,
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
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <SignatureRevealCard
          signatureKey={signature.signature}
          signatureName={signature.signature}
          signatureEssence={signature.title}
          signatureSummary={signature.preview}
          variant="preview"
        />

        <div
          style={{
            background: "var(--color-bg-card)",
            borderRadius: "var(--radius-lg)",
            padding: "18px 20px",
            boxShadow: "var(--shadow-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              marginBottom: 12,
            }}
          >
            Signature strengths
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {signature.strengths.map((bullet) => (
              <div
                key={bullet}
                style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
              >
                <span
                  style={{
                    marginTop: 4,
                    width: 8,
                    height: 8,
                    borderRadius: "var(--radius-pill)",
                    background: "var(--color-cognitive)",
                  }}
                />
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--color-text-body)",
                    lineHeight: 1.5,
                  }}
                >
                  {bullet}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: "var(--color-bg-card)",
            borderRadius: 24,
            padding: "18px 18px",
            boxShadow: "var(--shadow-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "var(--color-text)",
              marginBottom: 10,
            }}
          >
            Unlock your full FocusRoute Brain Profile™
          </p>
          <div
            style={{
              filter: "blur(0.3px)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {signature.unlockTeaser.map((line) => (
              <div
                key={line}
                style={{
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-cognitive-tint)",
                  border: "1px solid var(--color-border)",
                  padding: "10px 12px",
                }}
              >
                <p style={{ fontSize: 12, color: "var(--color-text-body)" }}>
                  {line}
                </p>
              </div>
            ))}
          </div>
          <p
            style={{
              fontSize: 11,
              color: "var(--color-text-muted)",
              marginTop: 10,
            }}
          >
            This preview is educational and not a medical diagnosis.
          </p>
        </div>

        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "var(--color-text)",
              lineHeight: 1.4,
            }}
          >
            <span style={{ color: "var(--color-cognitive)" }}>{displayName},</span>{" "}
            your full Profile-to-Protocol™ plan is ready to unlock.
          </p>
        </m.div>

        {retakeMode ? (
          <m.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={handleRetakeDone}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: "var(--radius-md)",
              fontSize: 16,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              background: "var(--color-primary)",
              color: "#fff",
              boxShadow: "var(--shadow-btn-primary)",
            }}
          >
            Save New Profile Preview
          </m.button>
        ) : (
          <m.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => setStep("paywall")}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: "var(--radius-md)",
              fontSize: 16,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              background: "var(--color-accent)",
              color: "#fff",
              boxShadow: "var(--shadow-btn-accent)",
            }}
          >
            Unlock My Brain Profile
          </m.button>
        )}
      </div>
    </m.div>
  );
}



