export type JsonObjectResult =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; status: 400 | 413 | 415; error: string };

function isJsonContentType(value: string | null): boolean {
  if (!value) return false;
  return value.toLowerCase().split(";")[0]?.trim() === "application/json";
}

export async function readJsonObject(
  request: Request,
  options: {
    maxBytes: number;
    requireJsonContentType?: boolean;
  },
): Promise<JsonObjectResult> {
  if (options.requireJsonContentType && !isJsonContentType(request.headers.get("content-type"))) {
    return { ok: false, status: 415, error: "Unsupported content type" };
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > options.maxBytes) {
    return { ok: false, status: 413, error: "Request body too large" };
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, status: 400, error: "Invalid request" };
  }

  if (new TextEncoder().encode(text).length > options.maxBytes) {
    return { ok: false, status: 413, error: "Request body too large" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON" };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, status: 400, error: "JSON object required" };
  }

  return { ok: true, body: parsed as Record<string, unknown> };
}

export function jsonInputError(result: Exclude<JsonObjectResult, { ok: true }>): Response {
  return Response.json(
    { error: result.error },
    {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
