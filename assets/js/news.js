// News 관리 JavaScript

// 비밀번호 해시 함수 (SHA-256)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// 이미지 업로드 함수
async function uploadImage(file) {
  if (!file) return null;

  try {
    // 파일명 생성 (타임스탬프 + 랜덤)
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `news/${fileName}`;

    console.log('이미지 업로드 시작:', filePath);

    // Supabase Storage에 업로드
    const { data, error } = await window.supabase.storage
      .from('events')
      .upload(filePath, file);

    if (error) {
      console.error('Storage 업로드 오류:', error);
      throw error;
    }

    // 공개 URL 가져오기
    const { data: urlData } = window.supabase.storage
      .from('events')
      .getPublicUrl(filePath);

    console.log('업로드 완료:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    throw error;
  }
}

// 뉴스 목록 불러오기
async function loadNews() {
  try {
    const { data: news, error } = await window.supabase
      .from('news')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 각 뉴스의 댓글 개수 가져오기
    const newsWithComments = await Promise.all(
      news.map(async (item) => {
        const { count } = await window.supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('news_id', item.id)
          .is('parent_id', null);

        return { ...item, comment_count: count || 0 };
      })
    );

    displayNews(newsWithComments);
    
    // 참석자 수 로드
    if (typeof loadAllParticipantCounts === 'function') {
      loadAllParticipantCounts(newsWithComments);
    }
  } catch (error) {
    console.error('뉴스 불러오기 오류:', error);
    alert('뉴스를 불러오는데 실패했습니다.');
  }
}

// 뉴스 표시
function displayNews(newsItems) {
  const newsContainer = document.getElementById('newsContainer');
  const loadingEl = document.getElementById('newsLoading');

  if (!newsContainer) return;

  // 로딩 숨기기
  if (loadingEl) loadingEl.style.display = 'none';

  newsContainer.innerHTML = '';

  if (newsItems.length === 0) {
    newsContainer.innerHTML = `
      <div class="text-center py-5 text-body-secondary">
        <p class="fs-4"><span class="fas fa-inbox me-2"></span>등록된 뉴스가 없습니다.</p>
        <a href="news-write.html" class="btn btn-primary mt-3">
          <span class="fas fa-plus me-2"></span>첫 뉴스 작성하기
        </a>
      </div>
    `;
    return;
  }

  newsItems.forEach(item => {
    const badgeClass = getBadgeClassByCategory(item.category);
    const formattedDate = new Date(item.created_at).toLocaleDateString('ko-KR');

    // 이미지 썸네일 HTML
    const thumbnailHTML = item.image_url ? `
      <div class="me-3 flex-shrink-0">
        <img src="${item.image_url}" alt="${escapeHtml(item.title)}"
             class="rounded" style="width: 80px; height: 80px; object-fit: cover;">
      </div>
    ` : '';

    const newsHTML = `
      <div class="list-group-item border mb-3" id="news-${item.id}">
        <div class="news-header" style="cursor:pointer;" onclick="toggleNewsComments('${item.id}')">
          <div class="d-flex">
            ${thumbnailHTML}
            <div class="flex-grow-1">
              <div class="d-flex w-100 justify-content-between align-items-start mb-2">
                <h5 class="mb-1 fw-bold">${escapeHtml(item.title)}</h5>
                <div class="d-flex align-items-center gap-2">
                  <small class="text-body-secondary">${formattedDate}</small>
                  <span class="toggle-icon" id="toggle-${item.id}">
                    <i class="fas fa-chevron-down"></i>
                  </span>
                </div>
              </div>
              <p class="mb-2 text-body-secondary">${escapeHtml(truncateText(item.content, 100))}</p>
              <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex gap-2 flex-wrap">
                  <span class="badge ${badgeClass}">${escapeHtml(item.category)}</span>
                  <span class="badge bg-secondary">
                    <span class="fas fa-comment me-1"></span>${item.comment_count || 0}
                  </span>
                  ${typeof getParticipantBadgeHTML === 'function' ? getParticipantBadgeHTML(item) : ''}
                </div>
                <div class="d-flex align-items-center gap-3">
                  <small class="text-body-tertiary"><span class="fas fa-eye me-1"></span>${item.view_count}</small>
                  <button class="btn btn-sm btn-link text-secondary p-0" onclick="event.stopPropagation(); openEditModal('${item.id}')" title="수정">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-link text-danger p-0" onclick="event.stopPropagation(); deleteNews('${item.id}')" title="삭제">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 전체 내용 및 댓글 섹션 (초기에는 숨김) -->
        <div class="news-comments-section mt-3 pt-3 border-top" id="comments-section-${item.id}" style="display:none;">
          <!-- 전체 본문 내용 -->
          <div class="mb-4 p-3 bg-light rounded">
            ${item.image_url ? `<div class="mb-3"><img src="${item.image_url}" alt="${escapeHtml(item.title)}" class="img-fluid rounded" style="max-height: 400px; object-fit: cover;"></div>` : ''}
            <div style="white-space: pre-wrap; line-height: 1.8;">${escapeHtml(item.content)}</div>
            ${item.event_date ? `<div class="mt-3 text-body-secondary"><i class="fas fa-calendar me-2"></i>행사일: ${new Date(item.event_date).toLocaleDateString('ko-KR')}</div>` : ''}
            ${item.location ? `<div class="text-body-secondary"><i class="fas fa-map-marker-alt me-2"></i>장소: ${escapeHtml(item.location)}</div>` : ''}
          </div>

          ${typeof getAttendanceHTML === 'function' ? getAttendanceHTML(item) : ''}

          <div class="mb-3">
            <strong class="text-primary"><i class="fas fa-comments me-2"></i>댓글 ${item.comment_count || 0}개</strong>
          </div>

          <!-- 댓글 작성 폼 -->
          <div class="card p-3 mb-3 bg-light">
            <form onsubmit="submitNewsComment(event, '${item.id}')">
              <div class="row g-2">
                <div class="col-md-3">
                  <input type="text" class="form-control form-control-sm" name="author_name" placeholder="이름" required>
                </div>
                <div class="col-md-7">
                  <input type="text" class="form-control form-control-sm" name="content" placeholder="댓글을 입력하세요" required>
                </div>
                <div class="col-md-2">
                  <button type="submit" class="btn btn-sm btn-primary w-100">
                    <i class="fas fa-paper-plane"></i>
                  </button>
                </div>
              </div>
            </form>
          </div>

          <!-- 댓글 목록 -->
          <div id="comments-list-${item.id}">
            <div class="text-center py-3">
              <div class="spinner-border spinner-border-sm text-primary" role="status">
                <span class="visually-hidden">로딩중...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    newsContainer.insertAdjacentHTML('beforeend', newsHTML);
  });
}

// 뉴스 작성
async function createNews(newsData) {
  try {
    // 현재 로그인한 사용자 확인
    const { data: { user } } = await window.supabase.auth.getUser();

    // 비밀번호 해시
    const password_hash = await hashPassword(newsData.password);

    // 이미지 업로드
    let image_url = null;
    if (newsData.image) {
      image_url = await uploadImage(newsData.image);
    }

    // 기본 데이터
    const insertData = {
      title: newsData.title,
      content: newsData.content,
      category: newsData.category,
      author_name: newsData.author_name || '관리자',
      author_id: user?.id,
      password_hash: password_hash,
      image_url: image_url
    };

    // 행사안내 카테고리인 경우 행사 필드 추가
    if (newsData.category === '행사안내') {
      insertData.event_date = newsData.event_date;
      insertData.location = newsData.location;
    }

    const { data, error } = await window.supabase
      .from('news')
      .insert([insertData])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    alert('뉴스가 성공적으로 등록되었습니다!');
    return data;
  } catch (error) {
    console.error('뉴스 작성 오류:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    alert('뉴스 작성에 실패했습니다: ' + error.message);
    throw error;
  }
}

// 뉴스 상세 보기
async function loadNewsDetail(newsId) {
  try {
    // 조회수 증가
    await window.supabase.rpc('increment_view_count', { news_id: newsId });

    const { data: news, error } = await window.supabase
      .from('news')
      .select('*')
      .eq('id', newsId)
      .single();

    if (error) throw error;

    displayNewsDetail(news);
  } catch (error) {
    console.error('뉴스 상세 불러오기 오류:', error);
    alert('뉴스를 불러오는데 실패했습니다.');
  }
}

// 뉴스 상세 표시
function displayNewsDetail(news) {
  const detailContainer = document.getElementById('newsDetail');
  if (!detailContainer) return;

  const badgeClass = getBadgeClassByCategory(news.category);
  const formattedDate = new Date(news.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  detailContainer.innerHTML = `
    <div class="mb-4">
      <span class="badge ${badgeClass} mb-2">${escapeHtml(news.category)}</span>
      <h1 class="display-6 mb-3">${escapeHtml(news.title)}</h1>
      <div class="d-flex text-body-secondary mb-4">
        <span class="me-3"><span class="fas fa-user me-1"></span>${escapeHtml(news.author_name || '관리자')}</span>
        <span class="me-3"><span class="fas fa-calendar me-1"></span>${formattedDate}</span>
        <span><span class="fas fa-eye me-1"></span>${news.view_count}</span>
      </div>
    </div>
    <div class="news-content">
      ${escapeHtml(news.content).replace(/\n/g, '<br>')}
    </div>
    <hr class="my-5">
    <div class="text-center">
      <a href="news.html" class="btn btn-outline-dark">목록으로 돌아가기</a>
    </div>
  `;
}

// 유틸리티 함수들
function getBadgeClassByCategory(category) {
  const categoryMap = {
    '공지사항': 'bg-primary',
    '행사안내': 'bg-warning text-dark',
    '기타': 'bg-secondary'
  };
  return categoryMap[category] || 'bg-primary';
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 폼 제출 핸들러
function setupNewsForm() {
  const form = document.getElementById('newsForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    console.log('폼 제출 시작...');

    const formData = new FormData(form);
    const imageInput = document.getElementById('image');
    const imageFile = imageInput ? imageInput.files[0] : null;

    console.log('이미지 파일:', imageFile);

    const newsData = {
      title: formData.get('title'),
      content: formData.get('content'),
      category: formData.get('category'),
      author_name: formData.get('author_name') || '관리자',
      password: formData.get('password'),
      image: imageFile
    };

    console.log('뉴스 데이터:', newsData);

    // 행사안내 카테고리인 경우 추가 필드
    if (formData.get('category') === '행사안내') {
      newsData.event_date = formData.get('event_date');
      newsData.location = formData.get('location');
    }

    try {
      await createNews(newsData);
      form.reset();
      if (document.getElementById('imagePreview')) {
        document.getElementById('imagePreview').style.display = 'none';
      }
      window.location.href = 'news.html';
    } catch (error) {
      // 에러는 createNews에서 처리됨
    }
  });
}

// 뉴스 댓글 토글
async function toggleNewsComments(newsId) {
  const commentsSection = document.getElementById(`comments-section-${newsId}`);
  const toggleIcon = document.getElementById(`toggle-${newsId}`);
  const newsElement = document.getElementById(`news-${newsId}`);

  if (commentsSection.style.display === 'none') {
    commentsSection.style.display = 'block';
    toggleIcon.innerHTML = '<i class="fas fa-chevron-up"></i>';

    // 댓글 로드
    await loadNewsComments(newsId);

    // 해당 뉴스 제목이 보이도록 상단으로 스크롤
    if (newsElement) {
      setTimeout(() => {
        newsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  } else {
    commentsSection.style.display = 'none';
    toggleIcon.innerHTML = '<i class="fas fa-chevron-down"></i>';
  }
}

// 뉴스 댓글 로드 (최대 3개)
async function loadNewsComments(newsId, limit = 3) {
  try {
    const { data: comments, error } = await window.supabase
      .from('comments')
      .select('*')
      .eq('news_id', newsId)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const { count } = await window.supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('news_id', newsId)
      .is('parent_id', null);

    displayNewsComments(newsId, comments, count);
  } catch (error) {
    console.error('댓글 로드 오류:', error);
  }
}

// 뉴스 댓글 표시
function displayNewsComments(newsId, comments, totalCount) {
  const commentsList = document.getElementById(`comments-list-${newsId}`);

  if (comments.length === 0) {
    commentsList.innerHTML = '<p class="text-body-secondary text-center py-3">첫 댓글을 작성해보세요!</p>';
    return;
  }

  let commentsHTML = '';

  comments.forEach(comment => {
    const formattedDate = new Date(comment.created_at).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    commentsHTML += `
      <div class="comment-item mb-2 pb-2 border-bottom">
        <div class="d-flex justify-content-between mb-1">
          <strong class="text-dark">${escapeHtml(comment.author_name)}</strong>
          <small class="text-body-secondary">${formattedDate}</small>
        </div>
        <p class="mb-0 text-body-secondary">${escapeHtml(comment.content)}</p>
      </div>
    `;
  });

  if (totalCount > 3) {
    commentsHTML += `
      <div class="text-center mt-3">
        <a href="news-detail.html?id=${newsId}" class="btn btn-sm btn-outline-primary">
          전체 댓글 보기 (${totalCount}개)
        </a>
      </div>
    `;
  }

  commentsList.innerHTML = commentsHTML;
}

// 뉴스 댓글 작성
async function submitNewsComment(event, newsId) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  const commentData = {
    news_id: newsId,
    content: formData.get('content'),
    author_name: formData.get('author_name')
  };

  try {
    const { error } = await window.supabase
      .from('comments')
      .insert([commentData]);

    if (error) throw error;

    alert('댓글이 등록되었습니다!');
    form.reset();

    // 댓글 새로고침
    await loadNewsComments(newsId);

    // 댓글 개수 업데이트
    await loadNews();
  } catch (error) {
    console.error('댓글 작성 오류:', error);
    alert('댓글 작성에 실패했습니다.');
  }
}

// 뉴스 수정 모달 열기
async function openEditModal(newsId) {
  try {
    // 뉴스 정보 불러오기
    const { data: news, error } = await window.supabase
      .from('news')
      .select('*')
      .eq('id', newsId)
      .single();

    if (error) throw error;

    // 폼에 데이터 채우기
    document.getElementById('edit_news_id').value = news.id;
    document.getElementById('edit_title').value = news.title;
    document.getElementById('edit_category').value = news.category;
    document.getElementById('edit_content').value = news.content;
    document.getElementById('edit_author_name').value = news.author_name || '';
    document.getElementById('edit_password').value = '';

    // 행사 필드 처리
    const eventFields = document.getElementById('edit_eventFields');
    const eventDateInput = document.getElementById('edit_event_date');
    const locationInput = document.getElementById('edit_location');

    if (news.category === '행사안내') {
      eventFields.style.display = 'block';
      eventDateInput.value = news.event_date || '';
      locationInput.value = news.location || '';
      eventDateInput.setAttribute('required', 'required');
    } else {
      eventFields.style.display = 'none';
      eventDateInput.value = '';
      locationInput.value = '';
      eventDateInput.removeAttribute('required');
    }

    // 카테고리 변경 이벤트 리스너 (이미 추가되지 않았다면)
    const categorySelect = document.getElementById('edit_category');
    if (!categorySelect.dataset.listenerAdded) {
      categorySelect.addEventListener('change', function() {
        if (this.value === '행사안내') {
          eventFields.style.display = 'block';
          eventDateInput.setAttribute('required', 'required');
        } else {
          eventFields.style.display = 'none';
          eventDateInput.removeAttribute('required');
          eventDateInput.value = '';
          locationInput.value = '';
        }
      });
      categorySelect.dataset.listenerAdded = 'true';
    }

    // 모달 열기
    const modal = new bootstrap.Modal(document.getElementById('editNewsModal'));
    modal.show();
  } catch (error) {
    console.error('뉴스 불러오기 오류:', error);
    alert('뉴스를 불러오는데 실패했습니다.');
  }
}

// 뉴스 삭제
async function deleteNews(newsId) {
  // 비밀번호 입력 프롬프트
  const password = prompt('삭제하려면 글 작성 시 설정한 비밀번호를 입력하세요:');

  if (!password) {
    return; // 취소
  }

  try {
    console.log('삭제 시작:', newsId);

    // 비밀번호 해시
    const password_hash = await hashPassword(password);
    console.log('입력한 비밀번호 해시:', password_hash);

    // 비밀번호 확인
    const { data: news, error: fetchError } = await window.supabase
      .from('news')
      .select('password_hash, title')
      .eq('id', newsId)
      .single();

    if (fetchError) {
      console.error('뉴스 조회 오류:', fetchError);
      throw fetchError;
    }

    console.log('저장된 비밀번호 해시:', news.password_hash);

    if (news.password_hash !== password_hash) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 삭제 확인
    if (!confirm(`"${news.title}" 글을 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    // 먼저 댓글 삭제
    const { error: commentsDeleteError } = await window.supabase
      .from('comments')
      .delete()
      .eq('news_id', newsId);

    if (commentsDeleteError) {
      console.error('댓글 삭제 오류:', commentsDeleteError);
      // 댓글 삭제 실패해도 계속 진행 (댓글이 없을 수도 있음)
    }

    // 뉴스 삭제 실행
    const { error: deleteError } = await window.supabase
      .from('news')
      .delete()
      .eq('id', newsId);

    if (deleteError) {
      console.error('삭제 오류:', deleteError);
      throw deleteError;
    }

    console.log('삭제 성공');

    alert('뉴스가 삭제되었습니다.');

    // 목록 새로고침
    await loadNews();
  } catch (error) {
    console.error('뉴스 삭제 오류:', error);
    alert('뉴스 삭제에 실패했습니다: ' + error.message);
  }
}

// 뉴스 수정 제출
async function submitEdit() {
  try {
    const newsId = document.getElementById('edit_news_id').value;
    const password = document.getElementById('edit_password').value;

    console.log('수정 시작:', newsId);

    // 비밀번호 해시
    const password_hash = await hashPassword(password);
    console.log('입력한 비밀번호 해시:', password_hash);

    // 비밀번호 확인
    const { data: news, error: fetchError } = await window.supabase
      .from('news')
      .select('password_hash')
      .eq('id', newsId)
      .single();

    if (fetchError) {
      console.error('뉴스 조회 오류:', fetchError);
      throw fetchError;
    }

    console.log('저장된 비밀번호 해시:', news.password_hash);

    if (news.password_hash !== password_hash) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 업데이트 데이터 준비
    const category = document.getElementById('edit_category').value;
    const updateData = {
      title: document.getElementById('edit_title').value,
      category: category,
      content: document.getElementById('edit_content').value,
      author_name: document.getElementById('edit_author_name').value || '관리자',
      updated_at: new Date().toISOString()
    };

    // 행사안내 카테고리인 경우 행사 필드 추가
    if (category === '행사안내') {
      updateData.event_date = document.getElementById('edit_event_date').value;
      updateData.location = document.getElementById('edit_location').value;
    } else {
      // 다른 카테고리로 변경되면 행사 필드 null로 설정
      updateData.event_date = null;
      updateData.location = null;
    }

    console.log('업데이트 데이터:', updateData);

    // 업데이트 실행
    const { data: updatedData, error: updateError } = await window.supabase
      .from('news')
      .update(updateData)
      .eq('id', newsId)
      .select();

    if (updateError) {
      console.error('업데이트 오류:', updateError);
      throw updateError;
    }

    console.log('업데이트 성공:', updatedData);

    alert('뉴스가 성공적으로 수정되었습니다!');

    // 모달 닫기
    const modal = bootstrap.Modal.getInstance(document.getElementById('editNewsModal'));
    if (modal) {
      modal.hide();
    }

    // 목록 새로고침
    await loadNews();
  } catch (error) {
    console.error('뉴스 수정 오류:', error);
    alert('뉴스 수정에 실패했습니다: ' + error.message);
  }
}

// 연간 행사 일정 로드 (news 테이블에서 행사안내 카테고리만)
async function loadEventsTimeline() {
  const loadingEl = document.getElementById('eventsLoading');
  const timelineEl = document.getElementById('scheduleTimeline');

  console.log('연간 행사 일정 로드 시작...');
  console.log('loadingEl:', loadingEl);
  console.log('timelineEl:', timelineEl);

  try {
    // 행사안내 카테고리의 뉴스만 가져오기 (행사 날짜 기준 최신순)
    const { data: events, error } = await window.supabase
      .from('news')
      .select('*')
      .eq('category', '행사안내')
      .order('event_date', { ascending: false })
      .limit(6);

    if (error) throw error;

    console.log('로드된 행사:', events);

    // 로딩 숨기기
    if (loadingEl) loadingEl.style.display = 'none';

    if (!timelineEl) return;

    // 타임라인 초기화
    timelineEl.innerHTML = '';

    if (events.length === 0) {
      timelineEl.innerHTML = `
        <div class="text-center py-4 text-body-secondary">
          <p><span class="fas fa-calendar-times me-2"></span>예정된 행사가 없습니다.</p>
          <a href="news-write.html" class="btn btn-sm btn-primary mt-2">
            <span class="fas fa-plus me-1"></span>행사 등록
          </a>
        </div>
      `;
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    events.forEach(event => {
      // event_date가 있으면 사용, 없으면 created_at 사용
      const dateToUse = event.event_date ? new Date(event.event_date) : new Date(event.created_at);
      const isPast = dateToUse < today;
      const badgeClass = isPast ? 'bg-success' : 'bg-primary';
      const badgeIcon = isPast ? 'fa-check' : 'fa-calendar';
      const badgeText = isPast ? '완료' : '예정';
      const statusClass = isPast ? 'completed' : 'upcoming';

      const formattedDate = dateToUse.toLocaleDateString('ko-KR');

      const eventHTML = `
        <div class="timeline-item mb-4" data-status="${statusClass}" id="event-${event.id}">
          <div class="d-flex">
            <div class="timeline-badge ${badgeClass}">
              <span class="fas ${badgeIcon}"></span>
            </div>
            <div class="timeline-content ms-3 flex-1">
              <div class="card border hover-shadow transition-base">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="mb-1 fw-bold">${escapeHtml(event.title)}</h5>
                    <small class="text-body-secondary">${formattedDate}</small>
                  </div>
                  ${event.content ? `<p class="mb-2 text-body-secondary">${escapeHtml(truncateText(event.content, 100))}</p>` : ''}
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="badge ${badgeClass}">${badgeText}</span>
                    ${event.location ? `<small class="text-body-tertiary"><span class="fas fa-map-marker-alt me-1"></span>${escapeHtml(event.location)}</small>` : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      timelineEl.insertAdjacentHTML('beforeend', eventHTML);
    });
  } catch (error) {
    console.error('행사 일정 불러오기 오류:', error);
    if (loadingEl) loadingEl.style.display = 'none';
    if (timelineEl) {
      timelineEl.innerHTML = `
        <div class="text-center py-4 text-danger">
          <p><span class="fas fa-exclamation-triangle me-2"></span>행사 일정을 불러오는데 실패했습니다.</p>
        </div>
      `;
    }
  }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
  // 페이지 초기화 함수
  function initNewsPage() {
    // 뉴스 목록 페이지
    if (document.getElementById('newsContainer')) {
      if (window.supabase && typeof window.supabase.from === 'function') {
        console.log('Supabase 준비 완료, 뉴스 로드 시작');
        loadNews().then(function() {
          // URL 해시가 있으면 해당 뉴스 자동으로 펼치기
          var hash = window.location.hash;
          if (hash && hash.indexOf('#news-') === 0) {
            var newsId = hash.replace('#news-', '');
            setTimeout(function() {
              toggleNewsComments(newsId);
              // 해당 뉴스로 스크롤
              var newsElement = document.getElementById(hash.substring(1));
              if (newsElement) {
                newsElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                });
              }
            }, 500);
          }
        }).catch(function(err) {
          console.error('뉴스 로드 오류:', err);
        });

        // 연간 행사 일정도 로드
        loadEventsTimeline();
      } else {
        // Supabase 없이 에러 메시지 표시
        var container = document.getElementById('newsContainer');
        var loadingEl = document.getElementById('newsLoading');
        if (loadingEl) loadingEl.style.display = 'none';
        if (container) {
          container.innerHTML = '<div class="text-center py-5 text-body-secondary">' +
            '<p class="fs-5"><span class="fas fa-exclamation-triangle me-2"></span>데이터를 불러올 수 없습니다.</p>' +
            '<p>잠시 후 다시 시도해주세요.</p>' +
            '<button class="btn btn-primary mt-3" onclick="location.reload()">' +
            '<span class="fas fa-refresh me-2"></span>새로고침</button></div>';
        }
      }
    }

    // 뉴스 상세 페이지
    var urlParams = new URLSearchParams(window.location.search);
    var newsId = urlParams.get('id');
    if (newsId && document.getElementById('newsDetail') && window.supabase && typeof window.supabase.from === 'function') {
      loadNewsDetail(newsId);
    }

    // 뉴스 작성 폼
    setupNewsForm();
  }

  // Supabase 준비 대기 (갤럭시용 타임아웃 증가)
  if (typeof waitForSupabase === 'function') {
    waitForSupabase(10000).then(function() {
      initNewsPage();
    }).catch(function(error) {
      console.warn('Supabase 로딩 실패:', error.message);
      initNewsPage(); // 실패해도 initNewsPage 호출하여 에러 메시지 표시
    });
  } else {
    // waitForSupabase가 없으면 잠시 후 시도
    setTimeout(initNewsPage, 2000);
  }
});
