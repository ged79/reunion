import { getBranch, getBranchMembers } from '@/lib/mockData'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const businessAreas = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: '정부 정책 설명회',
    desc: '정부 통일 정책을 지역사회에 설명·홍보',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: '지역사회 통합',
    desc: '지역사회 다양한 계층과의 소통 및 통합 활동',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    title: '통일 지도자 양성',
    desc: '차세대 통일 운동 지도자 교육 및 육성',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: '청소년 문화활동',
    desc: '미래세대 대상 통일 문화·체험 프로그램 운영',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: '통일 대비 사업',
    desc: '통일 이후를 대비한 실천적 준비 활동',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: '공공교육 및 안보의식',
    desc: '안보 의식 제고를 위한 교육·캠페인 전개',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    title: '정책 연구',
    desc: '통일 관련 정책 연구 및 제안',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: '조직 역량 강화',
    desc: '지회 조직 역량 향상 및 네트워크 강화',
  },
]

export default async function AboutPage({ params }: { params: { branch: string } }) {
  const branch = getBranch(params.branch)
  if (!branch) notFound()

  const members = await getBranchMembers(branch.id)
  const leaders = members.filter((m) => m.category === '지도부')

  return (
    <div>
      {/* 1. Mission Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${branch.color}ee 0%, ${branch.color}bb 100%)`,
        }}
      >
        <div className="max-w-5xl mx-auto px-4 py-14 relative z-10">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-white/60 mb-2">
            {branch.region}
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{branch.name}</h1>
          <p className="text-white/80 text-lg font-medium">평화통일 운동의 중심</p>
        </div>
        <div className="absolute right-0 top-0 w-72 h-full opacity-10">
          <svg viewBox="0 0 200 200" fill="white" className="w-full h-full">
            <circle cx="160" cy="40" r="90" />
            <circle cx="40" cy="160" r="70" />
          </svg>
        </div>
      </div>

      {/* 2. 조직 소개 */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-7 rounded-full" style={{ backgroundColor: branch.color }} />
          <h2 className="text-2xl font-bold text-gray-900">조직 소개</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              민족통일청년회는 <strong>1981년 창설</strong>된 초당적·범국민적 조직으로,
              평화통일을 향한 국민적 열망을 모아 실천적 통일 운동을 펼쳐 왔습니다.
            </p>
            <p>
              전국 230개 시군구에 걸쳐 10만여 명의 회원이 활동하며, 정부의 통일 정책을
              지역사회에 전달하고 통일 기반 조성을 위한 다양한 사업을 추진합니다.
            </p>
            <p>
              {branch.name}은 충청북도 {branch.region}을 중심으로 지역민과 함께
              통일의 꿈을 키워 나가고 있습니다.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {[
              { label: '창설연도', value: '1981년' },
              { label: '전국회원', value: '10만여 명' },
              { label: '전국조직', value: '230개 시군구' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: branch.color }}
                />
                <span className="text-sm text-gray-500 font-medium">{stat.label}</span>
                <span className="ml-auto text-base font-black text-gray-900">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 주요 사업 */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-7 rounded-full" style={{ backgroundColor: branch.color }} />
            <h2 className="text-2xl font-bold text-gray-900">주요 사업</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {businessAreas.map((area) => (
              <div
                key={area.title}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-start gap-3 hover:shadow-md transition-shadow"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${branch.color}15`, color: branch.color }}
                >
                  {area.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{area.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{area.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. 지회 임원 */}
      {leaders.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-7 rounded-full" style={{ backgroundColor: branch.color }} />
            <h2 className="text-2xl font-bold text-gray-900">지회 임원</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {leaders.map((member) => {
              const initials = member.name.slice(0, 1)
              return (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center text-center"
                >
                  {member.photo_url ? (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden mb-3 ring-4 ring-gray-100">
                      <Image src={member.photo_url} alt={member.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black mb-3 ring-4 ring-gray-100"
                      style={{ backgroundColor: branch.color }}
                    >
                      {initials}
                    </div>
                  )}
                  <p className="font-bold text-gray-900 text-base">{member.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{member.role}</p>
                  {member.company && (
                    <p className="text-xs text-gray-500 mt-1">{member.company}</p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 5. CTA */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-3">함께 통일을 준비합시다</h2>
          <p className="text-gray-500 leading-relaxed">
            민족통일청년회 {branch.region}과 함께 평화통일의 꿈을 이루어 나가세요.
            가입 문의는 연락처 페이지를 통해 해주세요.
          </p>
        </div>
      </section>
    </div>
  )
}
