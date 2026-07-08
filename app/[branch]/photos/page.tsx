'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { getBranch } from '@/lib/mockData'
import { fetchPhotos, fetchEvents, fetchNotices, type Photo, type Event, type Notice } from '@/lib/supabase'

export default function PhotosPage() {
  const params = useParams()
  const branchSlug = params.branch as string
  const branch = getBranch(branchSlug)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [filterId, setFilterId] = useState('')

  useEffect(() => {
    fetchPhotos().then(setPhotos)
    fetchEvents().then(setEvents)
    fetchNotices().then(setNotices)
  }, [])

  // 글(행사/공지)별 사진 수 — 사진이 있는 글만 드롭다운에 노출
  const photoCountByPost = new Map<string, number>()
  for (const p of photos) {
    if (p.event_id) photoCountByPost.set(p.event_id, (photoCountByPost.get(p.event_id) || 0) + 1)
  }
  const filterOptions = [
    ...events
      .filter((e) => photoCountByPost.has(e.id))
      .map((e) => ({ id: e.id, label: `[${e.date}] ${e.title}`, count: photoCountByPost.get(e.id)! })),
    ...notices
      .filter((n) => photoCountByPost.has(n.id))
      .map((n) => ({ id: n.id, label: `[${n.created_at.slice(0, 10)}] ${n.title}`, count: photoCountByPost.get(n.id)! })),
  ]

  const visiblePhotos = filterId ? photos.filter((p) => p.event_id === filterId) : photos

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)
  const prevPhoto = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + visiblePhotos.length) % visiblePhotos.length)
    }
  }
  const nextPhoto = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % visiblePhotos.length)
    }
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') prevPhoto()
      if (e.key === 'ArrowRight') nextPhoto()
    }
    window.addEventListener('keydown', handleKey)
    // 라이트박스 열림 동안 배경 스크롤 잠금 (모바일 주소창 요동/배경 스크롤 방지)
    if (lightboxIndex !== null) document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [lightboxIndex])

  const currentPhoto = lightboxIndex !== null ? visiblePhotos[lightboxIndex] : null
  // 이전/다음 사진 미리 로드 → 넘길 때 깜빡임 방지
  const neighborPhotos =
    lightboxIndex !== null && visiblePhotos.length > 1
      ? [
          visiblePhotos[(lightboxIndex - 1 + visiblePhotos.length) % visiblePhotos.length],
          visiblePhotos[(lightboxIndex + 1) % visiblePhotos.length],
        ]
      : []

  return (
    <div>
      {/* Page header banner */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: branch?.color }} />
            <h1 className="text-3xl font-black text-gray-900">사진 갤러리</h1>
          </div>
          <p className="text-gray-500 ml-4">{branch?.name}의 활동 사진을 확인하세요.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* 행사/공지별 필터 */}
        {photos.length > 0 && (
          <div className="mb-6">
            <select
              value={filterId}
              onChange={(e) => {
                setFilterId(e.target.value)
                setLightboxIndex(null)
              }}
              className="w-full sm:w-auto sm:min-w-[320px] px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 transition-shadow"
              style={{ '--tw-ring-color': branch?.color } as React.CSSProperties}
            >
              <option value="">전체 사진 ({photos.length}장)</option>
              {filterOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label} ({o.count}장)
                </option>
              ))}
            </select>
          </div>
        )}

        {photos.length === 0 ? (
          <div className="text-center py-28 bg-white rounded-2xl border border-gray-100">
            <svg
              className="w-20 h-20 text-gray-200 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-400 font-medium text-lg">아직 등록된 사진이 없습니다.</p>
            <p className="text-gray-300 text-sm mt-1">곧 사진을 업로드할 예정입니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {visiblePhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                <div className="relative aspect-square bg-gray-200">
                  <Image
                    src={photo.image_url}
                    alt={photo.caption || '사진'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-xs text-white font-medium truncate">{photo.caption}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {currentPhoto && lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
          style={{ transform: 'translateZ(0)', WebkitBackfaceVisibility: 'hidden' }}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Prev */}
          {visiblePhotos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevPhoto() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Next */}
          {visiblePhotos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextPhoto() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <div
            className="relative max-w-4xl w-full mx-14"
            onClick={(e) => e.stopPropagation()}
          >
            {/* next/image 최적화 서빙 — 원본(수 MB) 대신 리사이즈본 로드로 모바일 깜빡임 해소 */}
            <Image
              src={currentPhoto.image_url}
              alt={currentPhoto.caption || '사진'}
              width={1280}
              height={960}
              quality={80}
              sizes="100vw"
              priority
              className="max-w-full max-h-[80vh] w-auto h-auto mx-auto rounded-xl object-contain shadow-2xl"
            />
            {/* 이웃 사진 프리로드 (숨김) */}
            <div className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
              {neighborPhotos.map((p) => (
                <Image key={p.id} src={p.image_url} alt="" width={1280} height={960} quality={80} sizes="100vw" loading="eager" />
              ))}
            </div>
            {currentPhoto.caption && (
              <p className="text-white/80 text-center mt-4 text-sm font-medium">
                {currentPhoto.caption}
              </p>
            )}
            <p className="text-white/40 text-center mt-1 text-xs">
              {lightboxIndex + 1} / {visiblePhotos.length}
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
