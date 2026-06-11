import { redirect } from 'next/navigation'

// 현재 영동 지회 단독 운영 — 첫 화면은 영동 지회로 바로 이동
// (다지회 확장 시 지회 선택 화면으로 되돌릴 것)
export default function HomePage() {
  redirect('/yeongdong')
}
