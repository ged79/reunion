// Supabase 설정
var SUPABASE_URL = 'https://qcepxveeuscqvsuhbqyd.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZXB4dmVldXNjcXZzdWhicXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzkzNTgsImV4cCI6MjA3OTAxNTM1OH0.QV9Z9Wc6W9dbxYF5EZq7isIOQC7CBEQ3KLXmqFNh3Ro';

// Supabase 클라이언트 초기화
var supabaseReady = false;
var supabaseReadyCallbacks = [];

function initSupabase() {
  try {
    var lib = window.supabase;

    // 이미 클라이언트로 초기화되어 있는지 확인
    if (lib && typeof lib.from === 'function') {
      supabaseReady = true;
      console.log('Supabase 이미 초기화됨');
      runCallbacks(lib);
      return true;
    }

    // 라이브러리인 경우 (createClient 함수가 있음)
    if (lib && typeof lib.createClient === 'function') {
      var client = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      if (client && typeof client.from === 'function') {
        window.supabase = client;
        supabaseReady = true;
        console.log('Supabase 초기화 성공');
        runCallbacks(client);
        return true;
      }
    }

    console.log('Supabase 라이브러리 대기 중...');
  } catch (error) {
    console.error('Supabase 초기화 오류:', error);
  }
  return false;
}

function runCallbacks(client) {
  for (var i = 0; i < supabaseReadyCallbacks.length; i++) {
    try {
      supabaseReadyCallbacks[i](client);
    } catch (e) {
      console.error('콜백 오류:', e);
    }
  }
  supabaseReadyCallbacks = [];
}

// Supabase 준비될 때까지 대기
function waitForSupabase(timeout) {
  if (timeout === undefined) timeout = 10000;

  return new Promise(function(resolve, reject) {
    if (supabaseReady && window.supabase && typeof window.supabase.from === 'function') {
      resolve(window.supabase);
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

// 전역 supabase 변수 접근용 게터
function getSupabase() {
  return window.supabase;
}

// 초기화 시도
if (!initSupabase()) {
  var retryCount = 0;
  var maxRetries = 100;

  var retryInit = setInterval(function() {
    retryCount++;
    if (initSupabase() || retryCount >= maxRetries) {
      clearInterval(retryInit);
      if (retryCount >= maxRetries && (!window.supabase || typeof window.supabase.from !== 'function')) {
        console.warn('Supabase CDN 로딩 실패');
        runCallbacks(null);
      }
    }
  }, 100);
}
