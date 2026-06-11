'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getBranch } from '@/lib/mockData'
import { fetchTransactions, type Transaction } from '@/lib/supabase'

function formatAmount(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const YEARS = ['전체', '2025', '2024']

export default function AccountingPage() {
  const params = useParams()
  const branchSlug = params.branch as string
  const branch = getBranch(branchSlug)
  const [allTx, setAllTx] = useState<Transaction[]>([])

  useEffect(() => {
    fetchTransactions().then(setAllTx)
  }, [])

  const [year, setYear] = useState('2025')
  const [typeFilter, setTypeFilter] = useState<'전체' | '수입' | '지출'>('전체')

  const filtered = allTx
    .filter((t) => year === '전체' || t.date.startsWith(year))
    .filter((t) => typeFilter === '전체' || t.type === typeFilter)

  const yearTx = allTx.filter((t) => year === '전체' || t.date.startsWith(year))
  const totalIncome  = yearTx.filter((t) => t.type === '수입').reduce((s, t) => s + t.amount, 0)
  const totalExpense = yearTx.filter((t) => t.type === '지출').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  return (
    <div>
      {/* Page header */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-8 rounded-full" style={{ backgroundColor: branch?.color }} />
                <h1 className="text-3xl font-black text-gray-900">회계 장부</h1>
              </div>
              <p className="text-gray-500 ml-4">{branch?.name}의 수입 및 지출 내역입니다.</p>
            </div>
            <button
              onClick={() => window.print()}
              className="no-print inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              aria-label="인쇄"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              인쇄
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Year filter */}
        <div className="flex gap-2 mb-8">
          {YEARS.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${
                year === y ? 'text-white border-transparent' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
              style={year === y && branch ? { backgroundColor: branch.color, borderColor: branch.color } : {}}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 mb-1 font-medium">총 수입</p>
            <p className="text-2xl font-black text-blue-600">{formatAmount(totalIncome)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 mb-1 font-medium">총 지출</p>
            <p className="text-2xl font-black text-red-500">{formatAmount(totalExpense)}</p>
          </div>
          <div
            className="rounded-2xl p-5 text-white"
            style={{ backgroundColor: branch?.color }}
          >
            <p className="text-xs opacity-70 mb-1 font-medium">잔액</p>
            <p className="text-2xl font-black">{formatAmount(balance)}</p>
          </div>
        </div>

        {/* Type filter + table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table header controls */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="font-bold text-gray-900 text-sm">거래 내역</span>
            <div className="flex gap-1">
              {(['전체', '수입', '지출'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    typeFilter === t
                      ? t === '수입' ? 'bg-blue-100 text-blue-700'
                        : t === '지출' ? 'bg-red-100 text-red-600'
                        : 'bg-gray-900 text-white'
                      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">내역이 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-xs font-semibold">
                    <th className="text-left px-5 py-3">날짜</th>
                    <th className="text-left px-5 py-3">내용</th>
                    <th className="text-left px-5 py-3">분류</th>
                    <th className="text-right px-5 py-3">금액</th>
                    <th className="text-right px-5 py-3">잔액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{formatDate(tx.date)}</td>
                      <td className="px-5 py-3.5 text-gray-800 font-medium">{tx.description}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          tx.type === '수입' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'
                        }`}>
                          {tx.category}
                        </span>
                      </td>
                      <td className={`px-5 py-3.5 text-right font-bold whitespace-nowrap ${
                        tx.type === '수입' ? 'text-blue-600' : 'text-red-500'
                      }`}>
                        {tx.type === '수입' ? '+' : '-'}{formatAmount(tx.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-500 whitespace-nowrap">
                        {formatAmount(tx.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
