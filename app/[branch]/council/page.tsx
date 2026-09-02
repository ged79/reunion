'use client'

// 협의회원 명부 — 목록 UI는 MemberDirectory 공용 컴포넌트 사용 (청년회원 /members와 공유)
import MemberDirectory from '@/components/MemberDirectory'

export default function CouncilMembersPage() {
  return (
    <MemberDirectory
      memberType="council"
      title="협의회원 소개"
      subtitle="민족통일협의회 영동군의 협의회원들을 소개합니다."
      showCategoryFilter={false}
      showSearch={false}
    />
  )
}
