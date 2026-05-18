export function SchemaMarkup() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the FocusRoute Brain OS?",
        "acceptedAnswer": { "@type": "Answer", "text": "FocusRoute Brain OS is a brain-first ADHD profiling system. It starts with a Cognitive Mapping Assessment and unlocks a personalized Brain Profile with a 28-day protocol tailored to your cognitive patterns." }
      },
      {
        "@type": "Question",
        "name": "Is FocusRoute a medical diagnosis?",
        "acceptedAnswer": { "@type": "Answer", "text": "No. FocusRoute is a screening and profiling experience, not a medical diagnosis. It helps identify symptom patterns and can support a conversation with a licensed clinician." }
      },
      {
        "@type": "Question",
        "name": "How long does the Brain OS mapping take?",
        "acceptedAnswer": { "@type": "Answer", "text": "The Cognitive Mapping Assessment takes about 12 minutes and is designed to map attention, executive function, emotional regulation, and daily behavior patterns." }
      },
      {
        "@type": "Question",
        "name": "What do I get after mapping my profile?",
        "acceptedAnswer": { "@type": "Answer", "text": "You unlock a detailed Brain Profile, an Executive Function Radar, your ADHD Signature, and a personalized 28-day protocol with practical daily actions." }
      },
      {
        "@type": "Question",
        "name": "Is there a guarantee?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes. FocusRoute offers a 7-day \"This Is Me\" guarantee. If your profile does not feel accurate to your lived experience, you can request a full refund." }
      }
    ]
  }

  const medicalSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "name": "FocusRoute Brain OS",
    "description": "A brain-first ADHD profiling system with cognitive mapping and a personalized 28-day protocol for adults.",
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
