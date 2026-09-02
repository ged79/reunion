'use client'

// 청년회원 명부 — 목록 UI는 MemberDirectory 공용 컴포넌트 사용 (협의회원 /council과 공유)
import MemberDirectory from '@/components/MemberDirectory'

export default function MembersPage() {
  return (
    <MemberDirectory
      memberType="youth"
      title="청년회원 소개"
      subtitle="민족통일청년회 영동군의 청년회원들을 소개합니다."
    />
  )
}
