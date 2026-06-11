'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { getBranch } from '@/lib/mockData'
import Image from 'next/image'
import { fetchMembers, createMember, updateMember, deleteMember, uploadMemberPhoto, isAdminLoggedIn, type Member } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

// 소속(division): 현재는 청년부만. 향후 민족통일협의회 등으로 확대 예정
const DIVISIONS = ['청년부']
const INDUSTRIES = ['건설/건축', '전기/전자', '서비스업', '금융/보험', 'IT/정보통신', '농업', '기타']

const emptyForm = {
  name: '',
  role: '회원',
  category: '청년부',
  company: '',
  position: '',
  industry: '',
  birth_year: '',
  address: '',
  phone: '',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AdminMembersPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const branchSlug = params.branch as string
  const branch = getBranch(branchSlug)

  const [members, setMembers] = useState<Member[]>([])
  useEffect(() => { fetchMembers().then(setMembers) }, [])
  const [showForm, setShowForm] = useState(searchParams.get('action') === 'new')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [filterCategory, setFilterCategory] = useState('전체')
  const [query, setQuery] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  if (!branch) return null
  const branchColor = branch.color
  const branchId = branch?.id ?? ''

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  function startEdit(member: Member) {
    setEditingId(member.id)
    setForm({
      name: member.name,
      role: member.role,
      category: member.category,
      company: member.company || '',
      position: member.position || '',
      industry: member.industry || '',
      birth_year: member.birth_year ? String(member.birth_year) : '',
      address: member.address || '',
      phone: member.phone || '',
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { showToast('error', '5MB 이하 이미지만 가능합니다.'); return }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isAdminLoggedIn()) { showToast('error', '관리자 로그인이 필요합니다.'); return }
    setSubmitting(true)
    try {
      // 사진 업로드 — 실패하면 저장 진행하지 않고 알림
      let photoUrl: string | null = null
      if (photoFile) {
        photoUrl = await uploadMemberPhoto(photoFile)
        if (!photoUrl) {
          showToast('error', '사진 업로드에 실패했습니다. 다시 시도해주세요.')
          setSubmitting(false)
          return
        }
      }

      if (editingId) {
        const updateData: Partial<Member> = {
          name: form.name,
          role: form.role,
          category: form.category,
          company: form.company || null,
          position: form.position || null,
          industry: form.industry || null,
          birth_year: form.birth_year ? Number(form.birth_year) : null,
          address: form.address || null,
          phone: form.phone || null,
        }
        // 사진 업로드한 경우 image_url도 업데이트
        if (photoUrl) {
          await supabase.from('members').update({ image_url: photoUrl }).eq('id', Number(editingId))
        }
        const ok = await updateMember(editingId, updateData)
        if (ok) {
          showToast('success', '회원 정보가 수정되었습니다.')
          fetchMembers().then(setMembers)
        } else {
          showToast('error', '수정에 실패했습니다.')
        }
      } else {
        const result = await createMember({
          name: form.name,
          role: form.role,
          category: form.category,
          company: form.company || null,
          position: form.position || null,
          industry: form.industry || null,
          birth_year: form.birth_year ? Number(form.birth_year) : null,
          address: form.address || null,
          phone: form.phone || null,
          photo_url: null,
        })
        if (result && photoUrl) {
          // 생성 후 사진 URL 업데이트
          await supabase.from('members').update({ image_url: photoUrl }).eq('id', Number(result.id))
        }
        if (result) {
          showToast('success', '회원이 등록되었습니다.')
          fetchMembers().then(setMembers)
        } else {
          showToast('error', '등록에 실패했습니다.')
        }
      }
      cancelForm()
    } catch { showToast('error', '오류가 발생했습니다.') }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!isAdminLoggedIn()) { showToast('error', '관리자 로그인이 필요합니다.'); return }
    const ok = await deleteMember(id)
    if (ok) {
      showToast('success', '회원이 삭제되었습니다.')
      fetchMembers().then(setMembers)
    } else {
      showToast('error', '삭제에 실패했습니다.')
    }
    setDeleteConfirm(null)
  }

  // 직업군(category) 드롭다운 — 고정 순서로 정렬
  const CATEGORY_ORDER = ['지도부', '건설/건축', '전기/설비', '장비/렌탈', '서비스/유통', '금융', 'IT']
  const categoryOptions = Array.from(new Set(members.map((m) => m.category).filter(Boolean))).sort(
    (a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a)
      const ib = CATEGORY_ORDER.indexOf(b)
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    }
  )
  const q = query.trim().toLowerCase()
  const filtered = members.filter((m) => {
    if (filterCategory !== '전체' && m.category !== filterCategory) return false
    if (!q) return true
    return [m.name, m.company, m.position, m.industry, m.category, m.phone]
      .some((f) => f?.toLowerCase().includes(q))
  })

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">{branch.name} · 총 {members.length}명</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm) }}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: branchColor }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            회원 등록
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">{editingId ? '회원 수정' : '새 회원 등록'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  placeholder="홍길동" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="010-0000-0000" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
                <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="회원, 지회장, 부회장 등" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">소속</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {DIVISIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">회사/소속</label>
                <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="회사명 또는 소속" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">직책</label>
                <input type="text" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}
                  placeholder="대표, 이사 등" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">업종/분야</label>
                <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">선택</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">출생연도</label>
                <input type="number" value={form.birth_year} onChange={(e) => setForm({ ...form, birth_year: e.target.value })}
                  placeholder="1990" min="1940" max="2010" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">직장 주소</label>
              <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="주소 입력" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {/* 사진 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">프로필 사진</label>
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-gray-200">
                    <Image src={photoPreview} alt="미리보기" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={handlePhotoChange}
                    className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  <p className="text-xs text-gray-400 mt-1">5MB 이하 JPG/PNG</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="px-5 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ backgroundColor: branchColor }}>
                {submitting ? '저장 중...' : editingId ? '수정 완료' : '등록'}
              </button>
              <button type="button" onClick={cancelForm}
                className="px-5 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름, 직업, 회사, 연락처로 검색"
          className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600" aria-label="검색어 지우기">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 직업군 필터 드롭다운 */}
      <div className="mb-4">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full sm:w-auto sm:min-w-[240px] px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="전체">전체 직업군 ({members.length}명)</option>
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat}>
              {cat} ({members.filter((m) => m.category === cat).length}명)
            </option>
          ))}
        </select>
      </div>

      {/* Result count */}
      <p className="text-xs text-gray-400 mb-3">
        {query || filterCategory !== '전체' ? `${filtered.length}명` : `총 ${members.length}명`}
      </p>

      {/* Members list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          {query ? `'${query}'에 해당하는 회원이 없습니다.` : '등록된 회원이 없습니다.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((member) => (
            <div key={member.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: branchColor }}
                  >
                    {member.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <span className="font-medium text-gray-900 text-sm">{member.name}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: branchColor }}>
                        {member.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {member.industry || '직업 미입력'}
                      {member.company && ` · ${member.company}`}
                      {member.phone && ` · ${member.phone}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(member)} className="px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">수정</button>
                  <button onClick={() => setDeleteConfirm(member.id)} className="px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium">삭제</button>
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
            <h3 className="font-bold text-gray-900 mb-2">회원 삭제</h3>
            <p className="text-sm text-gray-500 mb-6">이 회원을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">취소</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
