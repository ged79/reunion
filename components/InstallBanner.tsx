'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallBanner({ color }: { color: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    // 이미 설치됨 or 이전에 닫음
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (sessionStorage.getItem('install-dismissed')) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // 미설치 상태면 항상 배너 표시 — APK 다운로드는 beforeinstallprompt와 무관하게 노출
    // (이미 앱 설치됨/브라우저 조건에 따라 이벤트가 아예 안 오는 경우가 많음)
    setDismissed(false)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (dismissed) return null

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDismissed(true)
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    setDismissed(true)
    sessionStorage.setItem('install-dismissed', '1')
  }

  const isIos = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="relative rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
        {/* 모바일: 세로 쌓임 / 넓은 화면: 한 줄 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pr-6 sm:pr-8">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-black" style={{ backgroundColor: color }}>
              앱
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">앱으로 설치하기</p>
              {isIos ? (
                <p className="text-xs text-gray-500 mt-0.5">
                  Safari 하단 <b>공유 버튼(↑)</b> → <b>&quot;홈 화면에 추가&quot;</b>를 눌러 설치하세요.
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-0.5">
                  홈 화면에 추가하면 앱처럼 빠르게 이용할 수 있습니다.
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {deferredPrompt && (
              <button
                onClick={handleInstall}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors"
                style={{ backgroundColor: color }}
              >
                설치
              </button>
            )}
            <a
              href="/mintong-yeongdong.apk"
              download
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-sm font-semibold border-2 text-center transition-colors hover:opacity-80"
              style={{ borderColor: color, color }}
            >
              APK 다운로드
            </a>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-gray-300 hover:text-gray-500 transition-colors"
          aria-label="닫기"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
