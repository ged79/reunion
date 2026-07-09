'use client'

// 메인 화면 "최신 영상" 섹션 — 가장 최근 등록된 영상 1개를 16:9 대형 슬롯으로 표시
// 클릭 전에는 유튜브 썸네일만 로드(facade), 클릭하면 그 자리에서 플레이어로 전환해 즉시 재생

import { useState } from 'react'
import Image from 'next/image'

export default function FeaturedVideo({
  youtubeId,
  caption,
  color,
}: {
  youtubeId: string
  caption: string | null
  color: string
}) {
  const [playing, setPlaying] = useState(false)

  return (
    <section className="max-w-6xl mx-auto px-4 pb-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-7 rounded-full" style={{ backgroundColor: color }} />
        <h2 className="text-2xl font-bold text-gray-900">최신 영상</h2>
      </div>

      <div className="relative w-full rounded-2xl overflow-hidden shadow-lg bg-black" style={{ aspectRatio: '16 / 9' }}>
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
            title={caption || '최신 영상'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 w-full h-full group cursor-pointer"
            aria-label="영상 재생"
          >
            {/* maxresdefault가 없는 영상도 있어 hqdefault 사용 (모든 영상에서 보장) */}
            <Image
              src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
              alt={caption || '최신 영상'}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              sizes="(max-width: 1152px) 100vw, 1152px"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-9 h-9 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            {caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-left">
                <p className="text-white font-semibold text-sm md:text-base">{caption}</p>
              </div>
            )}
          </button>
        )}
      </div>
    </section>
  )
}
