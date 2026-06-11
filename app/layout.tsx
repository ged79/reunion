import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'

const notoSansKR = Noto_Sans_KR({ subsets: ['latin'], weight: ['400', '500', '700', '900'] })

export const metadata: Metadata = {
  title: {
    template: '%s | 민통 지회',
    default: '민통 지회 사이트',
  },
  description: '민족통일청년회 지회 공식 사이트 — 평화통일 운동의 중심',
  keywords: ['민족통일청년회', '민통', '평화통일', '지회', '통일운동'],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🕊️</text></svg>",
  },
  openGraph: {
    title: '민통 지회 사이트',
    description: '민족통일청년회 지회 공식 사이트 — 평화통일 운동의 중심',
    locale: 'ko_KR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={`min-h-screen bg-gray-50 ${notoSansKR.className}`}>{children}</body>
    </html>
  )
}
