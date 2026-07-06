import { getBranch, getBranchPhotos, getBranchNotices, getBranchEvents } from '@/lib/mockData'
import NoticePopup from '@/components/NoticePopup'
import InstallBanner from '@/components/InstallBanner'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}


export default async function BranchHomePage({ params }: { params: { branch: string } }) {
  const branch = getBranch(params.branch)
  if (!branch) notFound()

  // 공지·행사·사진을 동시에 조회 (순차 → 병렬, 첫화면 로딩 단축)
  const [allPhotos, allEvents, allNotices] = await Promise.all([
    getBranchPhotos(branch.id),
    getBranchEvents(branch.id),
    getBranchNotices(branch.id),
  ])

  const photos = allPhotos.slice(0, 6)
  // fetchEvents가 행사일 내림차순으로 반환 → 가장 최근 행사가 맨 앞
  const recentEvents = allEvents.slice(0, 3)

  // 공지 최신 3개
  const recentFeed = allNotices
    .map((n) => ({ type: '공지' as const, date: n.created_at, title: n.title, important: n.important, id: n.id }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)
  const importantNotice = allNotices.find((n) => n.important) ?? null


  return (
    <div>
      {importantNotice && (
        <NoticePopup notice={importantNotice} branchColor={branch.color} />
      )}
      {/* Hero Section */}
      <section className="bg-white overflow-hidden border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between min-h-[200px] md:min-h-[260px]">
          {/* Left: Text */}
          <div className="py-10 md:py-14 flex-1">
            <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-gray-400 mb-3">
              {branch.region}
            </p>
            <h1 className="text-2xl md:text-5xl font-black leading-tight tracking-tighter text-gray-900 mb-3">
              {branch.name.split(' ')[0]}
              <br />
              {branch.name.split(' ').slice(1).join(' ')}
            </h1>
            <div className="w-8 h-[3px] rounded-full mb-3" style={{ backgroundColor: branch.color }} />
            {branch.description && (
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                {branch.description}
              </p>
            )}
          </div>

          {/* Right: Peninsula image */}
          <div className="flex-shrink-0 w-36 md:w-56 h-[200px] md:h-[260px] relative">
            <Image
              src={`/hero-${branch.slug}.jpg`}
              alt="한반도"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </section>


      {/* 소식 — 공지 + 최근 행사 통합 섹션 */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 rounded-full" style={{ backgroundColor: branch.color }} />
            <h2 className="text-2xl font-bold text-gray-900">최근 소식</h2>
          </div>
          <Link
            href={`/${branch.slug}/updates`}
            className="text-sm font-medium hover:underline transition-colors"
            style={{ color: branch.color }}
          >
            더보기 →
          </Link>
        </div>
        <div className="space-y-2">
          {recentFeed.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={`/${branch.slug}/updates`}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all duration-200 hover:shadow-sm ${
                item.important
                  ? 'bg-red-50/50 border-red-100 hover:border-red-200'
                  : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
              style={item.important ? { borderLeftWidth: 4, borderLeftColor: '#f87171' } : { borderLeftWidth: 4, borderLeftColor: '#e5e7eb' }}
            >
              <span className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-600">
                공지
              </span>
              {item.important && (
                <span className="flex-shrink-0 text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">중요</span>
              )}
              <span className="flex-1 font-medium text-gray-800 truncate">{item.title}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(item.date)}</span>
            </Link>
          ))}
        </div>

        {/* 최근 행사 카드 — 공지 목록 바로 아래 */}
        {recentEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
              {recentEvents.map((event) => {
                const d = new Date(event.date)
                const month = d.toLocaleDateString('ko-KR', { month: 'short' })
                const day = d.getDate()
                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 flex gap-4"
                  >
                    <div
                      className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white"
                      style={{ backgroundColor: branch.color }}
                    >
                      <span className="text-xl font-black leading-none">{day}</span>
                      <span className="text-xs opacity-80 mt-0.5">{month}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 mb-1 leading-snug text-sm line-clamp-2">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{event.location}</span>
                      </div>
                      {event.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </section>

      {/* Photo Gallery */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-7 rounded-full" style={{ backgroundColor: branch.color }} />
              <h2 className="text-2xl font-bold text-gray-900">사진 갤러리</h2>
            </div>
            <Link
              href={`/${branch.slug}/photos`}
              className="text-sm font-medium hover:underline transition-colors"
              style={{ color: branch.color }}
            >
              더보기 →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer"
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
                    <svg
                      className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
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
        </div>
      </section>

      {/* PWA Install Banner */}
      <InstallBanner color={branch.color} />

    </div>
  )
}
