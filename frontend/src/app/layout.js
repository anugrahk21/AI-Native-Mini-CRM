import "./globals.css";
import AIChatPanel from '@/components/layout/AIChatPanel';

export const metadata = {
  title: "crm.ai — AI-Native Mini CRM",
  description: "Intelligently reach your shoppers with AI-powered segmentation, personalized campaigns, and real-time performance analytics.",
  keywords: "CRM, AI, marketing, campaigns, customer segmentation, WhatsApp, SMS, Email",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
        <AIChatPanel />
      </body>
    </html>
  );
}
