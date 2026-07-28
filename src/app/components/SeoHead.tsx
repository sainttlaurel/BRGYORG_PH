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
        {JSON.stringify({
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
        })}
      </script>
    </Helmet>
  );
}
