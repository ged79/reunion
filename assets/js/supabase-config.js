// Supabase 설정
var SUPABASE_URL = 'https://qcepxveeuscqvsuhbqyd.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZXB4dmVldXNjcXZzdWhicXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzkzNTgsImV4cCI6MjA3OTAxNTM1OH0.QV9Z9Wc6W9dbxYF5EZq7isIOQC7CBEQ3KLXmqFNh3Ro';

// 모바일 및 Safari 감지
var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
var isPWA = window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true;

console.log('브라우저 감지 - 모바일:', isMobile, ', Safari:', isSafari, ', iOS:', isIOS, ', PWA:', isPWA);

// Safari PWA용 메모리 스토리지 (localStorage 대체)
var memoryStorage = {
  data: {},
  getItem: function(key) {
    return this.data[key] || null;
  },
  setItem: function(key, value) {
    this.data[key] = value;
  },
  removeItem: function(key) {
    delete this.data[key];
  }
};

// localStorage 사용 가능 여부 확인
function isLocalStorageAvailable() {
  try {
    var test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('localStorage 사용 불가:', e.message);
    return false;
  }
}

// Supabase 클라이언트 초기화
var supabaseReady = false;
var supabaseReadyCallbacks = [];
var supabaseInitError = null;

function initSupabase() {
  try {
    var lib = window.supabase;

    // 이미 클라이언트로 초기화되어 있는지 확인
    if (lib && typeof lib.from === 'function') {
      supabaseReady = true;
      supabaseInitError = null;
      console.log('Supabase 이미 초기화됨');
      runCallbacks(lib);
      return true;
    }

    // 라이브러리인 경우 (createClient 함수가 있음)
    if (lib && typeof lib.createClient === 'function') {
      // Safari PWA 또는 localStorage 불가 시 메모리 스토리지 사용
      var useMemoryStorage = (isSafari && isPWA) || (isIOS && isPWA) || !isLocalStorageAvailable();
      
      var clientOptions = {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      };

      // Safari PWA에서는 커스텀 스토리지 사용
      if (useMemoryStorage) {
        console.log('Safari PWA 감지 - 메모리 스토리지 사용');
        clientOptions.auth.storage = memoryStorage;
        clientOptions.auth.storageKey = 'supabase-auth';
        clientOptions.auth.flowType = 'implicit';
      }

      var client = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, clientOptions);
      
      if (client && typeof client.from === 'function') {
        window.supabase = client;
        supabaseReady = true;
        supabaseInitError = null;
        console.log('Supabase 초기화 성공 (메모리 스토리지:', useMemoryStorage, ')');
        runCallbacks(client);
        return true;
      }
    }

    console.log('Supabase 라이브러리 대기 중...');
  } catch (error) {
    console.error('Supabase 초기화 오류:', error);
    supabaseInitError = error;
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

// Supabase 준비될 때까지 대기 (모바일/Safari는 더 긴 타임아웃)
function waitForSupabase(timeout) {
  if (timeout === undefined) {
    timeout = (isMobile || isSafari || isPWA) ? 25000 : 10000;
  }

  return new Promise(function(resolve, reject) {
    if (supabaseReady && window.supabase && typeof window.supabase.from === 'function') {
      resolve(window.supabase);
      return;
    }

    var timeoutId = setTimeout(function() {
      var errorMsg = 'Supabase 로딩 타임아웃 (' + (timeout/1000) + '초)';
      if (supabaseInitError) {
        errorMsg += ' - ' + supabaseInitError.message;
      }
      console.error(errorMsg);
      reject(new Error(errorMsg));
    }, timeout);

    supabaseReadyCallbacks.push(function(client) {
      clearTimeout(timeoutId);
      if (client) {
        resolve(client);
      } else {
        reject(new Error('Supabase 클라이언트 초기화 실패'));
      }
    });
  });
}

// 전역 supabase 변수 접근용 게터
function getSupabase() {
  return window.supabase;
}

// Supabase 상태 확인
function isSupabaseReady() {
  return supabaseReady && window.supabase && typeof window.supabase.from === 'function';
}

// 수동 재시도 함수
function retrySupabaseInit() {
  supabaseReady = false;
  supabaseInitError = null;
  startSupabaseInit();
}

// 초기화 시작 함수
function startSupabaseInit() {
  if (!initSupabase()) {
    var retryCount = 0;
    // Safari PWA는 더 많이 재시도
    var maxRetries = (isSafari || isPWA || isMobile) ? 250 : 100;

    var retryInit = setInterval(function() {
      retryCount++;
      if (initSupabase() || retryCount >= maxRetries) {
        clearInterval(retryInit);
        if (retryCount >= maxRetries && !isSupabaseReady()) {
          console.warn('Supabase CDN 로딩 실패 (재시도 횟수:', retryCount, ')');
          supabaseInitError = new Error('CDN 로딩 실패');
          runCallbacks(null);
        }
      }
    }, 100);
  }
}

// 초기화 시도
startSupabaseInit();
