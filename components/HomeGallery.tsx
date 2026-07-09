'use client'

// 메인 화면 사진 갤러리 그리드
// - 사진: 클릭 시 갤러리 페이지로 이동
// - 영상: 클릭 시 그 자리에서 유튜브 플레이어로 전환 (facade 패턴 — 클릭 전에는 iframe을 로드하지 않아 첫 화면이 가벼움)
// - 한 번에 하나만 재생: 다른 영상을 누르면 이전 플레이어는 썸네일로 복귀

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Photo } from '@/lib/supabase'

export default function HomeGallery({ photos, branchSlug }: { photos: Photo[]; branchSlug: string }) {
  const [playingId, setPlayingId] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {photos.map((photo) => {
        const isVideo = photo.media_type === 'video' && photo.youtube_id

        // 재생 중인 영상: 썸네일 대신 플레이어를 그 자리에 표시
        if (isVideo && playingId === photo.id) {
          return (
            <div
              key={photo.id}
              className="relative rounded-2xl overflow-hidden shadow-xl bg-black aspect-square"
            >
              <iframe
                src={`https://www.youtube.com/embed/${photo.youtube_id}?autoplay=1&rel=0`}
                title={photo.caption || '영상'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
              {/* 닫기: 썸네일로 복귀 */}
              <button
                onClick={() => setPlayingId(null)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-black/90 transition-colors z-10"
                title="닫기"
              >
                ✕
              </button>
            </div>
          )
        }

        const thumbnail = (
          <div className="relative aspect-square bg-gray-200">
            <Image
              src={photo.image_url}
              alt={photo.caption || '사진'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
            {!isVideo && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            )}
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-xs text-white font-medium truncate">{photo.caption}</p>
              </div>
            )}
          </div>
        )

        // 영상: 제자리 재생 버튼
        if (isVideo) {
          return (
            <button
              key={photo.id}
              onClick={() => setPlayingId(photo.id)}
              className="rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer block w-full text-left"
            >
              {thumbnail}
            </button>
          )
        }

        // 사진: 갤러리 페이지로 이동
        return (
          <Link
            key={photo.id}
            href={`/${branchSlug}/photos`}
            className="rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer block"
          >
            {thumbnail}
          </Link>
        )
      })}
    </div>
  )
}
