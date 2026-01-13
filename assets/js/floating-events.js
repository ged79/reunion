// 플로팅 행사 버튼 생성
(function() {
  // 현재 페이지가 events.html이면 버튼 표시 안함
  if (window.location.pathname.includes('events.html')) {
    return;
  }

  // 버튼 HTML 생성
  const floatingBtn = document.createElement('a');
  floatingBtn.href = 'events.html';
  floatingBtn.className = 'floating-events-btn';
  floatingBtn.innerHTML = '<span class="btn-text">행사</span>';

  // DOM에 추가
  document.body.appendChild(floatingBtn);
})();
