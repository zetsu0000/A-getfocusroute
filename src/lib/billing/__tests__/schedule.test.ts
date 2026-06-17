import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type Stripe from "stripe";

import { ensurePlanSchedule } from "../schedule";

// ── env (the registry resolves prices from these) ─────────────────────────────

const INTRO = "price_intro_4w";
const RENEWAL = "price_renew_4w";

const SAVED: Record<string, string | undefined> = {};
function setEnv(vars: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(vars)) {
    SAVED[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}
afterEach(() => {
  for (const [k, v] of Object.entries(SAVED)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
    delete SAVED[k];
  }
  vi.clearAllMocks();
});

function withPrices() {
  setEnv({
    STRIPE_PRICE_PLAN_4WEEK_INTRO: INTRO,
    STRIPE_PRICE_PLAN_4WEEK_RENEWAL: RENEWAL,
  });
}

// ── stripe double ─────────────────────────────────────────────────────────────

function makeStripe() {
  const schedules = {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
  };
  const stripe = { subscriptionSchedules: schedules } as unknown as Stripe;
  return { stripe, schedules };
}

const sub = (schedule: Stripe.Subscription["schedule"]) =>
  ({ id: "sub_1", schedule }) as Pick<Stripe.Subscription, "id" | "schedule">;

beforeEach(() => withPrices());

// ── tests ─────────────────────────────────────────────────────────────────────

describe("ensurePlanSchedule", () => {
  it("creates the 2-phase intro→renewal schedule when none exists", async () => {
    const { stripe, schedules } = makeStripe();
    schedules.create.mockResolvedValue({ id: "sched_1", phases: [{ start_date: 1000 }] });
    schedules.update.mockResolvedValue({ id: "sched_1" });

    const res = await ensurePlanSchedule(stripe, sub(null), "plan_4week");

    expect(res).toEqual({ status: "active", scheduleId: "sched_1" });
    expect(schedules.create).toHaveBeenCalledWith(
      { from_subscription: "sub_1" },
      { idempotencyKey: "sched_create:sub_1" },
    );
    expect(schedules.retrieve).not.toHaveBeenCalled();
    expect(schedules.update).toHaveBeenCalledWith("sched_1", {
      end_behavior: "release",
      phases: [
        {
          items: [{ price: INTRO, quantity: 1 }],
          start_date: 1000,
          duration: { interval: "week", interval_count: 4 }, // 28d / 7
        },
        { items: [{ price: RENEWAL, quantity: 1 }] },
      ],
    });
  });

  it("is a no-op when the schedule already carries the renewal phase", async () => {
    const { stripe, schedules } = makeStripe();
    schedules.retrieve.mockResolvedValue({
      id: "sched_1",
      status: "active",
      phases: [
        { start_date: 1000, items: [{ price: INTRO }] },
        { items: [{ price: RENEWAL }] },
      ],
    });

    const res = await ensurePlanSchedule(stripe, sub("sched_1"), "plan_4week");

    expect(res).toEqual({ status: "active", scheduleId: "sched_1" });
    expect(schedules.retrieve).toHaveBeenCalledWith("sched_1");
    expect(schedules.create).not.toHaveBeenCalled();
    expect(schedules.update).not.toHaveBeenCalled();
  });

  it("REPAIRS a partial failure: schedule exists but the renewal phase is missing", async () => {
    const { stripe, schedules } = makeStripe();
    schedules.retrieve.mockResolvedValue({
      id: "sched_1",
      status: "active",
      phases: [{ start_date: 2000, items: [{ price: INTRO }] }], // intro only
    });
    schedules.update.mockResolvedValue({ id: "sched_1" });

    const res = await ensurePlanSchedule(stripe, sub("sched_1"), "plan_4week");

    expect(res).toEqual({ status: "active", scheduleId: "sched_1" });
    expect(schedules.create).not.toHaveBeenCalled(); // reuse existing schedule
    expect(schedules.update).toHaveBeenCalledWith(
      "sched_1",
      expect.objectContaining({
        end_behavior: "release",
        phases: [
          expect.objectContaining({
            start_date: 2000,
            duration: { interval: "week", interval_count: 4 },
          }),
          { items: [{ price: RENEWAL, quantity: 1 }] },
        ],
      }),
    );
  });

  it("fails closed (pending) when prices are not configured — no Stripe calls", async () => {
    setEnv({
      STRIPE_PRICE_PLAN_4WEEK_INTRO: undefined,
      STRIPE_PRICE_PLAN_4WEEK_RENEWAL: undefined,
    });
    const { stripe, schedules } = makeStripe();

    const res = await ensurePlanSchedule(stripe, sub(null), "plan_4week");

    expect(res).toEqual({ status: "pending", reason: "prices_unconfigured:plan_4week" });
    expect(schedules.create).not.toHaveBeenCalled();
    expect(schedules.update).not.toHaveBeenCalled();
  });

  it("never throws when schedule creation fails — returns pending for reconcile", async () => {
    const { stripe, schedules } = makeStripe();
    schedules.create.mockRejectedValue(new Error("stripe down"));

    const res = await ensurePlanSchedule(stripe, sub(null), "plan_4week");

    expect(res).toEqual({ status: "pending", reason: "stripe down" });
  });

  it("never throws when the phase update fails — returns pending", async () => {
    const { stripe, schedules } = makeStripe();
    schedules.create.mockResolvedValue({ id: "sched_1", phases: [{ start_date: 1 }] });
    schedules.update.mockRejectedValue(new Error("update rejected"));

    const res = await ensurePlanSchedule(stripe, sub(null), "plan_4week");

    expect(res).toEqual({ status: "pending", reason: "update rejected" });
  });

  it("flags a released/canceled schedule as pending (cannot be steered)", async () => {
    const { stripe, schedules } = makeStripe();
    schedules.retrieve.mockResolvedValue({ id: "sched_1", status: "released", phases: [] });

    const res = await ensurePlanSchedule(stripe, sub("sched_1"), "plan_4week");

    expect(res).toEqual({ status: "pending", reason: "schedule_released" });
    expect(schedules.update).not.toHaveBeenCalled();
  });
});
