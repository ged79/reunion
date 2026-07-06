import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// Next.js 서버 컴포넌트의 fetch 기본 캐싱을 끔 — 항상 최신 DB 데이터를 읽도록
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url: RequestInfo | URL, options: RequestInit = {}) =>
      fetch(url, { ...options, cache: 'no-store' }),
  },
})

// 기존(라이브) members 테이블을 앱의 Member 형태로 읽어옵니다.
// 분류(category) 영문 슬러그 → 한글 그룹 매핑, field → industry, image_url 정규화.
const CATEGORY_LABELS: Record<string, string> = {
  leadership: '지도부',
  construction: '건설/건축',
  electric: '전기/설비',
  equipment: '장비/렌탈',
  service: '서비스/유통',
  finance: '금융',
  it: 'IT',
}

// ========================================
// Supabase 데이터 Fetch 함수들
// DB에 branch 개념이 없으므로 전체 데이터를 가져옴
// ========================================

export async function fetchMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error || !data) return []

  return data.map((r: Record<string, unknown>): Member => {
    const img = (r.image_url as string) || ''
    const birthDigits = String(r.birth ?? '').replace(/\D/g, '')
    const cat = (r.category as string) || ''
    return {
      id: String(r.id),
      branch_id: 'branch-yeongdong',
      name: (r.name as string) ?? '',
      role: (r.role as string) || '회원',
      category: CATEGORY_LABELS[cat] || cat || '기타',
      company: (r.company as string) || null,
      position: (r.position as string) || null,
      industry: (r.field as string) || null,
      title: (r.title as string) || null,
      birth_year: birthDigits ? Number(birthDigits) : null,
      address: (r.address as string) || null,
      phone: (r.phone as string) || null,
      photo_url: img ? (img.startsWith('http') ? img : `https://mintong.netlify.app/${img}`) : null,
    }
  })
}

// news 테이블 → Notice 변환
// event_date 있는 글 = 행사(fetchEvents 담당) → 공지에서 제외해 중복 방지
export async function fetchNotices(): Promise<Notice[]> {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('is_published', true)
    .is('event_date', null)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((r: Record<string, unknown>): Notice => ({
    id: String(r.id),
    branch_id: 'branch-yeongdong',
    title: (r.title as string) ?? '',
    content: (r.content as string) ?? '',
    important: (r.category as string) === '공지사항',
    created_at: (r.created_at as string) ?? '',
  }))
}

// event_photos 테이블 → Photo 변환
export async function fetchPhotos(): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('event_photos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((r: Record<string, unknown>): Photo => ({
    id: String(r.id),
    branch_id: 'branch-yeongdong',
    event_id: (r.event_id as string) || null,
    image_url: (r.image_url as string) ?? '',
    caption: (r.caption as string) || null,
    created_at: (r.created_at as string) ?? '',
  }))
}

// news 테이블에서 행사(event_date 있는 것) → Event 변환
export async function fetchEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('is_published', true)
    .not('event_date', 'is', null)
    .order('event_date', { ascending: false })

  if (error || !data) return []

  return data.map((r: Record<string, unknown>): Event => ({
    id: String(r.id),
    branch_id: 'branch-yeongdong',
    title: (r.title as string) ?? '',
    date: (r.event_date as string) ?? '',
    location: (r.location as string) ?? '',
    description: (r.content as string) || null,
    created_at: (r.created_at as string) ?? '',
  }))
}

// accounting_data JSONB → Transaction[] 변환
export async function fetchTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('accounting_data')
    .select('data')
    .eq('id', 1)
    .maybeSingle()

  if (error || !data?.data) return []

  const accData = data.data as { initialBalance?: number; transactions?: Array<Record<string, unknown>> }
  const txList = accData.transactions || []
  let balance = accData.initialBalance || 0

  // 날짜순 정렬 후 잔액 계산
  const sorted = [...txList].sort((a, b) =>
    String(a.date || '').localeCompare(String(b.date || ''))
  )

  return sorted.map((t): Transaction => {
    const amount = Number(t.amount) || 0
    const type = t.type === 'income' ? '수입' : '지출'
    balance += type === '수입' ? amount : -amount
    return {
      id: String(t.id),
      branch_id: 'branch-yeongdong',
      date: String(t.date || ''),
      description: String(t.description || ''),
      category: String(t.category || ''),
      type,
      amount,
      balance,
    }
  })
}

export type Branch = {
  id: string
  slug: string
  name: string
  region: string
  contact_email: string | null
  contact_phone: string | null
  description: string | null
  color: string
  logo_url: string | null
  youtube_url: string | null
  facebook_url: string | null
  instagram_url: string | null
}

export type Notice = {
  id: string
  branch_id: string
  title: string
  content: string
  important: boolean
  created_at: string
}

export type Photo = {
  id: string
  branch_id: string
  event_id: string | null
  image_url: string
  caption: string | null
  created_at: string
}

export type Transaction = {
  id: string
  branch_id: string
  date: string
  description: string
  category: string
  type: '수입' | '지출'
  amount: number
  balance: number
}

export type Event = {
  id: string
  branch_id: string
  title: string
  date: string
  location: string
  description: string | null
  created_at: string
}

export type Member = {
  id: string
  branch_id: string
  name: string
  role: string
  category: string
  company: string | null
  position: string | null
  industry: string | null
  title: string | null // 주요 직함 (예: "현 영동로타리 클럽 회장")
  birth_year: number | null
  address: string | null
  phone: string | null
  photo_url: string | null
}

// ========================================
// 인증 (Supabase Auth)
// 회원: 아이디 = 휴대폰번호. 내부적으로 <숫자>@member.mintong.local 이메일 계정으로 저장
//       (SMS 발송 업체 연동 전이므로 전화번호 OTP 대신 이메일형 계정 사용)
// 관리자: 전용 Auth 계정, app_metadata.role = 'admin' — RLS 쓰기 권한의 기준
// ========================================
export type SessionUser = {
  name: string
  phone: string | null
  role: 'member' | 'admin'
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user
  if (!user) return null
  return {
    name: (user.user_metadata?.name as string) || '회원',
    phone: (user.user_metadata?.phone as string) || null,
    role: (user.app_metadata?.role as string) === 'admin' ? 'admin' : 'member',
  }
}

// 회원 로그인 — 휴대폰 뒷 4자리만 입력. 성공하면 null, 실패하면 에러 메시지 반환
// 서버(/api/member-login)가 뒷자리로 회원을 찾아 본인 계정 세션을 발급
export async function memberLogin(code: string): Promise<string | null> {
  let body: { error?: string; access_token?: string; refresh_token?: string }
  try {
    const res = await fetch('/api/member-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim() }),
    })
    body = await res.json()
    if (!res.ok) return body.error || '로그인에 실패했습니다.'
  } catch {
    return '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.'
  }
  const { error } = await supabase.auth.setSession({
    access_token: body.access_token!,
    refresh_token: body.refresh_token!,
  })
  if (error) return '로그인에 실패했습니다.'
  return null
}

export async function memberLogout(): Promise<void> {
  await supabase.auth.signOut()
}

// 관리자 로그인 — 화면에서는 비밀번호만 입력 (계정 이메일은 내부 고정)
const ADMIN_EMAIL = 'admin@yeongdong.mintong.local'

export async function adminLogin(password: string): Promise<boolean> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password,
  })
  if (error || (data.user?.app_metadata?.role as string) !== 'admin') return false
  return true
}

export async function verifyAdmin(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false
  return (session.user.app_metadata?.role as string) === 'admin'
}

export async function adminLogout(): Promise<void> {
  await supabase.auth.signOut()
}

// ========================================
// CRUD: 회원 (members 테이블)
// ========================================
// DB 컬럼명 매핑: app의 industry → DB의 field, birth_year → birth
const CATEGORY_SLUGS: Record<string, string> = {
  '지도부': 'leadership',
  '건설/건축': 'construction',
  '전기/설비': 'electric',
  '장비/렌탈': 'equipment',
  '서비스/유통': 'service',
  '금융': 'finance',
  'IT': 'it',
}

export async function createMember(member: Omit<Member, 'id' | 'branch_id'>): Promise<Member | null> {
  // 신규 회원은 명부 맨 아래로 — 현재 최대 sort_order + 1 부여
  const { data: maxRow } = await supabase
    .from('members')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextOrder = ((maxRow?.sort_order as number) ?? 0) + 1

  const { data, error } = await supabase
    .from('members')
    .insert({
      name: member.name,
      role: member.role,
      company: member.company,
      field: member.industry,
      phone: member.phone,
      position: member.position,
      title: member.title,
      birth: member.birth_year ? String(member.birth_year) : null,
      address: member.address,
      category: CATEGORY_SLUGS[member.category] || 'service',
      image_url: null,
      sort_order: nextOrder,
    })
    .select()
    .single()

  if (error || !data) return null
  // 새로 삽입된 데이터를 다시 fetch하여 일관된 형태로 반환
  const members = await fetchMembers()
  return members.find(m => m.name === member.name) || null
}

export async function updateMember(id: string, member: Partial<Member>): Promise<boolean> {
  const updateData: Record<string, unknown> = {}
  if (member.name !== undefined) updateData.name = member.name
  if (member.role !== undefined) updateData.role = member.role
  if (member.company !== undefined) updateData.company = member.company
  if (member.industry !== undefined) updateData.field = member.industry
  if (member.phone !== undefined) updateData.phone = member.phone
  if (member.position !== undefined) updateData.position = member.position
  if (member.title !== undefined) updateData.title = member.title
  if (member.birth_year !== undefined) updateData.birth = member.birth_year ? String(member.birth_year) : null
  if (member.address !== undefined) updateData.address = member.address
  if (member.category !== undefined) updateData.category = CATEGORY_SLUGS[member.category] || member.category

  const { error } = await supabase
    .from('members')
    .update(updateData)
    .eq('id', Number(id))

  return !error
}

export async function deleteMember(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', Number(id))

  return !error
}

// ========================================
// CRUD: 뉴스/공지 (news 테이블)
// ========================================
export async function createNewsItem(item: { title: string; content: string; category: string; event_date?: string; location?: string }): Promise<boolean> {
  const { error } = await supabase
    .from('news')
    .insert({
      title: item.title,
      content: item.content,
      category: item.category,
      author_name: '관리자',
      is_published: true,
      event_date: item.event_date || null,
      location: item.location || null,
    })

  return !error
}

export async function updateNewsItem(id: string, item: { title?: string; content?: string; category?: string; is_published?: boolean }): Promise<boolean> {
  const { error } = await supabase
    .from('news')
    .update(item)
    .eq('id', id)

  return !error
}

// 공지 내리기: 삭제 대신 행사(활동 기록)로 이동 — event_date 를 부여하면 행사로 분류됨
export async function moveNoticeToEvent(id: string, eventDate: string): Promise<boolean> {
  const { error } = await supabase
    .from('news')
    .update({ category: '행사안내', event_date: eventDate })
    .eq('id', id)

  return !error
}

export async function deleteNewsItem(id: string): Promise<boolean> {
  // 관련 사진도 삭제
  await supabase.from('event_photos').delete().eq('event_id', id)
  const { error } = await supabase.from('news').delete().eq('id', id)
  return !error
}

// ========================================
// CRUD: 행사 (news 테이블의 event_date 있는 행)
// ========================================
export async function createEvent(ev: { title: string; date: string; location: string; description?: string }): Promise<boolean> {
  const { error } = await supabase
    .from('news')
    .insert({
      title: ev.title,
      content: ev.description || '',
      category: '행사안내',
      author_name: '관리자',
      is_published: true,
      event_date: ev.date,
      location: ev.location,
    })

  return !error
}

export async function updateEvent(id: string, ev: { title: string; date: string; location: string; description?: string }): Promise<boolean> {
  const { error } = await supabase
    .from('news')
    .update({
      title: ev.title,
      content: ev.description || '',
      event_date: ev.date,
      location: ev.location,
    })
    .eq('id', id)

  return !error
}

export async function deleteEvent(id: string): Promise<boolean> {
  return deleteNewsItem(id)
}

// ========================================
// CRUD: 사진 (event_photos + Supabase Storage)
// ========================================
// event_photos.event_id 가 NOT NULL — 사진은 반드시 행사(news 행)에 연결됨
export async function uploadPhoto(file: File, newsId: string, caption?: string): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const fileName = `photos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('events')
    .upload(fileName, file)

  if (uploadError) return null

  const { data: urlData } = supabase.storage
    .from('events')
    .getPublicUrl(fileName)

  const imageUrl = urlData.publicUrl

  const { error: insertError } = await supabase.from('event_photos').insert({
    event_id: newsId,
    image_url: imageUrl,
    caption: caption || null,
  })

  if (insertError) return null

  return imageUrl
}

export async function uploadMemberPhoto(file: File, _memberName?: string): Promise<string | null> {
  // 주의: Storage 키에 한글 불가(InvalidKey) — 회원 이름 대신 타임스탬프+랜덤으로 생성
  const ext = file.name.split('.').pop()
  const fileName = `members/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('events')
    .upload(fileName, file)

  if (uploadError) return null

  const { data: urlData } = supabase.storage
    .from('events')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

export async function deletePhoto(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('event_photos')
    .delete()
    .eq('id', id)

  return !error
}
