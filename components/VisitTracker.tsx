'use client'

// 페이지 이동마다 방문 기록을 남기는 보이지 않는 컴포넌트 — [branch] 레이아웃에 장착
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { recordVisit } from '@/lib/supabase'

export default function VisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) recordVisit(pathname)
  }, [pathname])

  return null
}
