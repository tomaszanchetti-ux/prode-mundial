import Script from "next/script";

const GTAG_DEFAULT_CONSENT = `
window.dataLayer = window.dataLayer || [];
function gtag(){ window.dataLayer.push(arguments); }
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 500
});
`;

export function GoogleConsentDefault() {
  return (
    <Script
      id="gtag-consent-default"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: GTAG_DEFAULT_CONSENT }}
    />
  );
}
