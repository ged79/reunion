// News 관리 JavaScript

// 뉴스 목록 불러오기
async function loadNews() {
  try {
    const { data: news, error } = await supabase
      .from('news')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 각 뉴스의 댓글 개수 가져오기
    const newsWithComments = await Promise.all(
      news.map(async (item) => {
        const { count } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('news_id', item.id)
          .is('parent_id', null);

        return { ...item, comment_count: count || 0 };
      })
    );

    displayNews(newsWithComments);
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
    const badgeClass = getBadgeClass(item.badge_color);
    const formattedDate = new Date(item.created_at).toLocaleDateString('ko-KR');

    const newsHTML = `
      <div class="list-group-item border mb-3">
        <div class="news-header" style="cursor:pointer;" onclick="toggleNewsComments('${item.id}')">
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
            <div class="d-flex gap-2">
              <span class="badge ${badgeClass}">${escapeHtml(item.badge_text || item.category)}</span>
              <span class="badge bg-secondary">
                <span class="fas fa-comment me-1"></span>${item.comment_count || 0}
              </span>
            </div>
            <small class="text-body-tertiary"><span class="fas fa-eye me-1"></span>${item.view_count}</small>
          </div>
        </div>

        <!-- 댓글 섹션 (초기에는 숨김) -->
        <div class="news-comments-section mt-3 pt-3 border-top" id="comments-section-${item.id}" style="display:none;">
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
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('news')
      .insert([{
        ...newsData,
        author_id: user?.id,
        author_name: user?.email || newsData.author_name
      }])
      .select();

    if (error) throw error;

    alert('뉴스가 성공적으로 등록되었습니다!');
    return data;
  } catch (error) {
    console.error('뉴스 작성 오류:', error);
    alert('뉴스 작성에 실패했습니다: ' + error.message);
    throw error;
  }
}

// 뉴스 상세 보기
async function loadNewsDetail(newsId) {
  try {
    // 조회수 증가
    await supabase.rpc('increment_view_count', { news_id: newsId });

    const { data: news, error } = await supabase
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

  const badgeClass = getBadgeClass(news.badge_color);
  const formattedDate = new Date(news.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  detailContainer.innerHTML = `
    <div class="mb-4">
      <span class="badge ${badgeClass} mb-2">${escapeHtml(news.badge_text || news.category)}</span>
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
function getBadgeClass(color) {
  const colorMap = {
    'primary': 'bg-primary',
    'warning': 'bg-warning text-dark',
    'success': 'bg-success',
    'info': 'bg-info',
    'secondary': 'bg-secondary',
    'danger': 'bg-danger'
  };
  return colorMap[color] || 'bg-primary';
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

    const formData = new FormData(form);
    const newsData = {
      title: formData.get('title'),
      content: formData.get('content'),
      category: formData.get('category'),
      badge_text: formData.get('badge_text'),
      badge_color: formData.get('badge_color'),
      author_name: formData.get('author_name') || '관리자'
    };

    try {
      await createNews(newsData);
      form.reset();
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

  if (commentsSection.style.display === 'none') {
    commentsSection.style.display = 'block';
    toggleIcon.innerHTML = '<i class="fas fa-chevron-up"></i>';

    // 댓글 로드
    await loadNewsComments(newsId);
  } else {
    commentsSection.style.display = 'none';
    toggleIcon.innerHTML = '<i class="fas fa-chevron-down"></i>';
  }
}

// 뉴스 댓글 로드 (최대 3개)
async function loadNewsComments(newsId, limit = 3) {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('news_id', newsId)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const { count } = await supabase
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
    const { error } = await supabase
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

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  // 뉴스 목록 페이지
  if (document.getElementById('newsContainer')) {
    loadNews();
  }

  // 뉴스 상세 페이지
  const urlParams = new URLSearchParams(window.location.search);
  const newsId = urlParams.get('id');
  if (newsId && document.getElementById('newsDetail')) {
    loadNewsDetail(newsId);
  }

  // 뉴스 작성 폼
  setupNewsForm();
});
