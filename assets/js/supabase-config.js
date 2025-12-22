// Supabase 설정
var SUPABASE_URL = 'https://qcepxveeuscqvsuhbqyd.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZXB4dmVldXNjcXZzdWhicXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzkzNTgsImV4cCI6MjA3OTAxNTM1OH0.QV9Z9Wc6W9dbxYF5EZq7isIOQC7CBEQ3KLXmqFNh3Ro';

// Supabase 클라이언트 초기화 (에러 처리 포함)
// 갤럭시/삼성 인터넷 브라우저 호환성을 위해 var 사용
var supabase = null;
var supabaseReady = false;
var supabaseReadyCallbacks = [];
var _supabaseLib = null;

function initSupabase() {
  try {
    // CDN에서 로드된 라이브러리 확인
    var lib = _supabaseLib || window.supabase;

    if (lib && typeof lib.createClient === 'function') {
      // 라이브러리 백업 (처음 한 번만)
      if (!_supabaseLib) {
        _supabaseLib = lib;
      }

      // 클라이언트 생성
      var client = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      // 클라이언트가 제대로 생성되었는지 확인
      if (client && typeof client.from === 'function') {
        supabase = client;
        window.supabase = client;
        supabaseReady = true;
        console.log('Supabase 초기화 성공');

        // 대기 중인 콜백 실행
        for (var i = 0; i < supabaseReadyCallbacks.length; i++) {
          try {
            supabaseReadyCallbacks[i](client);
          } catch (e) {
            console.error('콜백 실행 오류:', e);
          }
        }
        supabaseReadyCallbacks = [];

        return true;
      } else {
        console.warn('Supabase 클라이언트 생성 실패 - client.from이 함수가 아님');
      }
    }
  } catch (error) {
    console.error('Supabase 초기화 오류:', error);
  }
  return false;
}

// Supabase 준비될 때까지 대기하는 헬퍼 함수
function waitForSupabase(timeout) {
  if (timeout === undefined) timeout = 10000; // 갤럭시용 타임아웃 증가

  return new Promise(function(resolve, reject) {
    // 이미 준비됨
    if (supabaseReady && supabase && typeof supabase.from === 'function') {
      resolve(supabase);
      return;
    }

    var timeoutId = setTimeout(function() {
      reject(new Error('Supabase 로딩 타임아웃'));
    }, timeout);

    supabaseReadyCallbacks.push(function(client) {
      clearTimeout(timeoutId);
      resolve(client);
    });
  });
}

// 즉시 초기화 시도
if (!initSupabase()) {
  // CDN 로딩이 늦은 경우, 재시도 (갤럭시에서 더 오래 걸릴 수 있음)
  var retryCount = 0;
  var maxRetries = 100; // 최대 10초 대기

  var retryInit = setInterval(function() {
    retryCount++;
    if (initSupabase() || retryCount >= maxRetries) {
      clearInterval(retryInit);
      if (retryCount >= maxRetries && !supabase) {
        console.warn('Supabase CDN 로딩 실패 - 일부 기능이 제한될 수 있습니다');
        // 대기 중인 콜백들에게 실패 알림
        for (var i = 0; i < supabaseReadyCallbacks.length; i++) {
          try {
            supabaseReadyCallbacks[i](null);
          } catch (e) {}
        }
        supabaseReadyCallbacks = [];
      }
    }
  }, 100);
}
