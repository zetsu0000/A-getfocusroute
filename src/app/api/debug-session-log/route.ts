import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

/** Dev-only relay so browser debug logs land in workspace NDJSON (session tooling). */
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    const obj: unknown = await req.json();
    if (typeof obj !== "object" || obj === null) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const line = JSON.stringify(obj);
    if (line.length > 16_384) {
      return NextResponse.json({ ok: false }, { status: 413 });
    }
    appendFileSync(join(process.cwd(), "debug-8b4af7.log"), `${line}\n`);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
