'use client'

// 사진 큰 화면 보기 (라이트박스) — 소식 목록·소식 상세 페이지 공용
import { useEffect } from 'react'
import Image from 'next/image'
import type { Photo } from '@/lib/supabase'

export default function Lightbox({
  photos, index, onClose, onIndex,
}: { photos: Photo[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onIndex((index - 1 + photos.length) % photos.length)
      if (e.key === 'ArrowRight') onIndex((index + 1) % photos.length)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [index, photos.length, onClose, onIndex])

  const photo = photos[index]
  // 이전/다음 사진 미리 로드 → 넘길 때 깜빡임 방지
  const neighbors =
    photos.length > 1
      ? [photos[(index - 1 + photos.length) % photos.length], photos[(index + 1) % photos.length]]
      : []
  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      {photos.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + photos.length) % photos.length) }} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % photos.length) }} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}
      <div className="relative max-w-4xl w-full mx-14" onClick={(e) => e.stopPropagation()}>
        {/* next/image 최적화 서빙 — 원본(수 MB) 대신 리사이즈본 로드로 모바일 깜빡임 해소 */}
        <Image
          src={photo.image_url}
          alt={photo.caption || '사진'}
          width={1280}
          height={960}
          quality={80}
          sizes="100vw"
          priority
          className="max-w-full max-h-[80vh] w-auto h-auto mx-auto rounded-xl object-contain shadow-2xl"
        />
        {/* 이웃 사진 프리로드 (숨김) */}
        <div className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
          {neighbors.map((p) => (
            <Image key={p.id} src={p.image_url} alt="" width={1280} height={960} quality={80} sizes="100vw" loading="eager" />
          ))}
        </div>
        {photo.caption && <p className="text-white/80 text-center mt-4 text-sm font-medium">{photo.caption}</p>}
        <p className="text-white/40 text-center mt-1 text-xs">{index + 1} / {photos.length}</p>
      </div>
    </div>
  )
}
