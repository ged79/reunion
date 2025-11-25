/**
 * 플로팅 게시판 메뉴
 * 모든 페이지에서 게시판에 빠르게 접근할 수 있는 플로팅 UI
 */

class FloatingBoard {
  constructor() {
    this.isOpen = false;
    this.currentTab = 'board'; // 'board' or 'news'
    this.currentFilter = 'all';
    this.posts = [];
    this.news = [];
    this.newPostCount = 0;
    this.newNewsCount = 0;
    this.lastCheckTime = new Date();

    this.init();
  }

  /**
   * 초기화
   */
  async init() {
    try {
      // HTML 구조 생성
      this.createHTML();

      // 이벤트 리스너 등록
      this.attachEventListeners();

      // 게시글과 뉴스 로드
      await Promise.all([
        this.loadPosts().catch(err => console.error('Failed to load posts:', err)),
        this.loadNews().catch(err => console.error('Failed to load news:', err))
      ]);

      // 실시간 업데이트 구독 (임시 비활성화 - WebSocket 오류로 인해)
      // this.subscribeToRealtime();

      // 주기적으로 새 글 확인 (5분마다)
      setInterval(() => this.checkNewContent(), 5 * 60 * 1000);
    } catch (error) {
      console.error('FloatingBoard initialization error:', error);
      // 초기화 실패해도 페이지는 계속 작동하도록 함
    }
  }

  /**
   * HTML 구조 생성
   */
  createHTML() {
    const html = `
      <!-- 플로팅 버튼 -->
      <button class="floating-board-btn" id="floatingBoardBtn" aria-label="게시판 열기">
        <span class="floating-board-icon">📋</span>
        <span class="floating-board-text">게시판</span>
        <span class="floating-board-badge" id="floatingBoardBadge" style="display: none;">0</span>
      </button>

      <!-- 오버레이 -->
      <div class="floating-board-overlay" id="floatingBoardOverlay"></div>

      <!-- 슬라이드 패널 -->
      <div class="floating-board-panel" id="floatingBoardPanel">
        <!-- 헤더 -->
        <div class="floating-board-header">
          <h3 class="floating-board-title">
            <span>📋</span>
            <span>알림</span>
          </h3>
          <button class="floating-board-close" id="floatingBoardClose" aria-label="닫기">
            ✕
          </button>
        </div>

        <!-- 탭 네비게이션 -->
        <div class="floating-board-tabs">
          <button class="floating-board-tab active" data-tab="board" id="tabBoard">
            게시판
            <span class="floating-board-tab-badge" id="boardBadge" style="display:none;">0</span>
          </button>
          <button class="floating-board-tab" data-tab="news" id="tabNews">
            뉴스
            <span class="floating-board-tab-badge" id="newsBadge" style="display:none;">0</span>
          </button>
        </div>

        <!-- 게시판 탭 컨텐츠 -->
        <div class="floating-board-tab-content active" id="boardTabContent">
          <!-- 카테고리 필터 -->
          <div class="floating-board-filters">
            <button class="filter-chip category-all active" data-filter="all">전체</button>
            <button class="filter-chip category-request" data-filter="request">🟠 요청</button>
            <button class="filter-chip category-info" data-filter="info">🔵 정보</button>
            <button class="filter-chip category-share" data-filter="share">🟢 나눔</button>
            <button class="filter-chip category-etc" data-filter="etc">🟣 기타</button>
          </div>

          <!-- 게시글 목록 -->
          <div class="floating-board-content" id="floatingBoardContent">
            <div class="floating-board-loading">
              <div class="loading-spinner"></div>
            </div>
          </div>
        </div>

        <!-- 뉴스 탭 컨텐츠 -->
        <div class="floating-board-tab-content" id="newsTabContent">
          <!-- 뉴스 목록 -->
          <div class="floating-board-content" id="floatingNewsContent">
            <div class="floating-board-loading">
              <div class="loading-spinner"></div>
            </div>
          </div>
        </div>

        <!-- 푸터 -->
        <div class="floating-board-footer">
          <button class="btn-write" id="floatingBoardWrite">✍️ 글쓰기</button>
          <button class="btn-view-all" id="floatingBoardViewAll">전체보기</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  /**
   * 이벤트 리스너 등록
   */
  attachEventListeners() {
    // 플로팅 버튼 클릭
    document.getElementById('floatingBoardBtn').addEventListener('click', () => {
      this.open();
    });

    // 닫기 버튼 클릭
    document.getElementById('floatingBoardClose').addEventListener('click', () => {
      this.close();
    });

    // 오버레이 클릭
    document.getElementById('floatingBoardOverlay').addEventListener('click', () => {
      this.close();
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // 탭 전환
    document.querySelectorAll('.floating-board-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.currentTarget.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // 카테고리 필터 클릭
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const filter = e.currentTarget.dataset.filter;
        this.setFilter(filter);
      });
    });

    // 글쓰기 버튼
    document.getElementById('floatingBoardWrite').addEventListener('click', () => {
      if (this.currentTab === 'news') {
        window.location.href = 'news-write.html';
      } else {
        window.location.href = 'board-write.html';
      }
    });

    // 전체보기 버튼
    document.getElementById('floatingBoardViewAll').addEventListener('click', () => {
      if (this.currentTab === 'news') {
        window.location.href = 'news.html';
      } else {
        window.location.href = 'board.html';
      }
    });
  }

  /**
   * 패널 열기
   */
  open() {
    this.isOpen = true;
    document.getElementById('floatingBoardPanel').classList.add('active');
    document.getElementById('floatingBoardOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';

    // 새 글 카운트 초기화
    this.newPostCount = 0;
    this.newNewsCount = 0;
    this.updateBadge();
    this.updateTabBadges();
    this.lastCheckTime = new Date();
  }

  /**
   * 패널 닫기
   */
  close() {
    this.isOpen = false;
    document.getElementById('floatingBoardPanel').classList.remove('active');
    document.getElementById('floatingBoardOverlay').classList.remove('active');
    document.body.style.overflow = '';
  }

  /**
   * 탭 전환
   */
  switchTab(tabName) {
    this.currentTab = tabName;

    // 탭 버튼 활성화
    document.querySelectorAll('.floating-board-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // 탭 컨텐츠 활성화
    document.querySelectorAll('.floating-board-tab-content').forEach(content => {
      content.classList.remove('active');
    });
    if (tabName === 'board') {
      document.getElementById('boardTabContent').classList.add('active');
    } else {
      document.getElementById('newsTabContent').classList.add('active');
    }
  }

  /**
   * 카테고리 필터 설정
   */
  setFilter(filter) {
    this.currentFilter = filter;

    // 필터 버튼 활성화
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

    // 게시글 렌더링
    this.renderPosts();
  }

  /**
   * 게시글 로드
   */
  async loadPosts() {
    try {
      // Supabase가 없으면 샘플 데이터 사용
      if (typeof supabase === 'undefined') {
        console.warn('Supabase not available, using sample data');
        this.posts = this.getSamplePosts();
        this.renderPosts();
        return;
      }

      const { data, error } = await supabase
        .from('board_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading posts:', error);
        this.renderError();
        return;
      }

      this.posts = data || [];

      // 최근 24시간 이내 게시글을 "새 글"로 카운트
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.newPostCount = this.posts.filter(post =>
        new Date(post.created_at) > oneDayAgo
      ).length;

      this.updateBadge();
      this.updateTabBadges();
      this.renderPosts();
    } catch (error) {
      console.error('Error:', error);
      this.renderError();
    }
  }

  /**
   * 뉴스 로드
   */
  async loadNews() {
    try {
      // Supabase가 없으면 샘플 데이터 사용
      if (typeof supabase === 'undefined') {
        console.warn('Supabase not available, using sample data');
        this.news = [];
        this.renderNews();
        return;
      }

      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading news:', error);
        this.renderNewsError();
        return;
      }

      this.news = data || [];

      // 최근 24시간 이내 뉴스를 "새 글"로 카운트
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.newNewsCount = this.news.filter(news =>
        new Date(news.created_at) > oneDayAgo
      ).length;

      this.updateBadge();
      this.updateTabBadges();
      this.renderNews();
    } catch (error) {
      console.error('Error:', error);
      this.renderNewsError();
    }
  }

  /**
   * 게시글 렌더링
   */
  renderPosts() {
    const content = document.getElementById('floatingBoardContent');

    // 필터링
    let filteredPosts = this.posts;
    if (this.currentFilter !== 'all') {
      filteredPosts = this.posts.filter(post => post.category === this.currentFilter);
    }

    // 최대 10개만 표시
    filteredPosts = filteredPosts.slice(0, 10);

    if (filteredPosts.length === 0) {
      content.innerHTML = `
        <div class="floating-board-empty">
          <div class="floating-board-empty-icon">📭</div>
          <div class="floating-board-empty-text">게시글이 없습니다</div>
        </div>
      `;
      return;
    }

    const html = filteredPosts.map(post => this.renderPostItem(post)).join('');
    content.innerHTML = html;

    // 게시글 클릭 이벤트
    content.querySelectorAll('.board-post-item').forEach(item => {
      item.addEventListener('click', () => {
        const postId = item.dataset.postId;
        window.location.href = `board.html?post=${postId}`;
      });
    });
  }

  /**
   * 게시글 아이템 렌더링
   */
  renderPostItem(post) {
    const categoryNames = {
      request: '요청',
      info: '정보',
      share: '나눔',
      etc: '기타'
    };

    const timeAgo = this.getTimeAgo(new Date(post.created_at));

    return `
      <div class="board-post-item" data-post-id="${post.id}">
        <div class="board-post-header">
          <span class="board-post-category category-${post.category}">
            ${categoryNames[post.category] || post.category}
          </span>
          <h4 class="board-post-title">${this.escapeHtml(post.title)}</h4>
        </div>
        <div class="board-post-meta">
          <div class="board-post-author">
            ${post.author_img ? `<img src="${post.author_img}" alt="${post.author_name}">` : ''}
            <span>${this.escapeHtml(post.author_name)}</span>
            <span>·</span>
            <span>${timeAgo}</span>
          </div>
          <div class="board-post-stats">
            <span>👁️ ${post.views || 0}</span>
            <span>💬 ${post.comments || 0}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 뉴스 렌더링
   */
  renderNews() {
    const content = document.getElementById('floatingNewsContent');

    // 최대 15개만 표시
    const displayNews = this.news.slice(0, 15);

    if (displayNews.length === 0) {
      content.innerHTML = `
        <div class="floating-board-empty">
          <div class="floating-board-empty-icon">📭</div>
          <div class="floating-board-empty-text">뉴스가 없습니다</div>
        </div>
      `;
      return;
    }

    const html = displayNews.map(news => this.renderNewsItem(news)).join('');
    content.innerHTML = html;

    // 뉴스 클릭 이벤트
    content.querySelectorAll('.news-item').forEach(item => {
      item.addEventListener('click', () => {
        const newsId = item.dataset.newsId;
        window.location.href = `news.html#news-${newsId}`;
      });
    });
  }

  /**
   * 뉴스 아이템 렌더링
   */
  renderNewsItem(news) {
    const timeAgo = this.getTimeAgo(new Date(news.created_at));

    // 새 글 체크 (최근 24시간 이내)
    const isNew = new Date(news.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newClass = isNew ? 'new' : '';

    // 썸네일 HTML
    const thumbnailHTML = news.image_url
      ? `<img src="${news.image_url}" alt="${this.escapeHtml(news.title)}" class="news-item-thumbnail">`
      : '<div class="news-item-thumbnail" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px;">📰</div>';

    return `
      <div class="news-item ${newClass}" data-news-id="${news.id}">
        ${thumbnailHTML}
        <div class="news-item-content">
          <span class="news-item-category ${news.category}">${this.escapeHtml(news.category)}</span>
          <h4 class="news-item-title">${this.escapeHtml(news.title)}</h4>
          <div class="news-item-meta">
            <span>${timeAgo}</span>
            <span>👁️ ${news.view_count || 0}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 에러 렌더링
   */
  renderError() {
    const content = document.getElementById('floatingBoardContent');
    content.innerHTML = `
      <div class="floating-board-empty">
        <div class="floating-board-empty-icon">⚠️</div>
        <div class="floating-board-empty-text">게시글을 불러올 수 없습니다</div>
      </div>
    `;
  }

  /**
   * 뉴스 에러 렌더링
   */
  renderNewsError() {
    const content = document.getElementById('floatingNewsContent');
    content.innerHTML = `
      <div class="floating-board-empty">
        <div class="floating-board-empty-icon">⚠️</div>
        <div class="floating-board-empty-text">뉴스를 불러올 수 없습니다</div>
      </div>
    `;
  }

  /**
   * 실시간 업데이트 구독
   */
  subscribeToRealtime() {
    if (typeof supabase === 'undefined') {
      return;
    }

    try {
      // 게시판 글 변경 구독
      supabase
        .channel('board_posts_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'board_posts' },
          (payload) => {
            console.log('Board post changed:', payload);

            if (payload.eventType === 'INSERT') {
              // 새 글 추가
              this.posts.unshift(payload.new);
              this.newPostCount++;
              this.updateBadge();
              this.updateTabBadges();

              // 패널이 열려있으면 즉시 렌더링
              if (this.isOpen && this.currentTab === 'board') {
                this.renderPosts();
              }
            } else if (payload.eventType === 'UPDATE') {
              // 글 수정
              const index = this.posts.findIndex(p => p.id === payload.new.id);
              if (index !== -1) {
                this.posts[index] = payload.new;
                if (this.isOpen && this.currentTab === 'board') {
                  this.renderPosts();
                }
              }
            } else if (payload.eventType === 'DELETE') {
              // 글 삭제
              this.posts = this.posts.filter(p => p.id !== payload.old.id);
              if (this.isOpen && this.currentTab === 'board') {
                this.renderPosts();
              }
            }
          }
        )
        .subscribe();

      // 뉴스 변경 구독
      supabase
        .channel('news_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'news' },
          (payload) => {
            console.log('News changed:', payload);

            if (payload.eventType === 'INSERT') {
              // 새 뉴스 추가
              if (payload.new.is_published) {
                this.news.unshift(payload.new);
                this.newNewsCount++;
                this.updateBadge();
                this.updateTabBadges();

                // 패널이 열려있으면 즉시 렌더링
                if (this.isOpen && this.currentTab === 'news') {
                  this.renderNews();
                }
              }
            } else if (payload.eventType === 'UPDATE') {
              // 뉴스 수정
              const index = this.news.findIndex(n => n.id === payload.new.id);
              if (index !== -1) {
                this.news[index] = payload.new;
                if (this.isOpen && this.currentTab === 'news') {
                  this.renderNews();
                }
              }
            } else if (payload.eventType === 'DELETE') {
              // 뉴스 삭제
              this.news = this.news.filter(n => n.id !== payload.old.id);
              if (this.isOpen && this.currentTab === 'news') {
                this.renderNews();
              }
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Error subscribing to realtime:', error);
    }
  }

  /**
   * 새 컨텐츠 확인 (게시판 + 뉴스)
   */
  async checkNewContent() {
    if (typeof supabase === 'undefined' || this.isOpen) {
      return;
    }

    try {
      // 새 게시판 글 확인
      const { data: newPosts, error: postsError } = await supabase
        .from('board_posts')
        .select('id')
        .gte('created_at', this.lastCheckTime.toISOString())
        .order('created_at', { ascending: false });

      if (!postsError && newPosts && newPosts.length > 0) {
        this.newPostCount = newPosts.length;
      }

      // 새 뉴스 확인
      const { data: newNews, error: newsError } = await supabase
        .from('news')
        .select('id')
        .eq('is_published', true)
        .gte('created_at', this.lastCheckTime.toISOString())
        .order('created_at', { ascending: false});

      if (!newsError && newNews && newNews.length > 0) {
        this.newNewsCount = newNews.length;
      }

      // 뱃지 업데이트
      this.updateBadge();
      this.updateTabBadges();
    } catch (error) {
      console.error('Error checking new content:', error);
    }
  }

  /**
   * 뱃지 업데이트 (게시판만)
   */
  updateBadge() {
    const badge = document.getElementById('floatingBoardBadge');
    // 플로팅 버튼 뱃지는 게시판 글만 표시
    if (this.newPostCount > 0) {
      badge.textContent = this.newPostCount > 99 ? '99+' : this.newPostCount;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }

    // index 페이지의 뉴스 버튼 뱃지도 업데이트
    this.updateIndexNewsBadge();
  }

  /**
   * 탭별 뱃지 업데이트
   */
  updateTabBadges() {
    // 게시판 뱃지
    const boardBadge = document.getElementById('boardBadge');
    if (this.newPostCount > 0) {
      boardBadge.textContent = this.newPostCount > 99 ? '99+' : this.newPostCount;
      boardBadge.style.display = 'inline-block';
    } else {
      boardBadge.style.display = 'none';
    }

    // 뉴스 뱃지
    const newsBadge = document.getElementById('newsBadge');
    if (this.newNewsCount > 0) {
      newsBadge.textContent = this.newNewsCount > 99 ? '99+' : this.newNewsCount;
      newsBadge.style.display = 'inline-block';
    } else {
      newsBadge.style.display = 'none';
    }
  }

  /**
   * index 페이지 뉴스 버튼 뱃지 업데이트
   */
  updateIndexNewsBadge() {
    const indexNewsBadge = document.getElementById('indexNewsBadge');
    if (!indexNewsBadge) return; // index 페이지가 아니면 종료

    if (this.newNewsCount > 0) {
      indexNewsBadge.textContent = this.newNewsCount > 99 ? '99+' : this.newNewsCount;
      indexNewsBadge.style.display = 'inline-block';
    } else {
      indexNewsBadge.style.display = 'none';
    }
  }

  /**
   * 시간 경과 표시
   */
  getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return '방금 전';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}일 전`;

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * HTML 이스케이프
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 샘플 데이터 (Supabase 없을 때)
   */
  getSamplePosts() {
    return [
      {
        id: 1,
        category: 'request',
        title: '인테리어 업체 추천해주세요',
        content: '사무실 리모델링을 계획하고 있는데...',
        author_name: '한성욱',
        author_img: 'assets/img/team/6.jpg',
        views: 24,
        comments: 2,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        category: 'info',
        title: '2025년 건설업 동향 정보 공유',
        content: '올해 건설업계 전망과 주요 정책 변화...',
        author_name: '김종원',
        author_img: 'assets/img/team/0.jpg',
        views: 45,
        comments: 0,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        category: 'share',
        title: '사무용 가구 나눔합니다',
        content: '사무실 이전으로 책상 2개, 의자 4개 나눔합니다...',
        author_name: '이경환',
        author_img: 'assets/img/team/4.jpg',
        views: 18,
        comments: 0,
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 4,
        category: 'etc',
        title: '다음 모임 일정 문의',
        content: '다음 정기 모임이 언제인지...',
        author_name: '박성현',
        author_img: 'assets/img/team/7.jpg',
        views: 32,
        comments: 0,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }
}

// 페이지 로드 시 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
  // Supabase 설정 파일이 로드되었는지 확인
  const initFloatingBoard = () => {
    window.floatingBoard = new FloatingBoard();
  };

  // Supabase가 이미 로드되었으면 즉시 초기화
  if (typeof supabase !== 'undefined') {
    initFloatingBoard();
  } else {
    // Supabase 로드를 기다림 (최대 2초)
    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts++;
      if (typeof supabase !== 'undefined' || attempts > 20) {
        clearInterval(checkInterval);
        initFloatingBoard();
      }
    }, 100);
  }
});
