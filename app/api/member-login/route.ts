import { NextResponse } from 'next/server'

// 회원 로그인: 휴대폰 뒷 4자리만 입력 → 서버가 회원을 찾아 본인 계정으로 로그인
// (명부는 RLS로 잠겨 있어 브라우저에서 직접 조회 불가 — service key는 서버에서만 사용)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 무차별 시도 방지: IP당 10분에 10회
const attempts = new Map<string, { count: number; resetAt: number }>()
function isThrottled(ip: string): boolean {
  const now = Date.now()
  const a = attempts.get(ip)
  if (!a || now > a.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 10 * 60_000 })
    return false
  }
  a.count++
  return a.count > 10
}

async function tokenGrant(email: string, password: string) {
  return fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  })
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'local'
  if (isThrottled(ip)) {
    return NextResponse.json(
      { error: '시도 횟수가 너무 많습니다. 10분 후 다시 시도해주세요.' },
      { status: 429 }
    )
  }

  const { code } = await req.json().catch(() => ({ code: '' }))
  if (!/^\d{4}$/.test(code || '')) {
    return NextResponse.json({ error: '휴대폰번호 뒷 4자리를 입력해주세요.' }, { status: 400 })
  }

  // 뒷 4자리로 회원 찾기
  const r = await fetch(`${SUPABASE_URL}/rest/v1/members?select=id,name,phone`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    cache: 'no-store',
  })
  if (!r.ok) {
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 500 })
  }
  const members: { id: number; name: string; phone: string | null }[] = await r.json()
  const matches = members.filter((m) => (m.phone || '').replace(/\D/g, '').endsWith(code))

  if (matches.length === 0) {
    return NextResponse.json({ error: '등록된 회원이 아닙니다. 번호를 확인해주세요.' }, { status: 401 })
  }
  if (matches.length > 1) {
    return NextResponse.json(
      { error: '같은 뒷자리의 회원이 여러 명입니다. 지회 관리자에게 문의해주세요.' },
      { status: 409 }
    )
  }

  const member = matches[0]
  const digits = (member.phone || '').replace(/\D/g, '')
  const email = `${digits}@member.mintong.local`

  // 로그인 — 계정이 아직 없는 신규 회원이면 자동 생성 후 재시도
  let grant = await tokenGrant(email, code)
  if (!grant.ok) {
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password: code,
        email_confirm: true,
        user_metadata: { name: member.name, phone: member.phone, member_id: member.id },
        app_metadata: { role: 'member' },
      }),
      cache: 'no-store',
    })
    grant = await tokenGrant(email, code)
  }
  if (!grant.ok) {
    return NextResponse.json({ error: '로그인에 실패했습니다. 관리자에게 문의해주세요.' }, { status: 401 })
  }

  const t = await grant.json()
  return NextResponse.json({
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    name: member.name,
  })
}
