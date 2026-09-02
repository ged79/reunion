'use client'

// 소식 상세 페이지 — 메인에서 공지/행사를 클릭하면 목록 대신 이 페이지로 바로 이동
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getBranch } from '@/lib/mockData'
import Lightbox from '@/components/Lightbox'
import { fetchNotices, fetchEvents, fetchPhotos, type Notice, type Event, type Photo } from '@/lib/supabase'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function UpdateDetailPage() {
  const params = useParams()
  const branchSlug = params.branch as string
  const itemId = params.id as string
  const branch = getBranch(branchSlug)

  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([fetchNotices(), fetchEvents(), fetchPhotos()]).then(([notices, events, allPhotos]) => {
      const n = notices.find((x) => x.id === itemId) ?? null
      const e = events.find((x) => x.id === itemId) ?? null
      setNotice(n)
      setEvent(e)
      if (e) setPhotos(allPhotos.filter((p) => p.event_id === e.id))
      setLoading(false)
    })
  }, [itemId])

  const today = new Date().toISOString().split('T')[0]
  const isPast = event ? event.date < today : false

  return (
    <div className="min-h-[60vh]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* 뒤로가기 */}
        <Link
          href={`/${branchSlug}/updates`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          소식 목록
        </Link>

        {loading ? (
          <div className="py-24 text-center text-gray-400">불러오는 중...</div>
        ) : !notice && !event ? (
          <div className="py-24 text-center">
            <p className="text-gray-500 font-semibold mb-4">소식을 찾을 수 없습니다.</p>
            <Link
              href={`/${branchSlug}/updates`}
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: branch?.color }}
            >
              소식 목록으로
            </Link>
          </div>
        ) : (
          <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* 헤더 */}
            <div className="px-6 sm:px-8 pt-7 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {notice ? (
                  <>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">공지</span>
                    {notice.important && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500 text-white">중요</span>}
                  </>
                ) : (
                  <>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">행사</span>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${isPast ? 'bg-gray-200 text-gray-500' : 'text-white'}`}
                      style={!isPast ? { backgroundColor: branch?.color } : {}}
                    >
                      {isPast ? '종료' : '예정'}
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">
                {notice ? notice.title : event!.title}
              </h1>
              <div className="flex items-center gap-3 flex-wrap mt-3 text-sm text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(notice ? notice.created_at : event!.date)}
                </span>
                {event?.location && (
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.location}
                  </span>
                )}
              </div>
            </div>

            {/* 본문 */}
            {(notice?.content || event?.description) && (
              <div className="px-6 sm:px-8 py-6 text-gray-700 text-[15px] leading-relaxed whitespace-pre-line">
                {(notice ? notice.content : event!.description!).trim()}
              </div>
            )}

            {/* 행사 사진 */}
            {photos.length > 0 && (
              <div className="px-6 sm:px-8 pb-7">
                <p className="text-sm font-bold text-gray-900 mb-3">사진 {photos.length}장</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {photos.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => setLightbox(i)}
                      className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group"
                    >
                      <Image
                        src={p.image_url}
                        alt={p.caption || '사진'}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </article>
        )}
      </div>

      {lightbox !== null && (
        <Lightbox
          photos={photos}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndex={(i) => setLightbox(i)}
        />
      )}
    </div>
  )
}
