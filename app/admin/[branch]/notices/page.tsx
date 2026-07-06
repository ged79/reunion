'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { getBranch } from '@/lib/mockData'
import { fetchNotices, createNewsItem, updateNewsItem, deleteNewsItem, moveNoticeToEvent, verifyAdmin, type Notice } from '@/lib/supabase'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const emptyForm = {
  title: '',
  content: '',
  important: false,
}

export default function AdminNoticesPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const branchSlug = params.branch as string

  const branch = getBranch(branchSlug)

  const [notices, setNotices] = useState<Notice[]>([])
  useEffect(() => { fetchNotices().then(setNotices) }, [])
  const [showForm, setShowForm] = useState(searchParams.get('action') === 'new')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  if (!branch) return null

  const branchColor = branch.color
  const branchId = branch?.id ?? ''

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  function startEdit(item: Notice) {
    setEditingId(item.id)
    setForm({
      title: item.title,
      content: item.content,
      important: item.important,
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
    try {
      if (editingId) {
        const ok = await updateNewsItem(editingId, { title: form.title, content: form.content })
        if (ok) {
          showToast('success', '공지사항이 수정되었습니다.')
          fetchNotices().then(setNotices)
        } else showToast('error', '수정에 실패했습니다.')
      } else {
        const ok = await createNewsItem({ title: form.title, content: form.content, category: '공지사항' })
        if (ok) {
          showToast('success', '공지사항이 등록되었습니다.')
          fetchNotices().then(setNotices)
        } else showToast('error', '등록에 실패했습니다.')
      }
      cancelForm()
    } catch (err) { console.error('공지 저장 오류:', err); showToast('error', '오류가 발생했습니다.') }
    setSubmitting(false)
  }

  async function handleMoveToEvent(item: Notice) {
    if (!(await verifyAdmin())) { showToast('error', '관리자 로그인이 필요합니다.'); return }
    // 작성일을 행사일로 사용
    const ok = await moveNoticeToEvent(item.id, item.created_at.slice(0, 10))
    if (ok) {
      showToast('success', '행사로 이동되었습니다. 행사 관리에서 날짜를 수정할 수 있습니다.')
      fetchNotices().then(setNotices)
    } else showToast('error', '이동에 실패했습니다.')
  }

  async function handleDelete(id: string) {
    if (!(await verifyAdmin())) { showToast('error', '관리자 로그인이 필요합니다.'); return }
    const ok = await deleteNewsItem(id)
    if (ok) {
      showToast('success', '공지사항이 삭제되었습니다.')
      fetchNotices().then(setNotices)
    } else showToast('error', '삭제에 실패했습니다.')
    setDeleteConfirm(null)
  }

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
          <h1 className="text-2xl font-bold text-gray-900">공지사항 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">{branch.name} · 총 {notices.length}건</p>
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
            공지 작성
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            {editingId ? '공지사항 수정' : '새 공지사항 작성'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="공지사항 제목을 입력하세요"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
                style={{ '--tw-ring-color': branchColor } as React.CSSProperties}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
                rows={6}
                placeholder="공지사항 내용을 입력하세요"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all resize-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.important}
                  onChange={(e) => setForm({ ...form, important: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  중요 공지로 표시
                </span>
                <span className="text-xs text-gray-400">
                  (목록 상단에 강조 표시됩니다)
                </span>
              </label>
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

      {/* Notices List */}
      {notices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          등록된 공지사항이 없습니다.
        </div>
      ) : (
        <div className="space-y-2">
          {notices.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-4 ${
                item.important ? 'border-red-200' : 'border-gray-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.important && (
                      <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded flex-shrink-0">
                        중요
                      </span>
                    )}
                    <span className="font-medium text-gray-900 truncate">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{item.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(item.created_at)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(item)}
                    className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleMoveToEvent(item)}
                    className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="공지를 내리고 행사 기록으로 보관합니다"
                  >
                    행사로 이동
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(item.id)}
                    className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">공지사항 삭제</h3>
            <p className="text-sm text-gray-500 mb-6">
              이 공지사항을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.
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
