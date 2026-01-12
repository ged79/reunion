// =============================================
// 행사 참석자 관리 기능
// =============================================

// 회원 목록 (드롭다운용)
var membersList = [
  "김종원", "임진석", "김용국", "박수용", "최원호", "한성욱", "박성현", "이경환",
  "다니엘", "돈이", "모티베이션", "배명호", "셔니", "여형구", "연규영", "열심히살자",
  "김영균", "윤용수", "윤진한", "이정희", "이종만", "정성용", "조훈희", "채흥열", "최두호"
];

// 참석자 수 가져오기
async function getParticipantCount(eventId) {
  try {
    var result = await window.supabase
      .from('event_participants')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);
    
    if (result.error) throw result.error;
    return result.count || 0;
  } catch (error) {
    console.error('참석자 수 조회 오류:', error);
    return 0;
  }
}

// 참석자 목록 가져오기
async function getParticipants(eventId) {
  try {
    var result = await window.supabase
      .from('event_participants')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    
    if (result.error) throw result.error;
    return result.data || [];
  } catch (error) {
    console.error('참석자 목록 조회 오류:', error);
    return [];
  }
}

// 참석 등록
async function addParticipant(eventId, memberName) {
  try {
    var result = await window.supabase
      .from('event_participants')
      .insert([{ event_id: eventId, member_name: memberName }])
      .select();
    
    if (result.error) {
      if (result.error.code === '23505') {
        alert(memberName + '님은 이미 참석 등록되어 있습니다.');
        return null;
      }
      throw result.error;
    }
    
    return result.data;
  } catch (error) {
    console.error('참석 등록 오류:', error);
    alert('참석 등록에 실패했습니다: ' + error.message);
    return null;
  }
}

// 참석 취소
async function removeParticipant(eventId, memberName) {
  try {
    var result = await window.supabase
      .from('event_participants')
      .delete()
      .eq('event_id', eventId)
      .eq('member_name', memberName);
    
    if (result.error) throw result.error;
    return true;
  } catch (error) {
    console.error('참석 취소 오류:', error);
    alert('참석 취소에 실패했습니다: ' + error.message);
    return false;
  }
}

// 참석 등록 처리
async function handleAttendance(eventId) {
  var select = document.getElementById('attendance-select-' + eventId);
  var memberName = select.value;
  
  if (!memberName) {
    alert('회원을 선택해주세요.');
    return;
  }
  
  var addResult = await addParticipant(eventId, memberName);
  if (addResult) {
    alert(memberName + '님의 참석이 등록되었습니다!');
    select.value = '';
    await refreshParticipantsUI(eventId);
  }
}

// 참석 취소 처리
async function handleCancelAttendance(eventId, memberName) {
  if (!confirm(memberName + '님의 참석을 취소하시겠습니까?')) {
    return;
  }
  
  var removeResult = await removeParticipant(eventId, memberName);
  if (removeResult) {
    await refreshParticipantsUI(eventId);
  }
}

// 참석자 UI 새로고침
async function refreshParticipantsUI(eventId) {
  var participants = await getParticipants(eventId);
  var count = participants.length;
  
  // 참석자 수 배지 업데이트
  var countEl = document.getElementById('participant-count-' + eventId);
  if (countEl) {
    countEl.textContent = count;
  }
  
  // 헤더의 배지도 업데이트
  var badgeEl = document.getElementById('participant-count-badge-' + eventId);
  if (badgeEl) {
    badgeEl.textContent = count;
  }
  
  // 참석자 목록 업데이트
  var listContainer = document.getElementById('participants-list-' + eventId);
  if (listContainer) {
    if (participants.length === 0) {
      listContainer.innerHTML = '<p class="text-body-secondary mb-0 small">아직 참석자가 없습니다.</p>';
    } else {
      var html = '';
      participants.forEach(function(p) {
        html += '<span class="badge bg-success me-1 mb-1">' + 
          escapeHtml(p.member_name) + 
          ' <i class="fas fa-times ms-1" style="cursor:pointer;" onclick="handleCancelAttendance(\'' + eventId + '\', \'' + p.member_name.replace(/'/g, "\'") + '\')"></i>' +
          '</span>';
      });
      listContainer.innerHTML = html;
    }
  }
}

// 회원 드롭다운 HTML 생성
function getMemberDropdownHTML(eventId) {
  var options = '<option value="">-- 회원 선택 --</option>';
  membersList.forEach(function(name) {
    options += '<option value="' + name + '">' + name + '</option>';
  });
  return '<select class="form-select form-select-sm" id="attendance-select-' + eventId + '" style="width: auto; display: inline-block; min-width: 150px;">' + options + '</select>';
}

// 참석 UI HTML 생성 (행사안내 카테고리용)
function getAttendanceHTML(item) {
  if (item.category !== '행사안내') return '';
  
  var dropdownHTML = getMemberDropdownHTML(item.id);
  
  return '<div class="mt-3 p-3 bg-white border rounded">' +
    '<div class="d-flex justify-content-between align-items-center mb-2">' +
    '<strong class="text-success"><i class="fas fa-user-check me-2"></i>참석자 <span class="badge bg-success" id="participant-count-' + item.id + '">0</span>명</strong>' +
    '</div>' +
    '<div id="participants-list-' + item.id + '" class="mb-3">' +
    '<div class="spinner-border spinner-border-sm text-success" role="status"><span class="visually-hidden">로딩중...</span></div>' +
    '</div>' +
    '<div class="d-flex gap-2 align-items-center flex-wrap">' +
    dropdownHTML +
    '<button class="btn btn-success btn-sm" onclick="handleAttendance(\'' + item.id + '\')">' +
    '<i class="fas fa-check me-1"></i>참석</button>' +
    '</div></div>';
}

// 행사 참석자 수 배지 HTML (목록에 표시용)
function getParticipantBadgeHTML(item) {
  if (item.category !== '행사안내') return '';
  return '<span class="badge bg-success" title="참석자"><i class="fas fa-user-check me-1"></i><span id="participant-count-badge-' + item.id + '">0</span></span>';
}

// 페이지 로드 시 참석자 수 로드
async function loadAllParticipantCounts(newsItems) {
  for (var i = 0; i < newsItems.length; i++) {
    var item = newsItems[i];
    if (item.category === '행사안내') {
      var count = await getParticipantCount(item.id);
      
      var countEl = document.getElementById('participant-count-' + item.id);
      if (countEl) countEl.textContent = count;
      
      var badgeEl = document.getElementById('participant-count-badge-' + item.id);
      if (badgeEl) badgeEl.textContent = count;
      
      // 참석자 목록도 로드
      var participants = await getParticipants(item.id);
      var listContainer = document.getElementById('participants-list-' + item.id);
      if (listContainer) {
        if (participants.length === 0) {
          listContainer.innerHTML = '<p class="text-body-secondary mb-0 small">아직 참석자가 없습니다.</p>';
        } else {
          var html = '';
          participants.forEach(function(p) {
            html += '<span class="badge bg-success me-1 mb-1">' + 
              escapeHtml(p.member_name) + 
              ' <i class="fas fa-times ms-1" style="cursor:pointer;" onclick="handleCancelAttendance(\'' + item.id + '\', \'' + p.member_name.replace(/'/g, "\'") + '\')"></i>' +
              '</span>';
          });
          listContainer.innerHTML = html;
        }
      }
    }
  }
}
