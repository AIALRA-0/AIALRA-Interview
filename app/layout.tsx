import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "AIALRA Career Dojo";
const description =
  "从中美公司与岗位证据图谱，到能力缺口、定向面试训练和投递管理的个人求职作战系统。Evidence-driven U.S. and China organization research, skill-gap analysis, interview training, and application management.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const candidateHost =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    "localhost:3000";
  const host = /^[a-z0-9.-]+(?::\d+)?$/i.test(candidateHost)
    ? candidateHost
    : "localhost:3000";
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
  const protocol = isLocal && forwardedProtocol !== "https" ? "http" : "https";
  const origin = `${protocol}://${host}`;
  const socialImage = `${origin}/og-monochrome.png`;

  return {
    metadataBase: new URL(origin),
    applicationName: title,
    title: {
      default: title,
      template: `%s · ${title}`,
    },
    description,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      siteName: title,
      title,
      description,
      url: origin,
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: "AIALRA 求职道场 / Career Dojo — 从证据到掌握 / Evidence to Mastery",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
