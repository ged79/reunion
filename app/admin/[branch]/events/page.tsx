'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { getBranch } from '@/lib/mockData'
import { fetchEvents, createEvent, updateEvent, deleteEvent, verifyAdmin, type Event } from '@/lib/supabase'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const emptyForm = {
  title: '',
  date: '',
  location: '',
  description: '',
}

export default function AdminEventsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const branchSlug = params.branch as string

  const branch = getBranch(branchSlug)

  const [events, setEvents] = useState<Event[]>([])
  useEffect(() => { fetchEvents().then(setEvents) }, [])
  const [showForm, setShowForm] = useState(searchParams.get('action') === 'new')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  if (!branch) return null

  const branchColor = branch.color
  const today = new Date().toISOString().split('T')[0]

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  function startEdit(item: Event) {
    setEditingId(item.id)
    setForm({
      title: item.title,
      date: item.date,
      location: item.location,
      description: item.description || '',
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!(await verifyAdmin())) { showToast('error', '관리자 로그인이 필요합니다.'); return }
    setSubmitting(true)

    const payload = {
      title: form.title,
      date: form.date,
      location: form.location,
      description: form.description,
    }

    const ok = editingId ? await updateEvent(editingId, payload) : await createEvent(payload)

    if (ok) {
      setEvents(await fetchEvents())
      showToast('success', editingId ? '행사가 수정되었습니다.' : '행사가 등록되었습니다.')
      cancelForm()
    } else {
      showToast('error', '저장에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!(await verifyAdmin())) { showToast('error', '관리자 로그인이 필요합니다.'); return }
    const ok = await deleteEvent(id)
    if (ok) {
      setEvents((prev) => prev.filter((ev) => ev.id !== id))
      showToast('success', '행사가 삭제되었습니다.')
    } else {
      showToast('error', '삭제에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
    setDeleteConfirm(null)
  }

  const upcoming = events.filter((ev) => ev.date >= today)
  const past = events.filter((ev) => ev.date < today)

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">행사 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {branch.name} · 예정 {upcoming.length}건 · 종료 {past.length}건
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true)
              setEditingId(null)
              setForm(emptyForm)
            }}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: branchColor }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 행사 등록
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            {editingId ? '행사 수정' : '새 행사 등록'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                행사명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="행사 제목을 입력하세요"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  날짜 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  장소 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                  placeholder="행사 장소"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                placeholder="행사에 대한 간단한 설명을 입력하세요 (선택)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ backgroundColor: branchColor }}
              >
                {submitting ? '저장 중...' : editingId ? '수정 완료' : '등록'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="px-5 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events List */}
      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          등록된 행사가 없습니다.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1">예정된 행사</h3>
              <div className="space-y-2">
                {upcoming.map((ev) => (
                  <div key={ev.id} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm mb-1">{ev.title}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: branchColor }}>
                            {formatDate(ev.date)}
                          </span>
                          <span className="text-xs text-gray-500">{ev.location}</span>
                        </div>
                        {ev.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{ev.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => startEdit(ev)} className="px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">수정</button>
                        <button onClick={() => setDeleteConfirm(ev.id)} className="px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium">삭제</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1">종료된 행사</h3>
              <div className="space-y-2 opacity-70">
                {past.map((ev) => (
                  <div key={ev.id} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-500 text-sm mb-1">{ev.title}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
                            {formatDate(ev.date)}
                          </span>
                          <span className="text-xs text-gray-400">{ev.location}</span>
                        </div>
                        {ev.description && (
                          <p className="text-xs text-gray-300 mt-1 line-clamp-1">{ev.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => startEdit(ev)} className="px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">수정</button>
                        <button onClick={() => setDeleteConfirm(ev.id)} className="px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium">삭제</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">행사 삭제</h3>
            <p className="text-sm text-gray-500 mb-6">
              이 행사를 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
