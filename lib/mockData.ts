import { Branch, Notice, Photo, Member, Transaction, Event } from './supabase'
import { fetchMembers, fetchNotices, fetchPhotos, fetchEvents, fetchTransactions } from './supabase'

// ========================================
// 정적 데이터: 지회 (DB에 branches 테이블 없으므로 하드코딩)
// ========================================
export const mockBranches: Branch[] = [
  {
    id: 'branch-yeongdong',
    slug: 'yeongdong',
    name: '민족통일청년회 영동군',
    region: '충청북도 영동군',
    contact_email: 'yeongdong@mintong.kr',
    contact_phone: '043-740-0000',
    description: '영동군 평화통일 운동의 중심',
    color: '#1e40af',
    logo_url: null,
    youtube_url: null,
    facebook_url: null,
    instagram_url: null,
  },
  // 청주 등 신규 지회는 멀티지회 작업(branches 테이블 + branch_id 분리) 후 추가
]

// ========================================
// 동기 함수: 지회 조회 (하드코딩)
// ========================================
export function getBranch(slug: string): Branch | null {
  return mockBranches.find((b) => b.slug === slug) ?? null
}

// ========================================
// 비동기 함수: Supabase에서 실제 데이터 조회
// ========================================
export async function getBranchPhotos(_branchId?: string): Promise<Photo[]> {
  return fetchPhotos()
}

export async function getBranchNotices(_branchId?: string): Promise<Notice[]> {
  return fetchNotices()
}

export async function getBranchMembers(_branchId?: string): Promise<Member[]> {
  return fetchMembers()
}

export async function getBranchTransactions(_branchId?: string): Promise<Transaction[]> {
  return fetchTransactions()
}

export async function getBranchEvents(_branchId?: string): Promise<Event[]> {
  return fetchEvents()
}
