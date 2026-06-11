import { getBranch } from '@/lib/mockData'
import { notFound } from 'next/navigation'

export default async function ContactPage({ params }: { params: { branch: string } }) {
  const branch = getBranch(params.branch)
  if (!branch) notFound()

  return (
    <div>
      {/* Page header banner */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: branch.color }} />
            <h1 className="text-3xl font-black text-gray-900">연락처</h1>
          </div>
          <p className="text-gray-500 ml-4">궁금한 점이 있으시면 언제든지 연락해 주세요.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Info Cards */}
          <div className="space-y-4">
            {/* Branch identity */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                  style={{ backgroundColor: branch.color }}
                >
                  민통
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{branch.name}</h2>
                  <p className="text-sm text-gray-400 mt-0.5">{branch.region}</p>
                </div>
              </div>

              <div className="space-y-3">
                {branch.contact_email && (
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${branch.color}18` }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: branch.color }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-0.5">이메일</p>
                      <a
                        href={`mailto:${branch.contact_email}`}
                        className="text-sm font-semibold text-gray-900 hover:underline"
                        style={{ color: branch.color }}
                      >
                        {branch.contact_email}
                      </a>
                    </div>
                  </div>
                )}

                {branch.contact_phone && (
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${branch.color}18` }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: branch.color }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-0.5">전화</p>
                      <a
                        href={`tel:${branch.contact_phone}`}
                        className="text-sm font-semibold text-gray-900 hover:underline"
                      >
                        {branch.contact_phone}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${branch.color}18` }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: branch.color }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">지역</p>
                    <p className="text-sm font-semibold text-gray-900">{branch.region}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info message */}
            <div
              className="rounded-2xl p-5 border"
              style={{ backgroundColor: `${branch.color}0d`, borderColor: `${branch.color}30` }}
            >
              <h3 className="font-bold mb-2" style={{ color: branch.color }}>문의 안내</h3>
              <p className="text-sm leading-relaxed text-gray-700">
                민족통일청년회 {branch.region}에 관심을 가져주셔서 감사합니다.
                활동 참여, 행사 문의, 회원 가입 등 모든 문의사항은 위 연락처로 연락해 주시면
                성심껏 안내해 드리겠습니다.
              </p>
            </div>
          </div>

          {/* Map */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[360px] flex flex-col">
            <div className="flex-1 relative min-h-[280px]">
              <div className="relative w-full h-64 rounded-t-2xl overflow-hidden bg-gray-100 min-h-[280px]">
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(branch.region)}&output=embed&hl=ko`}
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                  title="위치 지도"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">{branch.region}</p>
              <a
                href={`https://map.kakao.com/link/search/${encodeURIComponent(branch.region)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ backgroundColor: '#FEE500', color: '#3C1E1E' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.48 3 2 6.92 2 11.75c0 3.03 1.78 5.7 4.5 7.27l-.9 3.35a.5.5 0 00.76.54l3.94-2.63A11.5 11.5 0 0012 20.5c5.52 0 10-3.92 10-8.75S17.52 3 12 3z" />
                </svg>
                카카오맵에서 보기
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Join CTA */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <div
          className="rounded-2xl p-8 text-center"
          style={{ backgroundColor: `${branch.color}0d`, border: `1px solid ${branch.color}30` }}
        >
          <h3 className="text-lg font-bold text-gray-900 mb-2">회원이 되고 싶으신가요?</h3>
          <p className="text-sm text-gray-600">
            민족통일청년회 {branch.region}에 함께해 주세요. 위 연락처로 문의해 주시면 담당자가 안내해 드립니다.
          </p>
        </div>
      </div>
    </div>
  )
}
