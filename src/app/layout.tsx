import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "Fardin's Math Academy - HSC Higher Math Practice",
  description: "Interactive MCQ practice platform for HSC Higher Math",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body className="antialiased bg-slate-50 text-slate-800">
        {children}
      </body>
    </html>
  );
}