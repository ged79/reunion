'use client'

import { useState, useEffect } from 'react'
import type { Notice } from '@/lib/supabase'

interface NoticePopupProps {
  notice: Notice
  branchColor: string
}

export default function NoticePopup({ notice, branchColor }: NoticePopupProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const storageKey = `notice-popup-dismissed-${notice.id}`
    const today = new Date().toISOString().split('T')[0]
    const dismissed = localStorage.getItem(storageKey)
    if (dismissed === today) return

    const timer = setTimeout(() => setVisible(true), 500)
    return () => clearTimeout(timer)
  }, [notice.id])

  const handleDismissToday = () => {
    const storageKey = `notice-popup-dismissed-${notice.id}`
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(storageKey, today)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setVisible(false)}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden z-10">
        {/* Colored header bar */}
        <div className="px-6 py-4 text-white" style={{ backgroundColor: branchColor }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">중요 공지</span>
            <button
              onClick={() => setVisible(false)}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              aria-label="닫기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h2 className="font-bold text-lg mt-2 leading-snug">{notice.title}</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{notice.content}</p>
        </div>

        {/* Footer buttons */}
        <div className="px-6 pb-5 flex items-center justify-between gap-3">
          <button
            onClick={handleDismissToday}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline-offset-2 hover:underline"
          >
            오늘 하루 보지 않기
          </button>
          <button
            onClick={() => setVisible(false)}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: branchColor }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
