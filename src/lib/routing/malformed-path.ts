export type MalformedPathDecision =
  | { action: "allow" }
  | { action: "redirect"; pathname: string }
  | { action: "reject" };

const BACKSLASH_TOKEN = /\\|%5[cC]/;
const TRAILING_ENCODED_BACKSLASH = /%5[cC]$/;

function stripTrailingBackslashToken(pathname: string): string {
  if (pathname.endsWith("\\")) {
    return pathname.slice(0, -1);
  }

  if (TRAILING_ENCODED_BACKSLASH.test(pathname)) {
    return pathname.slice(0, -3);
  }

  return pathname;
}

export function classifyMalformedBackslashPath(
  pathname: string,
): MalformedPathDecision {
  if (!BACKSLASH_TOKEN.test(pathname)) {
    return { action: "allow" };
  }

  let canonicalPathname = pathname;
  let stripped = false;

  while (BACKSLASH_TOKEN.test(canonicalPathname)) {
    const nextPathname = stripTrailingBackslashToken(canonicalPathname);
    if (nextPathname === canonicalPathname) {
      return { action: "reject" };
    }

    canonicalPathname = nextPathname;
    stripped = true;
  }

  if (!stripped) {
    return { action: "reject" };
  }

  return {
    action: "redirect",
    pathname: canonicalPathname || "/",
  };
}
