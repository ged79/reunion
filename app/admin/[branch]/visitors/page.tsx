'use client'

// 방문 통계 — 누가(로그인 회원 이름/비로그인), 언제, 어느 페이지를 봤는지
import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { getBranch } from '@/lib/mockData'
import { fetchVisits, type Visit } from '@/lib/supabase'

// 경로 → 사람이 읽는 페이지 이름
function pageLabel(path: string): string {
  const p = path.replace(/^\/[^/]+/, '') // /yeongdong 제거
  if (p === '' || p === '/') return '홈'
  if (p.startsWith('/about')) return '단체소개'
  if (p.startsWith('/members')) return '청년회원'
  if (p.startsWith('/council')) return '협의회원'
  if (p.startsWith('/photos')) return '갤러리'
  if (p.startsWith('/updates/')) return '소식 상세'
  if (p.startsWith('/updates')) return '소식'
  if (p.startsWith('/news')) return '소식'
  if (p.startsWith('/notices')) return '공지'
  if (p.startsWith('/events')) return '행사'
  if (p.startsWith('/accounting')) return '회계'
  if (p.startsWith('/contact')) return '연락처'
  if (p.startsWith('/login')) return '로그인'
  return p
}

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminVisitorsPage() {
  const params = useParams()
  const branch = getBranch(params.branch as string)
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVisits(30).then((v) => { setVisits(v); setLoading(false) })
  }, [])

  const stats = useMemo(() => {
    const todayKey = dayKey(new Date().toISOString())
    const today = visits.filter((v) => dayKey(v.created_at) === todayKey)
    const uniq = (arr: Visit[]) => new Set(arr.map((v) => v.session_id || v.id)).size

    // 최근 7일 일별 방문자 수
    const days: { label: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const key = dayKey(d.toISOString())
      const dayVisits = visits.filter((v) => dayKey(v.created_at) === key)
      days.push({
        label: d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
        count: uniq(dayVisits),
      })
    }

    // 페이지별 조회수 (30일)
    const byPage = new Map<string, number>()
    for (const v of visits) byPage.set(pageLabel(v.path), (byPage.get(pageLabel(v.path)) || 0) + 1)
    const topPages = Array.from(byPage.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8)

    // 회원별 방문 (로그인 회원만, 30일)
    const byMember = new Map<string, number>()
    for (const v of visits) if (v.visitor) byMember.set(v.visitor, (byMember.get(v.visitor) || 0) + 1)
    const topMembers = Array.from(byMember.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)

    // 지역별 방문자 수 (세션 단위, 30일)
    const byRegion = new Map<string, Set<string>>()
    for (const v of visits) {
      const key = v.region || '알 수 없음'
      if (!byRegion.has(key)) byRegion.set(key, new Set())
      byRegion.get(key)!.add(v.session_id || v.id)
    }
    const topRegions = Array.from(byRegion.entries())
      .map(([label, set]): [string, number] => [label, set.size])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)

    return {
      todayVisitors: uniq(today),
      todayViews: today.length,
      monthVisitors: uniq(visits),
      monthViews: visits.length,
      days,
      topPages,
      topMembers,
      topRegions,
    }
  }, [visits])

  const branchColor = branch?.color || '#1e40af'
  const maxDay = Math.max(1, ...stats.days.map((d) => d.count))

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">방문 통계</h1>
        <p className="text-sm text-gray-500 mt-0.5">최근 30일 기준 · 방문자 수는 브라우저 세션 단위</p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-gray-400">불러오는 중...</div>
      ) : (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: '오늘 방문자', value: stats.todayVisitors },
              { label: '오늘 조회수', value: stats.todayViews },
              { label: '30일 방문자', value: stats.monthVisitors },
              { label: '30일 조회수', value: stats.monthViews },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                <p className="text-2xl font-black text-gray-900">{s.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* 최근 7일 방문자 막대 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">최근 7일 방문자</h2>
            <div className="flex items-end gap-2 h-32">
              {stats.days.map((d) => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-700">{d.count}</span>
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${Math.max(4, (d.count / maxDay) * 90)}px`,
                      backgroundColor: branchColor,
                      opacity: d.count === 0 ? 0.15 : 0.85,
                    }}
                  />
                  <span className="text-[10px] text-gray-400">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* 페이지별 조회수 */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">많이 본 페이지 (30일)</h2>
              {stats.topPages.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">기록이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {stats.topPages.map(([label, count]) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-24 flex-shrink-0">{label}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(count / stats.topPages[0][1]) * 100}%`, backgroundColor: branchColor, opacity: 0.8 }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-500 w-10 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 지역별 방문자 */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-1">지역별 방문자 (30일)</h2>
              <p className="text-xs text-gray-400 mb-3">IP 기반 추정 — 휴대폰 회선은 통신사 위치로 잡힐 수 있음</p>
              {stats.topRegions.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">기록이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {stats.topRegions.map(([label, count]) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 flex-1 truncate">{label}</span>
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(count / stats.topRegions[0][1]) * 100}%`, backgroundColor: branchColor, opacity: 0.8 }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-500 w-10 text-right flex-shrink-0">{count}명</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 회원별 방문 */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">회원 방문 (30일, 로그인 기준)</h2>
              {stats.topMembers.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">로그인한 회원의 방문 기록이 없습니다.</p>
              ) : (
                <div className="space-y-1.5">
                  {stats.topMembers.map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
                      <span className="text-sm font-medium text-gray-800">{name}</span>
                      <span className="text-xs font-bold text-gray-500">{count}회</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 최근 방문 기록 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">최근 방문 기록</h2>
            {visits.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">아직 방문 기록이 없습니다.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {visits.slice(0, 50).map((v) => (
                  <div key={v.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="text-xs text-gray-400 w-32 flex-shrink-0">{formatTime(v.created_at)}</span>
                    <span className={`font-medium flex-shrink-0 ${v.visitor ? 'text-gray-900' : 'text-gray-400'}`}>
                      {v.visitor || '방문자'}
                    </span>
                    <span className="text-gray-500 truncate flex-1">{pageLabel(v.path)}</span>
                    {v.region && <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block max-w-[140px] truncate">{v.region}</span>}
                    <span className="text-xs text-gray-400 flex-shrink-0">{v.device}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
