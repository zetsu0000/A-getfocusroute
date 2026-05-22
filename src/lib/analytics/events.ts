export const FIRST_PARTY_EVENTS = {
  homepageView: "homepage_view",
  assessmentView: "assessment_view",
  assessmentStarted: "assessment_started",
  recognitionCardClicked: "recognition_card_clicked",
  quizCompleted: "quiz_completed",
  resultPreviewViewed: "result_preview_viewed",
  paywallViewed: "paywall_viewed",
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
  | "InitiateCheckout"
  | "Purchase";

export const META_EVENT_BY_FIRST_PARTY: Partial<
  Record<FirstPartyEventName, MetaStandardEvent>
> = {
  [FIRST_PARTY_EVENTS.assessmentStarted]: "Lead",
  [FIRST_PARTY_EVENTS.quizCompleted]: "CompleteRegistration",
  [FIRST_PARTY_EVENTS.paywallViewed]: "ViewContent",
  [FIRST_PARTY_EVENTS.paymentIntentCreated]: "InitiateCheckout",
  [FIRST_PARTY_EVENTS.purchaseSucceeded]: "Purchase",
};

export const META_CUSTOM_EVENT_BY_FIRST_PARTY: Partial<
  Record<FirstPartyEventName, string>
> = {
  [FIRST_PARTY_EVENTS.homepageView]: "HomepageView",
  [FIRST_PARTY_EVENTS.assessmentView]: "AssessmentView",
  [FIRST_PARTY_EVENTS.assessmentStarted]: "AssessmentStarted",
  [FIRST_PARTY_EVENTS.recognitionCardClicked]: "RecognitionCardClicked",
  [FIRST_PARTY_EVENTS.quizCompleted]: "QuizCompleted",
  [FIRST_PARTY_EVENTS.resultPreviewViewed]: "ResultPreviewViewed",
  [FIRST_PARTY_EVENTS.paywallViewed]: "PaywallViewed",
  [FIRST_PARTY_EVENTS.roadmapLandingViewed]: "RoadmapLandingViewed",
  [FIRST_PARTY_EVENTS.roadmapCtaClicked]: "RoadmapCtaClicked",
};

export const META_ALLOWED_FIRST_PARTY_EVENTS = new Set<string>([
  FIRST_PARTY_EVENTS.homepageView,
  FIRST_PARTY_EVENTS.assessmentView,
  FIRST_PARTY_EVENTS.assessmentStarted,
  FIRST_PARTY_EVENTS.recognitionCardClicked,
  FIRST_PARTY_EVENTS.quizCompleted,
  FIRST_PARTY_EVENTS.resultPreviewViewed,
  FIRST_PARTY_EVENTS.paywallViewed,
  FIRST_PARTY_EVENTS.paymentIntentCreated,
  FIRST_PARTY_EVENTS.roadmapLandingViewed,
  FIRST_PARTY_EVENTS.roadmapCtaClicked,
]);

export function isAllowedFirstPartyEvent(
  eventName: string,
): eventName is FirstPartyEventName {
  return ALLOWED_FIRST_PARTY_EVENTS.has(eventName);
}
