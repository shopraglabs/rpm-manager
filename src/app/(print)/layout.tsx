import type { Metadata } from "next"

export const metadata: Metadata = {
  title: { default: "Print | RPM Manager", template: "%s | RPM Manager" },
}

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white; }
            @page { margin: 0.75in; size: letter portrait; }
          }
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            color: #0f172a;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
