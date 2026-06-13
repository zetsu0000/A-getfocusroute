import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { jsonInputError, readJsonObject } from "@/lib/api/request";
import {
  enforceRateLimit,
  rateLimitResponse,
  temporaryUnavailableResponse,
} from "@/lib/rate-limit/server";
import { getSignatureFromAnswers } from "@/lib/signature";
import type { QuizAnswer } from "@/types/quiz";

const isDev = process.env.NODE_ENV === "development";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidQuizAnswers(value: unknown): value is QuizAnswer[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 30) {
    return false;
  }
  return value.every(
    (row) =>
      row &&
      typeof row === "object" &&
      typeof (row as QuizAnswer).questionId === "string" &&
      (row as QuizAnswer).questionId.length <= 80 &&
      Array.isArray((row as QuizAnswer).selectedOptions) &&
      (row as QuizAnswer).selectedOptions.length <= 8 &&
      (row as QuizAnswer).selectedOptions.every(
        (o) => typeof o === "string" && o.length <= 160,
      ),
  );
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function devLog(payload: Record<string, unknown>) {
  if (isDev) {
    console.info("[api/quiz-result]", payload);
  }
}

function insertErrorResponse(error: {
  message?: string;
  code?: string;
  details?: string;
}) {
  console.error("[api/quiz-result] insert", error);
  if (isDev) {
    return Response.json(
      {
        error: error.message ?? "Could not save quiz result",
        code: error.code,
        details: error.details,
      },
      { status: 500 },
    );
  }
  return Response.json(
    { error: "Could not save quiz result" },
    { status: 500 },
  );
}

export async function POST(request: Request) {
  try {
    const parsed = await readJsonObject(request, {
      maxBytes: 64 * 1024,
      requireJsonContentType: true,
    });
    if (!parsed.ok) return jsonInputError(parsed);

    const body = parsed.body;
    const submittedEmailRaw =
      typeof body.email === "string" ? body.email.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const answers = body.answers;

    if (!isValidQuizAnswers(answers)) {
      return Response.json(
        { error: "answers must be a non-empty array" },
        { status: 400 },
      );
    }

    const preAuthLimit = await enforceRateLimit("quizResult", {
      request,
      email: submittedEmailRaw || null,
    });
    if (!preAuthLimit.ok) {
      if (preAuthLimit.kind === "limited") return rateLimitResponse(preAuthLimit);
      return temporaryUnavailableResponse();
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const authenticated = Boolean(user?.id && user.email);
    let email: string;
    let userId: string | null = null;

    if (authenticated && user?.email) {
      userId = user.id;
      email = normalizeEmail(user.email);
      const submittedNormalized = submittedEmailRaw
        ? normalizeEmail(submittedEmailRaw)
        : "";
      devLog({
        authenticated: true,
        submittedEmailPresent: submittedEmailRaw.includes("@"),
        emailOverridden:
          submittedNormalized.length > 0 && submittedNormalized !== email,
        finalEmailPresent: true,
      });
    } else {
      if (!submittedEmailRaw || !submittedEmailRaw.includes("@")) {
        return Response.json({ error: "Valid email is required" }, { status: 400 });
      }
      email = normalizeEmail(submittedEmailRaw);
      devLog({
        authenticated: false,
        submittedEmailPresent: true,
        emailOverridden: false,
        finalEmailPresent: true,
      });
    }

    const computed = getSignatureFromAnswers(answers);

    const signature_key =
      typeof body.signature_key === "string"
        ? body.signature_key
        : computed.signature;
    const signature_name =
      typeof body.signature_name === "string"
        ? body.signature_name
        : computed.title;
    const signature_description =
      typeof body.signature_description === "string"
        ? body.signature_description
        : computed.preview;
    const signature_bullets = isStringArray(body.signature_bullets)
      ? body.signature_bullets
      : [...computed.strengths, ...computed.unlockTeaser];

    let admin;
    try {
      admin = createAdminClient();
    } catch (e) {
      console.error("[api/quiz-result] admin client", e);
      const message =
        e instanceof Error ? e.message : "Server configuration error";
      return Response.json(
        isDev
          ? { error: message }
          : { error: "Could not save quiz result" },
        { status: 503 },
      );
    }

    const { data, error } = await admin
      .from("quiz_results")
      .insert({
        user_id: userId,
        email,
        name: name || null,
        answers,
        signature_key,
        signature_name,
        signature_description,
        signature_bullets,
      })
      .select("id")
      .single();

    if (error) {
      return insertErrorResponse(error);
    }
    if (!data?.id) {
      return insertErrorResponse({
        message: "Insert succeeded but no id was returned",
      });
    }

    return Response.json({ quiz_result_id: data.id });
  } catch (e) {
    console.error("[api/quiz-result]", e);
    const message = e instanceof Error ? e.message : "Invalid request";
    return Response.json(
      isDev ? { error: message } : { error: "Invalid request" },
      { status: 400 },
    );
  }
}
