// 댓글 관리 JavaScript

// 댓글 불러오기 (최신 3개만)
async function loadComments(newsId, limit = 3) {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('news_id', newsId)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // 전체 댓글 개수 가져오기
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('news_id', newsId)
      .is('parent_id', null);

    displayComments(comments, newsId, count);
  } catch (error) {
    console.error('댓글 불러오기 오류:', error);
    alert('댓글을 불러오는데 실패했습니다.');
  }
}

// 모든 댓글 불러오기 (모달용)
async function loadAllComments(newsId) {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('news_id', newsId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    displayAllCommentsInModal(comments, newsId);
  } catch (error) {
    console.error('전체 댓글 불러오기 오류:', error);
    alert('댓글을 불러오는데 실패했습니다.');
  }
}

// 댓글 표시 (최신 3개)
function displayComments(comments, newsId, totalCount) {
  const commentsContainer = document.getElementById('commentsContainer');
  if (!commentsContainer) return;

  if (comments.length === 0) {
    commentsContainer.innerHTML = `
      <div class="text-center text-body-secondary py-4">
        <p class="mb-0">첫 댓글을 작성해보세요!</p>
      </div>
    `;
    return;
  }

  commentsContainer.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h6 class="mb-0 text-body-secondary">최근 댓글 ${Math.min(3, comments.length)}개 / 전체 ${totalCount}개</h6>
      ${totalCount > 3 ? `
        <button class="btn btn-sm btn-outline-primary" onclick="openAllCommentsModal('${newsId}')">
          <span class="fas fa-comment-dots me-1"></span>전체 댓글 보기
        </button>
      ` : ''}
    </div>
  `;

  comments.forEach(comment => {
    const commentHTML = createCommentHTML(comment, newsId);
    commentsContainer.insertAdjacentHTML('beforeend', commentHTML);
  });
}

// 모달에 전체 댓글 표시
function displayAllCommentsInModal(comments, newsId) {
  const modalContainer = document.getElementById('allCommentsModalBody');
  if (!modalContainer) return;

  if (comments.length === 0) {
    modalContainer.innerHTML = `
      <div class="text-center text-body-secondary py-4">
        <p class="mb-0">댓글이 없습니다.</p>
      </div>
    `;
    return;
  }

  modalContainer.innerHTML = '';

  comments.forEach(comment => {
    const commentHTML = createCommentHTML(comment, newsId, true);
    modalContainer.insertAdjacentHTML('beforeend', commentHTML);
  });

  // 모달 내 답글 로드
  setTimeout(() => {
    const modalCommentItems = modalContainer.querySelectorAll('.comment-item');
    modalCommentItems.forEach(item => {
      const commentId = item.getAttribute('data-comment-id');
      if (commentId) {
        loadReplies(commentId, newsId);
      }
    });
  }, 100);
}

// 전체 댓글 모달 열기
function openAllCommentsModal(newsId) {
  const modal = new bootstrap.Modal(document.getElementById('allCommentsModal'));
  modal.show();
  loadAllComments(newsId);
}

// 댓글 HTML 생성
function createCommentHTML(comment, newsId, isModal = false) {
  const formattedDate = new Date(comment.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <div class="comment-item border-bottom pb-3 mb-3" data-comment-id="${comment.id}">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div>
          <strong class="text-dark">${escapeHtml(comment.author_name)}</strong>
          <small class="text-body-secondary ms-2">${formattedDate}</small>
        </div>
      </div>
      <p class="mb-2">${escapeHtml(comment.content)}</p>
      <button class="btn btn-sm btn-link text-primary p-0" onclick="showReplyForm('${comment.id}', '${newsId}', ${isModal})">
        <span class="fas fa-reply me-1"></span>답글
      </button>
      <div id="replies-${comment.id}" class="ms-4 mt-3"></div>
      <div id="reply-form-${comment.id}" class="ms-4 mt-3" style="display:none;"></div>
    </div>
  `;
}

// 답글 폼 표시
function showReplyForm(parentId, newsId, isModal = false) {
  const formContainer = document.getElementById(`reply-form-${parentId}`);

  if (formContainer.style.display === 'block') {
    formContainer.style.display = 'none';
    return;
  }

  formContainer.style.display = 'block';
  formContainer.innerHTML = `
    <form onsubmit="submitReply(event, '${parentId}', '${newsId}', ${isModal})" class="card p-3 bg-light">
      <div class="mb-2">
        <input type="text" class="form-control form-control-sm" name="author_name" placeholder="이름" required>
      </div>
      <div class="mb-2">
        <textarea class="form-control form-control-sm" name="content" rows="2" placeholder="답글을 입력하세요" required></textarea>
      </div>
      <div class="d-flex gap-2">
        <button type="submit" class="btn btn-sm btn-primary">답글 작성</button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="hideReplyForm('${parentId}')">취소</button>
      </div>
    </form>
  `;
}

// 답글 폼 숨기기
function hideReplyForm(parentId) {
  const formContainer = document.getElementById(`reply-form-${parentId}`);
  formContainer.style.display = 'none';
  formContainer.innerHTML = '';
}

// 답글 제출
async function submitReply(event, parentId, newsId, isModal = false) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  const replyData = {
    news_id: newsId,
    parent_id: parentId,
    content: formData.get('content'),
    author_name: formData.get('author_name')
  };

  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([replyData])
      .select();

    if (error) throw error;

    alert('답글이 등록되었습니다!');
    hideReplyForm(parentId);
    loadReplies(parentId, newsId);

    // 모달이 아닌 경우 메인 댓글도 새로고침
    if (!isModal) {
      loadComments(newsId);
    }
  } catch (error) {
    console.error('답글 작성 오류:', error);
    alert('답글 작성에 실패했습니다: ' + error.message);
  }
}

// 답글 불러오기
async function loadReplies(parentId, newsId) {
  try {
    const { data: replies, error } = await supabase
      .from('comments')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const repliesContainer = document.getElementById(`replies-${parentId}`);
    if (!repliesContainer) return;

    if (replies.length === 0) {
      repliesContainer.innerHTML = '';
      return;
    }

    repliesContainer.innerHTML = '';

    replies.forEach(reply => {
      const formattedDate = new Date(reply.created_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const replyHTML = `
        <div class="reply-item border-start border-3 border-primary ps-3 mb-2">
          <div class="d-flex justify-content-between align-items-start mb-1">
            <div>
              <strong class="text-dark">${escapeHtml(reply.author_name)}</strong>
              <small class="text-body-secondary ms-2">${formattedDate}</small>
            </div>
          </div>
          <p class="mb-0 text-body-secondary">${escapeHtml(reply.content)}</p>
        </div>
      `;

      repliesContainer.insertAdjacentHTML('beforeend', replyHTML);
    });
  } catch (error) {
    console.error('답글 불러오기 오류:', error);
  }
}

// 댓글 작성
async function createComment(newsId, commentData) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        news_id: newsId,
        content: commentData.content,
        author_name: commentData.author_name
      }])
      .select();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('댓글 작성 오류:', error);
    throw error;
  }
}

// 댓글 폼 설정
function setupCommentForm(newsId) {
  const form = document.getElementById('commentForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const commentData = {
      content: formData.get('content'),
      author_name: formData.get('author_name') || '익명'
    };

    try {
      await createComment(newsId, commentData);
      alert('댓글이 등록되었습니다!');
      form.reset();
      loadComments(newsId);
    } catch (error) {
      alert('댓글 작성에 실패했습니다.');
    }
  });
}

// 유틸리티 함수
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 페이지 로드 시 모든 댓글의 답글 불러오기
async function loadAllReplies(newsId) {
  const commentItems = document.querySelectorAll('.comment-item');

  for (const item of commentItems) {
    const commentId = item.getAttribute('data-comment-id');
    if (commentId) {
      await loadReplies(commentId, newsId);
    }
  }
}
