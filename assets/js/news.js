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

    displayNews(news);
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
      <a href="news-detail.html?id=${item.id}" class="list-group-item list-group-item-action border mb-3 hover-shadow transition-base">
        <div class="d-flex w-100 justify-content-between align-items-start mb-2">
          <h5 class="mb-1 fw-bold">${escapeHtml(item.title)}</h5>
          <small class="text-body-secondary">${formattedDate}</small>
        </div>
        <p class="mb-2 text-body-secondary">${escapeHtml(truncateText(item.content, 100))}</p>
        <div class="d-flex justify-content-between align-items-center">
          <span class="badge ${badgeClass}">${escapeHtml(item.badge_text || item.category)}</span>
          <small class="text-body-tertiary"><span class="fas fa-eye me-1"></span>${item.view_count}</small>
        </div>
      </a>
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
