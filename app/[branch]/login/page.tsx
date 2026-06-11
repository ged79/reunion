'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getBranch } from '@/lib/mockData'
import { memberLogin, getSessionUser } from '@/lib/supabase'

export default function MemberLoginPage() {
  const params = useParams()
  const router = useRouter()
  const branchSlug = params.branch as string
  const branch = getBranch(branchSlug)

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 이미 로그인된 상태면 명부로
  useEffect(() => {
    getSessionUser().then((u) => {
      if (u) router.replace(`/${branchSlug}/members`)
    })
  }, [router, branchSlug])

  if (!branch) return null

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const err = await memberLogin(code)
    if (err) {
      setError(err)
      setLoading(false)
    } else {
      router.push(`/${branchSlug}/members`)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4"
            style={{ backgroundColor: branch.color }}
          >
            민통
          </div>
          <h1 className="text-2xl font-bold text-gray-900">회원 로그인</h1>
          <p className="text-gray-500 text-sm mt-1">
            {branch.name} 회원 전용 서비스입니다
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1.5">
                본인 휴대폰번호 뒷 4자리
              </label>
              <input
                id="code"
                type="password"
                inputMode="numeric"
                maxLength={4}
                pattern="\d{4}"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                placeholder="●●●●"
                autoFocus
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:border-transparent transition"
                style={{ '--tw-ring-color': branch.color } as React.CSSProperties}
              />
              <p className="text-xs text-gray-400 mt-1.5 text-center">
                예: 휴대폰번호가 010-1234-5678이면 → 5678
              </p>
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 px-4 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ backgroundColor: branch.color }}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-5">
            로그인이 안 되시나요? 지회 관리자에게 문의해주세요.
          </p>
        </div>
      </div>
    </div>
  )
}
