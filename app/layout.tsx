import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { getBlogSettings } from "./actions"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getBlogSettings()

    return {
      title: settings?.site_title || "Blog",
      description: settings?.site_description || "A modern blog platform",
      icons: {
        icon: "/favicon.ico",
      },
      openGraph: {
        title: settings?.site_title || "Blog",
        description: settings?.site_description || "A modern blog platform",
      },
    }
  } catch (error) {
    console.error('Error in generateMetadata:', error)

    // 에러 발생 시 기본값 반환
    return {
      title: "Blog",
      description: "A modern blog platform",
    }
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await getBlogSettings()

  return (
    <html lang="ko">
      <head>
        {/* Google AdSense Script */}
        {settings?.adsense_enabled && settings.adsense_client_id && (
          <>
            <script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.adsense_client_id}`}
              crossOrigin="anonymous"
            />
          </>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
