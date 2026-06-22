import type { ResultEmailPayload } from "@/lib/email/types";
import { escapeHtml } from "@/lib/email/templates/escape";
import type { BuiltEmailTemplate } from "@/lib/email/templates/types";

const SUBJECT = "Your FocusRoute result is ready";
const PREVIEW_TEXT = "See your focus pattern, score, and what to do next.";
const HEADING = "Your FocusRoute result is ready.";
const SCORE_INTERPRETATION =
  "This score summarizes the focus friction you reported in this assessment. Higher means more frequent or stronger friction — not less ability. Based on your answers. Not a diagnosis.";
const VALUE_BRIDGE =
  "FocusRoute turns your result into a full breakdown, a 28-day action path, and practical tools you can return to.";
const RETURN_COPY =
  "You do not have to rethink everything from scratch. Your answers are saved so you can come back to the next step when you are ready.";
const RETURN_CTA_LABEL = "Return to my FocusRoute plan";

function buildScoreSection(payload: ResultEmailPayload): {
  html: string;
  text: string;
} {
  if (!payload.focusFrictionScore) {
    return { html: "", text: "" };
  }

  const score = String(payload.focusFrictionScore.value);
  return {
    html: `
      <tr>
        <td style="padding:24px 24px 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111;">
          <p style="margin:0 0 8px 0;font-size:12px;line-height:18px;letter-spacing:0.08em;text-transform:uppercase;color:#555555;">YOUR FOCUS-FRICTION SCORE</p>
          <p style="margin:0 0 8px 0;font-size:28px;line-height:34px;font-weight:700;color:#111111;">${escapeHtml(score)} / 100</p>
          <p style="margin:0;font-size:15px;line-height:22px;color:#333333;">${escapeHtml(SCORE_INTERPRETATION)}</p>
        </td>
      </tr>`,
    text: [
      "YOUR FOCUS-FRICTION SCORE",
      `${score} / 100`,
      SCORE_INTERPRETATION,
      "",
    ].join("\n"),
  };
}

/** Production-ready transactional result email template. */
export function buildResultReadyEmail(payload: ResultEmailPayload): BuiltEmailTemplate {
  const patternName = escapeHtml(payload.patternName);
  const planUrl = escapeHtml(payload.planUrl);
  const dashboardUrl = escapeHtml(payload.dashboardUrl);
  const scoreSection = buildScoreSection(payload);

  const htmlBody = `<!DOCTYPE html>
<html lang="${escapeHtml(payload.locale || "en-US")}">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>${escapeHtml(SUBJECT)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(PREVIEW_TEXT)}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f5;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:12px;">
            <tr>
              <td style="padding:32px 24px 8px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111;">
                <h1 style="margin:0;font-size:28px;line-height:34px;font-weight:700;color:#111111;">${escapeHtml(HEADING)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111;">
                <p style="margin:0 0 8px 0;font-size:12px;line-height:18px;letter-spacing:0.08em;text-transform:uppercase;color:#555555;">YOUR FOCUS PATTERN</p>
                <p style="margin:0;font-size:22px;line-height:28px;font-weight:600;color:#111111;">${patternName}</p>
              </td>
            </tr>
            ${scoreSection.html}
            <tr>
              <td style="padding:24px 24px 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#333333;">
                <p style="margin:0;font-size:15px;line-height:22px;">${escapeHtml(VALUE_BRIDGE)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 8px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <a href="${planUrl}" style="display:inline-block;background-color:#111111;color:#ffffff;text-decoration:none;font-size:16px;line-height:16px;font-weight:600;padding:14px 22px;border-radius:8px;">${escapeHtml(RETURN_CTA_LABEL)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#333333;">
                <p style="margin:0;font-size:14px;line-height:21px;color:#555555;">${escapeHtml(RETURN_COPY)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <a href="${dashboardUrl}" style="font-size:14px;line-height:20px;color:#444444;text-decoration:underline;">Open FocusRoute</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textBody = [
    HEADING,
    "",
    "YOUR FOCUS PATTERN",
    payload.patternName,
    "",
    scoreSection.text,
    VALUE_BRIDGE,
    "",
    `${RETURN_CTA_LABEL}:`,
    payload.planUrl,
    "",
    RETURN_COPY,
    "",
    "Open FocusRoute:",
    payload.dashboardUrl,
  ]
    .filter((line, index, arr) => line !== "" || arr[index - 1] !== "")
    .join("\n");

  return {
    templateKey: "result_ready",
    classification: "transactional",
    subject: SUBJECT,
    previewText: PREVIEW_TEXT,
    htmlBody,
    textBody,
  };
}
