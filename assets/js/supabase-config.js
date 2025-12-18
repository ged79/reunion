// Supabase 설정
const SUPABASE_URL = 'https://qcepxveeuscqvsuhbqyd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZXB4dmVldXNjcXZzdWhicXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzkzNTgsImV4cCI6MjA3OTAxNTM1OH0.QV9Z9Wc6W9dbxYF5EZq7isIOQC7CBEQ3KLXmqFNh3Ro';

// Supabase 클라이언트 초기화 (에러 처리 포함)
let supabase = null;
let supabaseReady = false;
const supabaseReadyCallbacks = [];

function initSupabase() {
  try {
    if (window.supabase && window.supabase.createClient) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      supabaseReady = true;
      console.log('Supabase 초기화 성공');

      // 대기 중인 콜백 실행
      supabaseReadyCallbacks.forEach(cb => cb());
      supabaseReadyCallbacks.length = 0;

      return true;
    }
  } catch (error) {
    console.error('Supabase 초기화 오류:', error);
  }
  return false;
}

// Supabase 준비될 때까지 대기하는 헬퍼 함수
function waitForSupabase(timeout = 5000) {
  return new Promise((resolve, reject) => {
    if (supabaseReady && supabase) {
      resolve(supabase);
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error('Supabase 로딩 타임아웃'));
    }, timeout);

    supabaseReadyCallbacks.push(() => {
      clearTimeout(timeoutId);
      resolve(supabase);
    });
  });
}

// 즉시 초기화 시도
if (!initSupabase()) {
  // CDN 로딩이 늦은 경우, 재시도
  let retryCount = 0;
  const maxRetries = 50; // 최대 5초 대기

  const retryInit = setInterval(() => {
    retryCount++;
    if (initSupabase() || retryCount >= maxRetries) {
      clearInterval(retryInit);
      if (retryCount >= maxRetries && !supabase) {
        console.warn('Supabase CDN 로딩 실패 - 일부 기능이 제한될 수 있습니다');
        // 대기 중인 콜백들에게 실패 알림
        supabaseReadyCallbacks.forEach(cb => cb());
        supabaseReadyCallbacks.length = 0;
      }
    }
  }, 100);
}
