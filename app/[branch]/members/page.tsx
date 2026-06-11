'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { getBranch } from '@/lib/mockData'
import Link from 'next/link'
import { fetchMembers, getSessionUser, type Member } from '@/lib/supabase'

function MemberModal({ member, branch, onClose }: { member: Member; branch: ReturnType<typeof getBranch>; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="font-bold text-gray-900">회원 정보</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Profile — 사진 크게 */}
        <div className="flex flex-col items-center pt-6 pb-4 px-5">
          {member.photo_url ? (
            <div className="relative w-40 h-40 rounded-2xl overflow-hidden mb-4 ring-4 ring-gray-100 shadow-md">
              <Image src={member.photo_url} alt={member.name} fill className="object-cover" sizes="160px" />
            </div>
          ) : (
            <div
              className="w-40 h-40 rounded-2xl flex items-center justify-center text-white text-6xl font-black mb-4 ring-4 ring-gray-100 shadow-md"
              style={{ backgroundColor: branch?.color }}
            >
              {member.name[0]}
            </div>
          )}
          <p className="text-xl font-bold text-gray-900">{member.name}</p>
          <p className="text-sm text-gray-400 mt-0.5">{member.role}</p>
          {member.title && (
            <p className="text-sm font-semibold mt-1.5 px-3 py-1 rounded-full bg-gray-50" style={{ color: branch?.color }}>
              {member.title}
            </p>
          )}
        </div>

        <hr className="border-gray-100 mx-5" />

        {/* Details */}
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">회사/소속</p>
              <p className="text-sm font-semibold text-gray-900">{member.company || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">직책</p>
              <p className="text-sm font-semibold text-gray-900">{member.position || '—'}</p>
            </div>
          </div>

          {member.industry && (
            <div>
              <p className="text-xs text-gray-400 mb-1">업종/분야</p>
              <p className="text-sm font-semibold text-gray-900">{member.industry}</p>
            </div>
          )}

          {member.birth_year && (
            <div>
              <p className="text-xs text-gray-400 mb-1">출생연도</p>
              <p className="text-sm font-semibold text-gray-900">{member.birth_year}년생</p>
            </div>
          )}

          {member.address && (
            <div>
              <p className="text-xs text-gray-400 mb-1">직장 주소</p>
              <p className="text-sm font-semibold text-gray-900">{member.address}</p>
            </div>
          )}

          {member.phone && (
            <div>
              <p className="text-xs text-gray-400 mb-1">연락처</p>
              <a
                href={`tel:${member.phone}`}
                className="text-sm font-semibold"
                style={{ color: branch?.color }}
              >
                {member.phone}
              </a>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-5 pb-5 space-y-2">
          {member.phone && (
            <a
              href={`tel:${member.phone}`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: branch?.color }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              전화 문의하기
            </a>
          )}
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MembersPage() {
  const params = useParams()
  const branchSlug = params.branch as string
  const branch = getBranch(branchSlug)
  const [members, setMembers] = useState<Member[]>([])
  // 회원 명부는 로그인 필수 — 개인정보(전화번호 등) 보호
  const [authState, setAuthState] = useState<'checking' | 'guest' | 'member'>('checking')

  useEffect(() => {
    getSessionUser().then((u) => setAuthState(u ? 'member' : 'guest'))
  }, [])

  useEffect(() => {
    if (authState === 'member') fetchMembers().then(setMembers)
  }, [authState])

  // 직업군(category) 드롭다운 — 고정 순서로 정렬
  const CATEGORY_ORDER = ['지도부', '건설/건축', '전기/설비', '장비/렌탈', '서비스/유통', '금융', 'IT']
  const categories = Array.from(new Set(members.map((m) => m.category).filter(Boolean))).sort(
    (a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a)
      const ib = CATEGORY_ORDER.indexOf(b)
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    }
  )
  const [active, setActive] = useState('전체')
  const [query, setQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  const q = query.trim().toLowerCase()
  const filtered = members.filter((m) => {
    if (active !== '전체' && m.category !== active) return false
    if (!q) return true
    return [m.name, m.company, m.position, m.industry, m.category, m.phone]
      .some((f) => f?.toLowerCase().includes(q))
  })

  return (
    <div>
      {/* Page header */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: branch?.color }} />
            <h1 className="text-3xl font-black text-gray-900">회원 소개</h1>
          </div>
          <p className="text-gray-500 ml-4">{branch?.name}의 회원들을 소개합니다.</p>
        </div>
      </div>

      {/* 로그인 게이트 */}
      {authState !== 'member' ? (
        <div className="max-w-5xl mx-auto px-4 py-10">
          {authState === 'guest' && (
            <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
              <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-gray-600 font-semibold text-lg mb-1">회원 전용 페이지입니다</p>
              <p className="text-gray-400 text-sm mb-6">회원 명부는 로그인한 회원만 볼 수 있습니다.</p>
              <Link
                href={`/${branchSlug}/login`}
                className="inline-flex items-center px-6 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: branch?.color }}
              >
                회원 로그인
              </Link>
            </div>
          )}
        </div>
      ) : (
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Search */}
        <div className="relative mb-5">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름, 직업, 회사로 검색"
            className="w-full pl-12 pr-10 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-all"
            style={{ '--tw-ring-color': branch?.color } as React.CSSProperties}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              aria-label="검색어 지우기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 직업군 필터 드롭다운 */}
        <div className="mb-6">
          <select
            value={active}
            onChange={(e) => setActive(e.target.value)}
            className="w-full sm:w-auto sm:min-w-[240px] px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 transition-shadow"
            style={{ '--tw-ring-color': branch?.color } as React.CSSProperties}
          >
            <option value="전체">전체 직업군 ({members.length}명)</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({members.filter((m) => m.category === cat).length}명)
              </option>
            ))}
          </select>
        </div>

        {/* Result count */}
        <p className="text-sm text-gray-400 mb-4">
          {query || active !== '전체' ? `${filtered.length}명` : `총 ${members.length}명`}
        </p>

        {/* Members grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 font-medium">
              {query ? `'${query}'에 해당하는 회원이 없습니다.` : '등록된 회원이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-4 sm:p-5 flex flex-col items-center text-center w-full"
              >
                {member.photo_url ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 ring-4 ring-gray-50 group-hover:ring-gray-100 transition-all">
                    <Image src={member.photo_url} alt={member.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black flex-shrink-0 ring-4 ring-gray-50 group-hover:ring-gray-100 transition-all"
                    style={{ backgroundColor: branch?.color }}
                  >
                    {member.name[0]}
                  </div>
                )}
                <div className="mt-3 min-w-0 w-full">
                  <div className="flex items-center justify-center gap-1.5 mb-0.5">
                    <span className="font-bold text-gray-900 text-base truncate">{member.name}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor: branch?.color }}>
                      {member.role}
                    </span>
                  </div>
                  {member.company && <p className="text-sm text-gray-500 truncate">{member.company}{member.position ? ` · ${member.position}` : ''}</p>}
                  {member.title && (
                    <p className="text-xs font-semibold truncate mt-1" style={{ color: branch?.color }}>
                      {member.title}
                    </p>
                  )}
                  {member.industry && (
                    <span className="inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                      {member.industry}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Member detail modal */}
      {selectedMember && (
        <MemberModal
          member={selectedMember}
          branch={branch}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  )
}
