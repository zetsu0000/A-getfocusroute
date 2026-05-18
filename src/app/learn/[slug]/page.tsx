import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BRAIN_OS } from "@/lib/positioning";

type Article = {
  title: string;
  description: string;
  content: string;
};

const ARTICLES: Record<string, Article> = {
  "types-of-adhd": {
    title: "The 3 Types of ADHD Explained",
    description:
      "Learn the differences between Inattentive, Hyperactive-Impulsive, and Combined ADHD presentations.",
    content: `
ADHD is not one-size-fits-all. The DSM-5 — the clinical manual used by mental health professionals worldwide — recognizes three distinct presentations of Attention Deficit Hyperactivity Disorder, each with its own pattern of symptoms and challenges.

## Predominantly Inattentive Presentation

Formerly called "ADD," the Inattentive type is characterized by persistent difficulty sustaining attention, following through on tasks, and staying organized — without significant hyperactivity or impulsivity. People with this presentation often appear "spacey" or absent-minded rather than disruptive.

**Common signs in adults:**
- Frequently losing important items (keys, wallet, phone)
- Starting many projects but rarely finishing them
- Difficulty reading long documents or following complex instructions
- Missing deadlines or appointments despite genuine effort
- Mind wandering during conversations or meetings

This type is significantly underdiagnosed, particularly in women and girls, because the symptoms are less visible and easier to mask or attribute to other causes.

## Predominantly Hyperactive-Impulsive Presentation

This presentation is defined by excess physical energy, restlessness, and poor impulse control. Children with this type often run and climb constantly; adults more commonly experience it as internal restlessness and difficulty waiting.

**Common signs in adults:**
- Feeling compelled to keep moving or stay busy
- Interrupting others in conversation
- Making impulsive decisions (financial, relational, professional)
- Difficulty waiting in line or sitting through meetings
- Talking excessively or at rapid pace

Pure hyperactive-impulsive ADHD without significant inattention is less common in adults than in children, but the impulsivity component often persists and causes significant life disruption.

## Combined Presentation

The most prevalent ADHD type in adults, Combined Presentation meets criteria for both significant inattention and significant hyperactivity-impulsivity. This means the individual experiences the full spectrum: difficulty focusing *and* difficulty sitting still or controlling impulses.

**What this looks like in daily life:**
- Starting work tasks but quickly shifting to something more stimulating
- Beginning conversations without letting others finish
- Hyperfocus on highly interesting activities while neglecting important ones
- Emotional dysregulation when plans change unexpectedly

## Why It Matters

Identifying your ADHD type helps clinicians design more targeted treatment plans. Medication options, therapy approaches, and practical strategies can differ meaningfully based on your primary symptom profile. The first step is understanding which pattern fits your experience — a screening like FocusRoute can help you identify which direction to explore.
    `.trim(),
  },

  "adhd-symptoms-in-adults": {
    title: "ADHD Symptoms in Adults: What to Look For",
    description:
      "ADHD in adults often looks different than in children. Discover the 12 most common adult ADHD symptoms.",
    content: `
Most people picture a hyperactive child when they think of ADHD — but for millions of adults, ADHD looks nothing like that. Adult ADHD is frequently invisible, internalized, and easily mistaken for laziness, anxiety, or simply "being bad at life."

## Why Adult ADHD Looks Different

In children, ADHD often presents as obvious physical hyperactivity — running, climbing, interrupting. In adults, that same excess energy tends to manifest as internal restlessness, racing thoughts, or constant mental chatter. The symptoms are real and impairing, but they're harder to see from the outside.

Many adults with ADHD were never diagnosed as children. They developed coping mechanisms, pushed through with sheer willpower, or landed in environments that happened to accommodate their neurology. When those structures change — a new job, a major life event — the symptoms resurface.

## The 12 Most Common Adult ADHD Symptoms

**1. Executive dysfunction** — Chronic difficulty initiating tasks, especially boring or low-stimulation ones, even when the stakes are high.

**2. Time blindness** — An impaired internal sense of time; difficulty estimating how long tasks will take, arriving late consistently, or losing hours without noticing.

**3. Working memory deficits** — Forgetting what you were about to say mid-sentence, losing track of conversations, or needing to re-read the same paragraph multiple times.

**4. Emotional dysregulation** — Intense emotional reactions disproportionate to the situation; frustration flares quickly and may be slow to subside.

**5. Rejection sensitive dysphoria (RSD)** — Extreme emotional pain triggered by perceived criticism, rejection, or failure — often described as the most impairing ADHD symptom in adults.

**6. Hyperfocus** — The paradoxical ability to lock onto highly interesting tasks for hours, becoming so absorbed that other responsibilities disappear entirely.

**7. Chronic disorganization** — Cluttered spaces, missed appointments, and systems that work briefly before falling apart.

**8. Difficulty following through** — Beginning projects enthusiastically then stalling once the novelty wears off.

**9. Sleep dysregulation** — Trouble winding down at night, racing thoughts at bedtime, and difficulty waking in the morning regardless of sleep quantity.

**10. Impulsivity** — Making quick decisions without fully considering consequences, in purchases, relationships, or career choices.

**11. Forgetfulness** — Losing keys, missing bills, forgetting names and faces shortly after meeting people.

**12. Difficulty with sustained reading** — Needing to re-read text multiple times to absorb it, especially when emotionally neutral or technical.

## When to Seek Help

If five or more of these symptoms are persistent (present for at least six months), appear across multiple life domains (work, relationships, home), and began in childhood — even if unrecognized at the time — they may meet criteria for ADHD. The FocusRoute assessment can help you understand your symptom pattern and decide whether a professional evaluation makes sense.
    `.trim(),
  },

  "adhd-assessment-guide": {
    title: "How ADHD Is Assessed: From Screening to Diagnosis",
    description:
      "Understand the difference between an online ADHD screening and a clinical diagnosis, and what to do next.",
    content: `
If you suspect you have ADHD, you've probably already encountered a dizzying range of online quizzes, self-assessments, and articles. Understanding the difference between a screening tool and a formal diagnosis — and knowing what steps to take next — can save you time, money, and confusion.

## What Is an Online ADHD Screening?

An online ADHD screening, like FocusRoute, is a structured questionnaire designed to identify whether your symptoms are consistent with ADHD. These tools are based on validated clinical criteria — most commonly the DSM-5 — and can reliably detect symptom patterns associated with the three ADHD presentations.

What a screening *can* do:
- Quantify your symptoms across key ADHD dimensions
- Identify which presentation (Inattentive, Hyperactive-Impulsive, Combined) best matches your experience
- Give you language to describe your challenges to a healthcare provider
- Help you decide whether a professional evaluation is warranted

What a screening *cannot* do:
- Provide a medical diagnosis
- Rule out other conditions that mimic ADHD (anxiety, depression, sleep disorders, thyroid issues)
- Establish the developmental history required for a DSM-5 diagnosis

## The DSM-5 Criteria for ADHD

For an adult to be diagnosed with ADHD, the DSM-5 requires:

1. **Five or more** inattention symptoms *and/or* five or more hyperactivity-impulsivity symptoms
2. Symptoms present in **two or more settings** (work, home, school, relationships)
3. Symptoms that **cause meaningful impairment** in social or occupational functioning
4. Symptoms that were **present before age 12** (though they may not have been identified)
5. Symptoms **not better explained** by another mental disorder

## The Clinical Evaluation Process

A formal ADHD evaluation conducted by a psychiatrist, neuropsychologist, or qualified clinical psychologist typically involves:

**Clinical interview** — A structured conversation covering symptom history, childhood development, family history, and current functional impairment across domains.

**Standardized rating scales** — Tools like the Conners Adult ADHD Rating Scale (CAARS) or the Adult ADHD Self-Report Scale (ASRS) provide normed data comparing your responses to the general population.

**Collateral information** — Information from a parent, sibling, or partner who knew you in childhood can help establish the developmental history requirement.

**Rule-out assessment** — The clinician may screen for anxiety, depression, sleep disorders, or learning disabilities that can produce ADHD-like symptoms.

## What to Do Next

If your FocusRoute results suggest significant ADHD symptoms, the recommended next steps are:

1. **Document your experience** — Keep a brief journal for two weeks noting situations where ADHD symptoms affect you most.
2. **Consult your primary care physician** — They can rule out medical causes and provide a referral.
3. **Seek a specialist** — A psychiatrist or neuropsychologist can conduct a full evaluation. In many regions, telehealth platforms have significantly reduced wait times.
4. **Bring your screening results** — Your FocusRoute profile can serve as a useful starting point for the clinical conversation.

Getting a formal diagnosis opens the door to treatment options — including medication, cognitive behavioral therapy (CBT) for ADHD, and structured coaching — that can meaningfully improve daily functioning.
    `.trim(),
  },
};

export async function generateStaticParams() {
  return Object.keys(ARTICLES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES[slug];
  if (!article) return {};
  return {
    title: `${article.title} · ${BRAIN_OS.lineTm}`,
    description: article.description,
  };
}

function renderContent(content: string) {
  const paragraphs = content.split("\n\n");
  return paragraphs.map((block, i) => {
    if (block.startsWith("## ")) {
      return (
        <h2
          key={i}
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--color-text)",
            marginTop: 36,
            marginBottom: 12,
            letterSpacing: "-0.01em",
          }}
        >
          {block.slice(3)}
        </h2>
      );
    }
    if (block.startsWith("**") && block.endsWith("**")) {
      return (
        <p
          key={i}
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--color-text)",
            marginBottom: 8,
            marginTop: 16,
          }}
        >
          {block.slice(2, -2)}
        </p>
      );
    }
    if (block.startsWith("- ") || block.includes("\n- ")) {
      const items = block.split("\n").filter((l) => l.startsWith("- "));
      return (
        <ul
          key={i}
          style={{
            paddingLeft: 20,
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {items.map((item, j) => (
            <li
              key={j}
              style={{ fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.65 }}
            >
              {item.slice(2)}
            </li>
          ))}
        </ul>
      );
    }
    if (block.trim() === "") return null;
    return (
      <p
        key={i}
        style={{
          fontSize: 15,
          color: "var(--color-text-body)",
          lineHeight: 1.75,
          marginBottom: 16,
        }}
      >
        {block}
      </p>
    );
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = ARTICLES[slug];
  if (!article) notFound();

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-page)", padding: "0 0 80px" }}>
      <header
        style={{
          background: "var(--color-bg-card)",
          borderBottom: "1px solid var(--color-border)",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
              <path
                d="M1 8 Q3 3 5 8 Q7 13 9 8 Q11 3 13 8 Q15 13 17 8 Q19 3 21 8"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.01em" }}>
              FocusRoute
            </p>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", letterSpacing: "0.08em", fontWeight: 500 }}>
              {BRAIN_OS.headerEyebrow}
            </p>
          </div>
        </Link>
        <Link
          href="/"
          style={{ fontSize: 13, color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}
        >
          ← Start Brain OS
        </Link>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 0" }}>
        <Link
          href="/learn"
          style={{ fontSize: 13, color: "var(--color-text-muted)", textDecoration: "none", marginBottom: 20, display: "inline-block" }}
        >
          ← All articles
        </Link>

        <h1 style={{ fontSize: "clamp(24px, 5vw, 34px)", marginBottom: 12, marginTop: 8, color: "var(--color-text)" }}>
          {article.title}
        </h1>
        <p style={{ fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.6, marginBottom: 40 }}>
          {article.description}
        </p>

        <article style={{ marginBottom: 56 }}>
          {renderContent(article.content)}
        </article>

        <div
          style={{
            background: "var(--color-primary)",
            borderRadius: 16,
            padding: "28px 32px",
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
            Curious whether your profile matches ADHD patterns?
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              background: "#fff",
              color: "var(--color-primary)",
              fontWeight: 700,
              fontSize: 14,
              padding: "12px 28px",
              borderRadius: 10,
              textDecoration: "none",
            }}
          >
            Start {BRAIN_OS.lineTm} →
          </Link>
        </div>

        <div
          style={{
            marginTop: 56,
            paddingTop: 24,
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Link href="/learn" style={{ fontSize: 14, color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>
            ← Back to all articles
          </Link>
        </div>
      </main>
    </div>
  );
}
