import { Helmet } from "react-helmet-async";

interface SeoHeadProps {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  ogType?: string;
}

const SITE_NAME = "Barangay Payatas — Digital Portal";
const SITE_URL = "https://barangay-payatas-qcdevv.vercel.app";

export default function SeoHead({ title, description, path = "", ogImage, ogType = "website" }: SeoHeadProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = path ? `${SITE_URL}${path}` : SITE_URL;
  const image = ogImage || `${SITE_URL}/img/hero.png`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <script type="application/ld+json">
        {JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "GovernmentOrganization",
            name: "Barangay Payatas",
            description: "Digital portal for Barangay Payatas, Quezon City — document requests, community services, and resident management.",
            url: SITE_URL,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Quezon City",
              addressRegion: "Metro Manila",
              addressCountry: "PH",
            },
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+63-2-8123-4567",
              contactType: "customer service",
              email: "payatas.ledger@qc.gov.ph",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE_NAME,
            url: SITE_URL,
            description: "Online barangay services — document requests, resident registry, community engagement.",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `${SITE_URL}/registry?q={search_term_string}`,
              },
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "How do I request a barangay document?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Choose a service on the Services page, fill out the online form, receive a reference number, and pick up your document at the barangay hall when ready.",
                },
              },
              {
                "@type": "Question",
                name: "What are the fees for barangay services?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Services are priced per document — no bundled plans. Barangay Clearance is ₱50, Certificate is ₱30, Certificate of Indigency is free. See full price list on the Services page.",
                },
              },
              {
                "@type": "Question",
                name: "What is the cancellation and refund policy?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "All fees are non-refundable once document processing begins. For questions, contact the barangay office at +63 2 8123 4567 or payatas.ledger@qc.gov.ph.",
                },
              },
              {
                "@type": "Question",
                name: "What customer support options are available?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Emergency hotline 911 for urgent concerns. Main hotline +63 2 8123 4567 and email payatas.ledger@qc.gov.ph with responses within 1 business day. Office hours Monday to Friday 8:00 AM to 5:00 PM.",
                },
              },
            ],
          },
        ])}
      </script>
    </Helmet>
  );
}
