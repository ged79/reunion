'use client'

import { useRef, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { getBranch } from '@/lib/mockData'
import { fetchPhotos, fetchEvents, fetchNotices, uploadPhoto, deletePhoto, addVideo, extractYoutubeId, verifyAdmin, type Photo, type Event, type Notice } from '@/lib/supabase'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_FILES = 4 // 한 번에 올릴 수 있는 최대 장수

export default function AdminPhotosPage() {
  const params = useParams()
  const branchSlug = params.branch as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const branch = getBranch(branchSlug)

  const [photos, setPhotos] = useState<Photo[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  useEffect(() => {
    fetchPhotos().then(setPhotos)
    fetchEvents().then(setEvents)
    fetchNotices().then(setNotices)
  }, [])
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [selected, setSelected] = useState<{ file: File; url: string }[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  // 유튜브 영상 등록용 상태
  const [mode, setMode] = useState<'photo' | 'video'>('photo')
  const [videoUrl, setVideoUrl] = useState('')
  const [addingVideo, setAddingVideo] = useState(false)

  if (!branch) return null

  const branchColor = branch.color

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  function addFiles(list: FileList | null) {
    if (!list) return
    const valid: { file: File; url: string }[] = []
    for (const file of Array.from(list)) {
      if (file.size > MAX_FILE_SIZE) {
        showToast('error', `${file.name}: 파일 크기는 5MB 이하여야 합니다.`)
        continue
      }
      if (!file.type.startsWith('image/')) {
        showToast('error', `${file.name}: 이미지 파일만 업로드 가능합니다.`)
        continue
      }
      valid.push({ file, url: URL.createObjectURL(file) })
    }
    if (valid.length === 0) return
    setSelected((prev) => {
      if (prev.length + valid.length > MAX_FILES) {
        showToast('error', `한 번에 최대 ${MAX_FILES}장까지 올릴 수 있습니다.`)
        const room = MAX_FILES - prev.length
        valid.slice(room).forEach((v) => URL.revokeObjectURL(v.url))
        return [...prev, ...valid.slice(0, room)]
      }
      return [...prev, ...valid]
    })
  }

  function removeFile(index: number) {
    setSelected((prev) => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(e.target.files)
    e.target.value = '' // 같은 파일 재선택 가능하도록 초기화
  }

  function cancelUpload() {
    selected.forEach((s) => URL.revokeObjectURL(s.url))
    setSelected([])
    setCaption('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleUpload() {
    if (selected.length === 0) return
    if (!selectedEventId) {
      showToast('error', '사진을 연결할 글(행사/공지)을 선택해주세요.')
      return
    }
    if (!(await verifyAdmin())) { showToast('error', '관리자 로그인이 필요합니다.'); return }
    setUploading(true)

    let success = 0
    for (const { file } of selected) {
      const url = await uploadPhoto(file, selectedEventId, caption.trim() || undefined)
      if (url) success++
    }

    if (success > 0) {
      setPhotos(await fetchPhotos())
      if (success === selected.length) {
        showToast('success', `사진 ${success}장이 업로드되었습니다.`)
      } else {
        showToast('error', `${selected.length}장 중 ${success}장만 업로드되었습니다.`)
      }
      cancelUpload()
    } else {
      showToast('error', '업로드에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
    setUploading(false)
  }

  // 유튜브 영상 등록 — 파일 업로드 없이 URL만 저장
  async function handleAddVideo() {
    if (!videoUrl.trim()) { showToast('error', '유튜브 주소를 입력해주세요.'); return }
    if (!extractYoutubeId(videoUrl)) { showToast('error', '유튜브 주소 형식이 올바르지 않습니다.'); return }
    if (!selectedEventId) { showToast('error', '영상을 연결할 글(행사/공지)을 선택해주세요.'); return }
    if (!(await verifyAdmin())) { showToast('error', '관리자 로그인이 필요합니다.'); return }
    setAddingVideo(true)
    const ok = await addVideo(videoUrl, selectedEventId, caption.trim() || undefined)
    if (ok) {
      setPhotos(await fetchPhotos())
      showToast('success', '영상이 등록되었습니다.')
      setVideoUrl('')
      setCaption('')
    } else {
      showToast('error', '영상 등록에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
    setAddingVideo(false)
  }

  async function handleDelete(photoId: string) {
    if (!(await verifyAdmin())) { showToast('error', '관리자 로그인이 필요합니다.'); return }
    const ok = await deletePhoto(photoId)
    if (ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId))
      showToast('success', '사진이 삭제되었습니다.')
    } else {
      showToast('error', '삭제에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">사진 · 영상 관리</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {branch.name} · 총 {photos.length}개 &bull; 사진은 최대 5MB, 영상은 유튜브 링크로 등록
        </p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        {/* 사진/영상 등록 모드 탭 */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setMode('photo')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === 'photo' ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            style={mode === 'photo' ? { backgroundColor: branchColor } : undefined}
          >
            사진 업로드
          </button>
          <button
            onClick={() => setMode('video')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === 'video' ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            style={mode === 'video' ? { backgroundColor: branchColor } : undefined}
          >
            유튜브 영상
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />

        {mode === 'photo' && (selected.length === 0 ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <svg
              className="w-12 h-12 mx-auto text-gray-300 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <p className="text-sm font-medium text-gray-600">
              클릭하거나 파일을 드래그하세요
            </p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF (최대 5MB, 한 번에 {MAX_FILES}장까지)</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 선택된 사진 미리보기 그리드 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {selected.map((s, i) => (
                <div key={s.url} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={s.url}
                    alt={`미리보기 ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeFile(i)}
                    disabled={uploading}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80 transition-colors"
                    title="제거"
                  >
                    ✕
                  </button>
                  <p className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 truncate">
                    {s.file.name} · {(s.file.size / 1024 / 1024).toFixed(1)}MB
                  </p>
                </div>
              ))}
              {selected.length < MAX_FILES && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-1 text-xs"
                >
                  <span className="text-2xl leading-none">+</span>
                  추가 ({selected.length}/{MAX_FILES})
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연결할 글 (행사/공지) <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">행사 또는 공지를 선택하세요</option>
                  <optgroup label="행사">
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        [{ev.date}] {ev.title}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="공지">
                    {notices.map((n) => (
                      <option key={n.id} value={n.id}>
                        [{n.created_at.slice(0, 10)}] {n.title}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사진 설명 (선택, 모든 사진에 함께 적용)
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="사진에 대한 설명을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-5 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ backgroundColor: branchColor }}
              >
                {uploading ? '업로드 중...' : `업로드 (${selected.length}장)`}
              </button>
              <button
                onClick={cancelUpload}
                disabled={uploading}
                className="px-5 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        ))}

        {/* 유튜브 영상 등록 폼 */}
        {mode === 'video' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                유튜브 영상 주소 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtu.be/... 또는 https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                유튜브에 영상을 먼저 올린 뒤, 그 링크를 붙여넣으세요. 썸네일은 자동으로 표시됩니다.
              </p>
            </div>

            {/* 썸네일 미리보기 — 올바른 주소면 즉시 표시 */}
            {extractYoutubeId(videoUrl) && (
              <div className="relative w-full max-w-xs rounded-lg overflow-hidden border border-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${extractYoutubeId(videoUrl)}/hqdefault.jpg`}
                  alt="영상 미리보기"
                  className="w-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-black/55 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                연결할 글 (행사/공지) <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">행사 또는 공지를 선택하세요</option>
                <optgroup label="행사">
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      [{ev.date}] {ev.title}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="공지">
                  {notices.map((n) => (
                    <option key={n.id} value={n.id}>
                      [{n.created_at.slice(0, 10)}] {n.title}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                영상 설명 (선택)
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="영상에 대한 설명을 입력하세요"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleAddVideo}
              disabled={addingVideo}
              className="px-5 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ backgroundColor: branchColor }}
            >
              {addingVideo ? '등록 중...' : '영상 등록'}
            </button>
          </div>
        )}
      </div>

      {/* Photo Grid */}
      {photos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          등록된 사진이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden group">
              <div className="relative h-44 bg-gray-100">
                <Image
                  src={photo.image_url}
                  alt={photo.caption || '사진'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                {/* 영상 배지 */}
                {photo.media_type === 'video' && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium flex items-center gap-1">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    영상
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <button
                    onClick={() => setDeleteConfirm(photo.id)}
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    삭제
                  </button>
                </div>
              </div>
              {photo.caption && (
                <p className="text-xs text-gray-600 px-3 py-2 truncate">
                  {photo.caption}
                </p>
              )}
              <p className="text-xs text-gray-400 px-3 pb-2">
                {new Date(photo.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">삭제 확인</h3>
            <p className="text-sm text-gray-500 mb-6">
              이 항목을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다. (영상은 사이트에서만 제거되며 유튜브 원본은 그대로 남습니다.)
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
