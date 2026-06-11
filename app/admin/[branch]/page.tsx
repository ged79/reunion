'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getBranch } from '@/lib/mockData'
import { fetchPhotos, fetchNotices, fetchEvents, type Photo, type Notice, type Event } from '@/lib/supabase'

type ActivityItem = {
  id: string
  type: '사진' | '공지' | '행사'
  title: string
  created_at: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
}

export default function AdminDashboard() {
  const params = useParams()
  const branchSlug = params.branch as string

  const branch = getBranch(branchSlug)
  const [allPhotos, setAllPhotos] = useState<Photo[]>([])
  const [allNotices, setAllNotices] = useState<Notice[]>([])
  const [allEvents, setAllEvents] = useState<Event[]>([])

  useEffect(() => {
    const load = () => {
      fetchPhotos().then(setAllPhotos)
      fetchNotices().then(setAllNotices)
      fetchEvents().then(setAllEvents)
    }
    load()
    // 다른 화면에서 등록/삭제 후 돌아왔을 때 최신 데이터로 갱신
    const onVisible = () => {
      if (!document.hidden) load()
    }
    window.addEventListener('focus', load)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', load)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  // 같은 설명으로 함께 올린 사진 묶음은 한 줄로 합쳐 표시 (예: "21회 모임 (4장)")
  const photoGroups = new Map<string, { count: number; created_at: string; id: string }>()
  for (const p of allPhotos) {
    const key = p.caption || '사진 업로드'
    const g = photoGroups.get(key)
    if (g) g.count++
    else photoGroups.set(key, { count: 1, created_at: p.created_at, id: p.id })
  }
  const photoItems: ActivityItem[] = Array.from(photoGroups.entries())
    .slice(0, 2)
    .map(([caption, g]) => ({
      id: g.id,
      type: '사진' as const,
      title: g.count > 1 ? `${caption} (${g.count}장)` : caption,
      created_at: g.created_at,
    }))

  const recentActivity: ActivityItem[] = [
    ...photoItems,
    ...allNotices.slice(0, 2).map((n) => ({
      id: n.id,
      type: '공지' as const,
      title: n.title,
      created_at: n.created_at,
    })),
    ...allEvents.slice(0, 2).map((ev) => ({
      id: ev.id,
      type: '행사' as const,
      title: ev.title,
      created_at: ev.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const branchColor = branch?.color || '#1e40af'

  const typeColors: Record<string, string> = {
    사진: 'bg-purple-100 text-purple-700',
    공지: 'bg-orange-100 text-orange-700',
    행사: 'bg-green-100 text-green-700',
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">대시보드</h1>
        <p className="text-gray-500 text-sm mt-1">
          {branch?.name} 관리 현황
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 order-2 md:order-1">
          <h2 className="font-bold text-gray-900 mb-5">최근 활동</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">
              아직 등록된 콘텐츠가 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div
                  key={`${item.type}-${item.id}-${i}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${typeColors[item.type]}`}>
                    {item.type}
                  </span>
                  <span className="text-sm text-gray-700 flex-1 truncate">
                    {item.title}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatDate(item.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 order-1 md:order-2">
          <h2 className="font-bold text-gray-900 mb-5">빠른 작업</h2>
          <div className="space-y-2">
            <Link
              href={`/admin/${branchSlug}/members?action=new`}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-sm font-semibold"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              회원 등록
            </Link>
            <Link
              href={`/admin/${branchSlug}/photos?action=upload`}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 text-sm font-semibold"
            >
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              사진 업로드
            </Link>
            <Link
              href={`/admin/${branchSlug}/notices?action=new`}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 text-sm font-semibold"
            >
              <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              공지 작성
            </Link>
            <Link
              href={`/admin/${branchSlug}/events?action=new`}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-all duration-200 text-sm font-semibold"
            >
              <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              행사 등록
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
