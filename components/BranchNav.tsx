'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getSessionUser, memberLogout, type Branch, type SessionUser } from '@/lib/supabase'

interface BranchNavProps {
  branch: Branch
}

export default function BranchNav({ branch }: BranchNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)
  const currentPath = usePathname() || ''

  useEffect(() => {
    getSessionUser().then(setUser)
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')
  }, [currentPath])

  async function handleLogout() {
    await memberLogout()
    setUser(null)
    setMobileOpen(false)
    window.location.href = `/${branch.slug}`
  }

  const navLinks = [
    { href: `/${branch.slug}`, label: '홈' },
    { href: `/${branch.slug}/about`, label: '단체소개' },
    { href: `/${branch.slug}/members`, label: '회원' },
    { href: `/${branch.slug}/photos`, label: '갤러리' },
    { href: `/${branch.slug}/updates`, label: '소식' },
    { href: `/${branch.slug}/contact`, label: '연락처' },
  ]

  const isActive = (href: string) => {
    if (href === `/${branch.slug}`) return currentPath === href
    return currentPath.startsWith(href)
  }

  return (
    <>
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Brand */}
            <Link href={`/${branch.slug}`} className="flex items-center flex-shrink-0">
              <span className="font-black text-xl tracking-tight" style={{ color: branch.color }}>
                민통
              </span>
              <span className="font-black text-xl tracking-tight text-gray-900 ml-1">
                {branch.name.replace('민족통일청년회', '').trim()}
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-md ${
                    isActive(link.href)
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 rounded-full"
                      style={{ backgroundColor: branch.color }}
                    />
                  )}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="hidden md:inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
                >
                  {user.name}님 · 로그아웃
                </button>
              ) : (
                <Link
                  href={`/${branch.slug}/login`}
                  className="hidden md:inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: branch.color }}
                >
                  회원 로그인
                </Link>
              )}
              <Link
                href="/admin/login"
                className="hidden md:inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
                style={{ borderColor: branch.color, color: branch.color }}
              >
                관리자
              </Link>

              {/* Hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 -mr-1 text-gray-600"
                aria-label="메뉴 열기"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile fullscreen overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel — slides in from right */}
          <div className="absolute top-0 right-0 h-full w-72 bg-white shadow-2xl flex flex-col animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <span className="font-black text-xl" style={{ color: branch.color }}>민통</span>
                <span className="font-black text-xl text-gray-900 ml-1">
                  {branch.name.replace('민족통일청년회', '').trim()}
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 -mr-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between px-4 py-3.5 rounded-xl text-lg font-semibold transition-colors"
                  style={
                    isActive(link.href)
                      ? { backgroundColor: branch.color, color: 'white' }
                      : { color: '#374151' }
                  }
                >
                  {link.label}
                  {!isActive(link.href) && (
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Link>
              ))}
            </nav>

            {/* 로그인/로그아웃 + Admin link */}
            <div className="px-3 pb-6 pt-2 border-t border-gray-100 space-y-2">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"
                >
                  {user.name}님 · 로그아웃
                </button>
              ) : (
                <Link
                  href={`/${branch.slug}/login`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: branch.color }}
                >
                  회원 로그인
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
              <Link
                href="/admin/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-sm font-semibold border-2 transition-colors"
                style={{ borderColor: branch.color, color: branch.color }}
              >
                관리자 패널
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
