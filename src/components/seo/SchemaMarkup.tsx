export function SchemaMarkup() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is FocusRoute?",
        "acceptedAnswer": { "@type": "Answer", "text": "FocusRoute is an educational self-understanding and productivity-support experience. It helps you map focus patterns, friction points, and practical next steps through a guided assessment." }
      },
      {
        "@type": "Question",
        "name": "Is FocusRoute a medical diagnosis?",
        "acceptedAnswer": { "@type": "Answer", "text": "No. FocusRoute is not a diagnosis, medical test, therapy, or treatment. It is designed for self-understanding and productivity support." }
      },
      {
        "@type": "Question",
        "name": "How long does the assessment take?",
        "acceptedAnswer": { "@type": "Answer", "text": "The FocusRoute assessment takes about 3 minutes and gives you a preview before any purchase decision." }
      },
      {
        "@type": "Question",
        "name": "What do I get after the assessment?",
        "acceptedAnswer": { "@type": "Answer", "text": "You receive a preview of your FocusRoute pattern. If it feels useful, you can unlock the full Brain Profile with clearer language for your focus patterns and next-step recommendations." }
      },
      {
        "@type": "Question",
        "name": "Is there a guarantee?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes. FocusRoute offers a 7-day \"This Is Me\" guarantee. If your profile does not feel accurate to your lived experience, you can request a full refund." }
      }
    ]
  }

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "FocusRoute",
    "applicationCategory": "ProductivityApplication",
    "description": "An educational self-understanding and productivity-support assessment for mapping focus patterns, friction points, and practical next steps.",
    "url": "https://getfocusroute.com",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock"
    }
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
    </>
  )
}
