export const FIRST_PARTY_EVENTS = {
  homepageView: "homepage_view",
  assessmentView: "assessment_view",
  assessmentStarted: "assessment_started",
  paidAutoStarted: "paid_auto_started",
  recognitionCardClicked: "recognition_card_clicked",
  quizCompleted: "quiz_completed",
  quizMilestoneReached: "quiz_milestone_reached",
  emailSubmitted: "email_submitted",
  resultPreviewViewed: "result_preview_viewed",
  paywallViewed: "paywall_viewed",
  checkoutIntent: "checkout_intent",
  paymentIntentCreated: "payment_intent_created",
  paymentElementLoaded: "payment_element_loaded",
  paymentError: "payment_error",
  loginStarted: "login_started",
  otpVerified: "otp_verified",
  dashboardViewed: "dashboard_viewed",
  profileOpened: "profile_opened",
  bonusOpened: "bonus_opened",
  roadmapLandingViewed: "roadmap_landing_viewed",
  roadmapCtaClicked: "roadmap_cta_clicked",
  purchaseSucceeded: "purchase_succeeded",
  // Funnel-depth events — first-party only (high volume / diagnostic; never sent to Meta).
  questionViewed: "question_viewed",
  infoCardViewed: "info_card_viewed",
  resultUnlockClicked: "result_unlock_clicked",
  upsellSkipped: "upsell_skipped",
  subscriptionSkipped: "subscription_skipped",
  successViewed: "success_viewed",
  // Analytics-depth pass — first-party only. These separate stages the
  // funnel previously couldn't distinguish: answering vs viewing a question,
  // the loading beat, the free preview vs the full result, physically
  // reaching the checkout section vs merely rendering the paywall (the
  // payment intent is created on paywall render and must never be read as
  // buyer intent), and the first meaningful post-purchase action.
  questionAnswered: "question_answered",
  resultLoadingViewed: "result_loading_viewed",
  resultLoadingCompleted: "result_loading_completed",
  emailFieldFocused: "email_field_focused",
  fullResultViewed: "full_result_viewed",
  checkoutSectionReached: "checkout_section_reached",
  checkoutCtaClicked: "checkout_cta_clicked",
  upsellViewed: "upsell_viewed",
  subscriptionViewed: "subscription_viewed",
  planSelected: "plan_selected",
  secureCheckoutRevealed: "secure_checkout_revealed",
  paymentAttempted: "payment_attempted",
  dashboardFirstActionClicked: "dashboard_first_action_clicked",
  // Social proof - first-party only. Fires only when approved customer proof
  // enters the viewport or when the user explicitly expands the paywall proof.
  // Distinct from full_result_viewed, paywall_viewed, and checkout_cta_clicked
  // so "saw/requested proof" stays its own measurable fact.
  socialProofImpression: "social_proof_impression",
  socialProofExpanded: "social_proof_expanded",
} as const;

export type FirstPartyEventName =
  (typeof FIRST_PARTY_EVENTS)[keyof typeof FIRST_PARTY_EVENTS];

export const ALLOWED_FIRST_PARTY_EVENTS = new Set<string>(
  Object.values(FIRST_PARTY_EVENTS),
);

export type MetaStandardEvent =
  | "PageView"
  | "Lead"
  | "CompleteRegistration"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase";

export const META_EVENT_BY_FIRST_PARTY: Partial<
  Record<FirstPartyEventName, MetaStandardEvent>
> = {
  [FIRST_PARTY_EVENTS.emailSubmitted]: "Lead",
  [FIRST_PARTY_EVENTS.quizCompleted]: "CompleteRegistration",
  [FIRST_PARTY_EVENTS.paywallViewed]: "ViewContent",
  [FIRST_PARTY_EVENTS.checkoutIntent]: "InitiateCheckout",
  [FIRST_PARTY_EVENTS.purchaseSucceeded]: "Purchase",
};

export const META_CUSTOM_EVENT_BY_FIRST_PARTY: Partial<
  Record<FirstPartyEventName, string>
> = {
  [FIRST_PARTY_EVENTS.homepageView]: "HomepageView",
  [FIRST_PARTY_EVENTS.assessmentView]: "AssessmentView",
  [FIRST_PARTY_EVENTS.assessmentStarted]: "AssessmentStarted",
  [FIRST_PARTY_EVENTS.paidAutoStarted]: "PaidAutoStarted",
  [FIRST_PARTY_EVENTS.recognitionCardClicked]: "RecognitionCardClicked",
  [FIRST_PARTY_EVENTS.quizMilestoneReached]: "QuizMilestoneReached",
  [FIRST_PARTY_EVENTS.emailSubmitted]: "EmailSubmitted",
  [FIRST_PARTY_EVENTS.quizCompleted]: "QuizCompleted",
  [FIRST_PARTY_EVENTS.resultPreviewViewed]: "ResultPreviewViewed",
  [FIRST_PARTY_EVENTS.paywallViewed]: "PaywallViewed",
  [FIRST_PARTY_EVENTS.checkoutIntent]: "CheckoutIntent",
  [FIRST_PARTY_EVENTS.roadmapLandingViewed]: "RoadmapLandingViewed",
  [FIRST_PARTY_EVENTS.roadmapCtaClicked]: "RoadmapCtaClicked",
};

export const META_ALLOWED_FIRST_PARTY_EVENTS = new Set<string>([
  FIRST_PARTY_EVENTS.homepageView,
  FIRST_PARTY_EVENTS.assessmentView,
  FIRST_PARTY_EVENTS.assessmentStarted,
  FIRST_PARTY_EVENTS.recognitionCardClicked,
  FIRST_PARTY_EVENTS.emailSubmitted,
  FIRST_PARTY_EVENTS.quizCompleted,
  FIRST_PARTY_EVENTS.resultPreviewViewed,
  FIRST_PARTY_EVENTS.paywallViewed,
  FIRST_PARTY_EVENTS.checkoutIntent,
  FIRST_PARTY_EVENTS.roadmapLandingViewed,
  FIRST_PARTY_EVENTS.roadmapCtaClicked,
]);

export function isAllowedFirstPartyEvent(
  eventName: string,
): eventName is FirstPartyEventName {
  return ALLOWED_FIRST_PARTY_EVENTS.has(eventName);
}
