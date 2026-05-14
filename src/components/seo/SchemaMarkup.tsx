export function SchemaMarkup() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is this ADHD test free?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes. The FocusRoute ADHD assessment is completely free to take. You receive your symptom level and profile summary at no cost. A detailed report with a personalized guide is available for a one-time fee." }
      },
      {
        "@type": "Question",
        "name": "How accurate is an online ADHD test?",
        "acceptedAnswer": { "@type": "Answer", "text": "Online ADHD assessments like FocusRoute are screening tools based on validated clinical criteria (DSM-5). They are not a medical diagnosis but can identify symptom patterns and help you understand whether a professional evaluation is appropriate." }
      },
      {
        "@type": "Question",
        "name": "What types of ADHD are there?",
        "acceptedAnswer": { "@type": "Answer", "text": "There are three main presentations: Predominantly Inattentive (difficulty focusing, forgetfulness), Predominantly Hyperactive-Impulsive (restlessness, impulsivity), and Combined Presentation (both inattention and hyperactivity symptoms)." }
      },
      {
        "@type": "Question",
        "name": "How long does the ADHD assessment take?",
        "acceptedAnswer": { "@type": "Answer", "text": "FocusRoute's assessment takes approximately 3 minutes. It consists of 20 carefully selected questions covering attention, executive function, emotional regulation, and daily impact." }
      },
      {
        "@type": "Question",
        "name": "Can adults have ADHD?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes. ADHD is a lifelong neurodevelopmental condition. Approximately 4–5% of adults worldwide have ADHD, though many remain undiagnosed. Symptoms often look different in adults than in children." }
      }
    ]
  }

  const medicalSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "name": "FocusRoute ADHD Assessment",
    "description": "A free online ADHD screening tool based on DSM-5 criteria for adults.",
    "url": "https://getfocusroute.com",
    "medicalAudience": { "@type": "MedicalAudience", "audienceType": "Patient" },
    "about": {
      "@type": "MedicalCondition",
      "name": "Attention Deficit Hyperactivity Disorder",
      "alternateName": "ADHD",
      "code": { "@type": "MedicalCode", "codeValue": "F90", "codingSystem": "ICD-10" }
    }
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalSchema) }} />
    </>
  )
}
