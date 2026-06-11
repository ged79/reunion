'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getBranch } from '@/lib/mockData'
import { fetchNotices, fetchEvents, type Notice, type Event } from '@/lib/supabase'

type Tab = '전체' | '공지' | '행사'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function UpdatesPage() {
  const params = useParams()
  const branchSlug = params.branch as string
  const branch = getBranch(branchSlug)

  const [allNotices, setAllNotices] = useState<Notice[]>([])
  const [allEvents, setAllEvents] = useState<Event[]>([])

  useEffect(() => {
    fetchNotices().then(setAllNotices)
    fetchEvents().then(setAllEvents)
  }, [])

  const today = new Date().toISOString().split('T')[0]

  const [activeTab, setActiveTab] = useState<Tab>('전체')
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null)

  // Unified feed for 전체 tab — mix everything sorted by date desc
  const allItems = [
    ...allNotices.map((n) => ({ type: '공지' as const, date: n.created_at, id: n.id, data: n })),
    ...allEvents.map((e)  => ({ type: '행사' as const,  date: e.date,        id: e.id, data: e })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  const totalCount = allItems.length

  const tabs: { key: Tab; count: number }[] = [
    { key: '전체', count: totalCount },
    { key: '공지', count: allNotices.length },
    { key: '행사', count: allEvents.length },
  ]

  return (
    <div>
      {/* Page header */}
      <div
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${branch?.color}dd 0%, ${branch?.color}99 100%)` }}
      >
        <div className="max-w-5xl mx-auto px-4 py-14 relative z-10">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-white/60 mb-2">{branch?.name}</p>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">소식</h1>
          <p className="text-white/70 text-sm">공지사항, 행사일정, 활동소식을 한 곳에서 확인하세요.</p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-full opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" fill="white" className="w-full h-full">
            <circle cx="150" cy="50" r="80" /><circle cx="50" cy="150" r="60" />
          </svg>
        </div>
      </div>

      {/* Sticky tab bar */}
      <div className="border-b border-gray-100 bg-white sticky top-14 z-30">
        <div className="max-w-5xl mx-auto px-4 overflow-x-auto scrollbar-none">
          <div className="flex gap-1 py-2 w-max min-w-full">
            {tabs.map(({ key, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  activeTab === key ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
                style={activeTab === key && branch ? { backgroundColor: branch.color } : {}}
              >
                {key}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === key ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* 전체 tab — unified chronological feed */}
        {activeTab === '전체' && (
          <div className="space-y-3">
            {allItems.length === 0 ? (
              <div className="text-center py-28 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-400 font-medium">등록된 소식이 없습니다.</p>
              </div>
            ) : allItems.map((item) => {
              if (item.type === '공지') {
                const notice = item.data as typeof allNotices[0]
                const isExpanded = expandedNoticeId === notice.id
                return (
                  <div
                    key={`notice-${notice.id}`}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer ${
                      notice.important ? 'border-red-200 bg-red-50/50 hover:border-red-300' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                    }`}
                    onClick={() => setExpandedNoticeId((p) => (p === notice.id ? null : notice.id))}
                  >
                    <div className="flex items-center gap-3 px-5 py-4">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex-shrink-0">공지</span>
                      {notice.important && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white flex-shrink-0">중요</span>}
                      <span className="flex-1 font-semibold text-gray-900 leading-snug">{notice.title}</span>
                      <span className="text-xs text-gray-400 hidden sm:block flex-shrink-0">{formatDate(notice.created_at)}</span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {isExpanded && (
                      <div className="px-6 pb-5 pt-3 border-t border-gray-100 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap" onClick={(e) => e.stopPropagation()}>
                        {notice.content}
                      </div>
                    )}
                  </div>
                )
              }
              // 행사 (event)
              const event = item.data as typeof allEvents[0]
              const isPast = event.date < today
              const d = new Date(event.date)
              return (
                <div key={`event-${event.id}`} className={`flex gap-4 rounded-2xl border p-5 ${isPast ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}>
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white" style={{ backgroundColor: isPast ? '#d1d5db' : branch?.color }}>
                    <span className="text-lg font-black leading-none">{d.getDate()}</span>
                    <span className="text-xs opacity-80">{d.toLocaleDateString('ko-KR', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">행사</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isPast ? 'bg-gray-200 text-gray-500' : 'text-white'}`} style={!isPast ? { backgroundColor: branch?.color } : {}}>
                        {isPast ? '종료' : '예정'}
                      </span>
                    </div>
                    <h3 className={`font-bold text-sm leading-snug ${isPast ? 'text-gray-500' : 'text-gray-900'}`}>{event.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{event.location}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 공지 tab */}
        {activeTab === '공지' && (
          <div className="space-y-3">
            {allNotices.length === 0 ? (
              <div className="text-center py-28 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-400 font-medium">등록된 공지사항이 없습니다.</p>
              </div>
            ) : allNotices.map((notice) => {
              const isExpanded = expandedNoticeId === notice.id
              return (
                <div key={notice.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer ${
                    notice.important ? 'border-red-200 bg-red-50/50 hover:border-red-300 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                  }`}
                  onClick={() => setExpandedNoticeId((p) => (p === notice.id ? null : notice.id))}
                >
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: notice.important ? '#f87171' : '#e5e7eb' }} />
                    {notice.important && <span className="text-xs font-bold bg-red-100 text-red-600 px-2.5 py-1 rounded-full flex-shrink-0">중요</span>}
                    <span className="flex-1 font-semibold text-gray-900 leading-snug">{notice.title}</span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-gray-400 hidden sm:block">{formatDate(notice.created_at)}</span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className={`px-6 pb-5 border-t ${notice.important ? 'border-red-100' : 'border-gray-50'}`} onClick={(e) => e.stopPropagation()}>
                      <div className="pt-4 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{notice.content}</div>
                      <p className="text-xs text-gray-400 mt-4 sm:hidden">{formatDate(notice.created_at)}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 행사 tab */}
        {activeTab === '행사' && (
          <div className="space-y-4">
            {allEvents.length === 0 ? (
              <div className="text-center py-20 text-gray-400">등록된 행사가 없습니다.</div>
            ) : allEvents.map((event) => {
              const isPast = event.date < today
              const d = new Date(event.date)
              return (
                <div key={event.id} className={`flex gap-5 rounded-2xl border p-6 transition-all duration-200 ${isPast ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}>
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center" style={{ backgroundColor: isPast ? '#e5e7eb' : branch?.color, color: isPast ? '#9ca3af' : 'white' }}>
                    <span className="text-2xl font-black leading-none">{d.getDate()}</span>
                    <span className="text-xs opacity-80 mt-0.5">{d.toLocaleDateString('ko-KR', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className={`font-bold leading-snug text-base ${isPast ? 'text-gray-500' : 'text-gray-900'}`}>{event.title}</h3>
                      <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${isPast ? 'bg-gray-200 text-gray-500' : 'text-white'}`} style={!isPast ? { backgroundColor: branch?.color } : {}}>
                        {isPast ? '종료' : '예정'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{event.location}</span>
                      <span className="mx-1 text-gray-300">·</span>
                      <span>{d.getFullYear()}년 {d.toLocaleDateString('ko-KR', { month: 'long' })} {d.getDate()}일</span>
                    </div>
                    {event.description && <p className="text-sm text-gray-500">{event.description}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
