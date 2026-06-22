export function renderInvalidUnsubscribePage(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>FocusRoute unsubscribe</title>
  </head>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:24px;max-width:560px;margin:0 auto;color:#111;">
    <h1 style="font-size:24px;line-height:1.3;">This unsubscribe link is not valid.</h1>
    <p style="font-size:16px;line-height:1.5;color:#333;">If you still want to stop marketing emails, use the latest unsubscribe link from a FocusRoute email or contact support.</p>
  </body>
</html>`;
}

export function renderUnsubscribeConfirmPage(token: string): string {
  const escapedToken = token
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>FocusRoute unsubscribe</title>
  </head>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:24px;max-width:560px;margin:0 auto;color:#111;">
    <h1 style="font-size:24px;line-height:1.3;">Unsubscribe from FocusRoute emails?</h1>
    <p style="font-size:16px;line-height:1.5;color:#333;">You will stop receiving marketing and follow-up emails. Transactional account and purchase emails may still be sent when needed.</p>
    <form method="post" action="/api/email/unsubscribe" style="margin-top:24px;">
      <input type="hidden" name="token" value="${escapedToken}" />
      <button type="submit" style="background:#111;color:#fff;border:0;border-radius:8px;padding:12px 18px;font-size:16px;font-weight:600;cursor:pointer;">Unsubscribe</button>
    </form>
  </body>
</html>`;
}

export function renderUnsubscribeSuccessPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>FocusRoute unsubscribe</title>
  </head>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:24px;max-width:560px;margin:0 auto;color:#111;">
    <h1 style="font-size:24px;line-height:1.3;">You are unsubscribed.</h1>
    <p style="font-size:16px;line-height:1.5;color:#333;">You will no longer receive marketing and follow-up emails from FocusRoute.</p>
  </body>
</html>`;
}
