// ============================================
// 회원 관리 모듈 (CRUD + 동적 렌더링)
// ============================================

// 관리 비밀번호 해시
var ADMIN_PASSWORD_HASH = '21a450ca63e673188f62d47608211457ed9f61dc8184b39c38d8fdf4b9cbaa71';

// 수정 모드 상태
var currentEditMemberId = null;

// 카테고리 정의
var CATEGORIES = {
  leadership: { title: '지도부', order: 1 },
  construction: { title: '건설/건축', order: 2 },
  electric: { title: '전기/설비', order: 3 },
  equipment: { title: '장비/렌탈', order: 4 },
  service: { title: '서비스/유통', order: 5 },
  finance: { title: '금융', order: 6 },
  it: { title: 'IT', order: 7 }
};

// SHA-256 해시 함수
async function hashMemberPassword(password) {
  var encoder = new TextEncoder();
  var data = encoder.encode(password);
  var hashBuffer = await crypto.subtle.digest('SHA-256', data);
  var hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

// 이미지 업로드 함수
async function uploadMemberImage(file) {
  if (!file) return null;
  try {
    var fileExt = file.name.split('.').pop();
    var fileName = Date.now() + '_' + Math.random().toString(36).substring(7) + '.' + fileExt;
    var filePath = 'members/' + fileName;
    var result = await window.supabase.storage.from('events').upload(filePath, file);
    if (result.error) throw result.error;
    var urlResult = window.supabase.storage.from('events').getPublicUrl(filePath);
    return urlResult.data.publicUrl;
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    throw error;
  }
}

// HTML 이스케이프
function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

// ============================================
// members.html 용 - 회원 목록 로드 및 렌더링
// ============================================
async function loadMembers() {
  var container = document.getElementById('membersList');
  if (!container) return;

  container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">로딩중...</span></div></div>';

  try {
    var result = await window.supabase
      .from('members')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (result.error) throw result.error;
    var members = result.data;

    container.innerHTML = '';

    if (!members || members.length === 0) {
      container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-body-tertiary">등록된 회원이 없습니다.</p></div>';
      updateCategoryCounts({});
      return;
    }

    // 카테고리별 그룹화
    var grouped = {};
    members.forEach(function(m) {
      if (!grouped[m.category]) grouped[m.category] = [];
      grouped[m.category].push(m);
    });

    // 카테고리 순서대로 렌더링
    var categoryKeys = Object.keys(CATEGORIES).sort(function(a, b) {
      return CATEGORIES[a].order - CATEGORIES[b].order;
    });

    categoryKeys.forEach(function(catKey) {
      var catMembers = grouped[catKey];
      if (!catMembers || catMembers.length === 0) return;

      var cat = CATEGORIES[catKey];

      // 카테고리 헤더
      var headerDiv = document.createElement('div');
      headerDiv.className = 'col-12 category-header';
      headerDiv.setAttribute('data-category', catKey);
      headerDiv.innerHTML = '<div class="category-header-custom"><h3>' + escapeHtml(cat.title) + '</h3><span class="category-count">' + catMembers.length + '명</span></div>';
      container.appendChild(headerDiv);

      // 회원 카드
      catMembers.forEach(function(member) {
        var memberDiv = document.createElement('div');
        memberDiv.className = 'col-12 member-item';
        memberDiv.setAttribute('data-category', catKey);
        memberDiv.setAttribute('data-name', member.name);

        var badgeClass = member.role === '청년회장' ? 'bg-primary' : (member.role === '총무' ? 'bg-info' : '');
        var roleHTML = (member.role && member.role !== '회원') ? ' <span class="badge ' + badgeClass + '">' + escapeHtml(member.role) + '</span>' : '';
        var companyHTML = member.company ? '<p><strong>회사:</strong> ' + escapeHtml(member.company) + '</p>' : '';
        var fieldHTML = member.field ? '<p><strong>분야:</strong> ' + escapeHtml(member.field) + '</p>' : '';
        var imgSrc = member.image_url || 'assets/img/team/default.jpg';

        memberDiv.innerHTML = '<div class="member-compact-card" data-bs-toggle="modal" data-bs-target="#memberModal"' +
          ' data-id="' + member.id + '"' +
          ' data-name="' + escapeHtml(member.name) + '"' +
          ' data-role="' + escapeHtml(member.role || '') + '"' +
          ' data-company="' + escapeHtml(member.company || '') + '"' +
          ' data-field="' + escapeHtml(member.field || '') + '"' +
          ' data-phone="' + escapeHtml(member.phone || '') + '"' +
          ' data-img="' + escapeHtml(imgSrc) + '"' +
          ' data-position="' + escapeHtml(member.position || '') + '"' +
          ' data-birth="' + escapeHtml(member.birth || '') + '"' +
          ' data-address="' + escapeHtml(member.address || '') + '"' +
          ' data-title="' + escapeHtml(member.title || '') + '">' +
          '<img src="' + escapeHtml(imgSrc) + '" alt="' + escapeHtml(member.name) + '" />' +
          '<div class="member-compact-info">' +
          '<h5>' + escapeHtml(member.name) + roleHTML + '</h5>' +
          companyHTML + fieldHTML +
          '</div></div>';

        container.appendChild(memberDiv);
      });
    });

    // 카테고리 필터 카운트 업데이트
    updateCategoryCounts(grouped);
    // 검색/필터 재바인딩
    rebindFilters();

  } catch (error) {
    console.error('회원 목록 로드 실패:', error);
    container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-danger">회원 목록을 불러오는데 실패했습니다.</p></div>';
  }
}

// ============================================
// index.html 용 - 회원 그리드 로드
// ============================================
async function loadMembersGrid() {
  var container = document.getElementById('membersGrid');
  if (!container) return;

  try {
    var result = await window.supabase
      .from('members')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (result.error) throw result.error;
    var members = result.data;

    if (!members || members.length === 0) return;

    // 김종원, 임진석 우선 → 나머지 가나다순
    var priorityNames = ['김종원', '임진석'];
    members.sort(function(a, b) {
      var aIdx = priorityNames.indexOf(a.name);
      var bIdx = priorityNames.indexOf(b.name);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.name.localeCompare(b.name, 'ko');
    });

    // 소개 텍스트 회원 수 업데이트
    var descEl = document.getElementById('membersDesc');
    if (descEl) {
      descEl.innerHTML = '<span class="d-none d-md-inline">민족통일청년회 영동군 지부를 이끌어가는 ' + members.length + '명의 회원들</span><span class="d-md-none">민족통일청년회 영동군 지부 회원들</span><br/>클릭하시면 상세 정보를 확인하실 수 있습니다';
    }

    container.innerHTML = '';

    members.forEach(function(member) {
      var imgSrc = member.image_url || 'assets/img/team/default.jpg';
      var roleText = member.role || '회원';
      var col = document.createElement('div');
      col.className = 'col-6 col-sm-4 col-md-3 col-lg-2 mb-4';
      col.style.cursor = 'pointer';
      col.setAttribute('data-bs-toggle', 'modal');
      col.setAttribute('data-bs-target', '#memberModal');
      col.setAttribute('data-name', member.name);
      col.setAttribute('data-role', roleText);
      col.setAttribute('data-company', member.company || '');
      col.setAttribute('data-field', member.field || '');
      col.setAttribute('data-phone', member.phone || '');
      col.setAttribute('data-img', imgSrc);
      col.setAttribute('data-position', member.position || '');
      col.setAttribute('data-birth', member.birth || '');
      col.setAttribute('data-address', member.address || '');
      col.setAttribute('data-title', member.title || '');

      col.innerHTML = '<img class="rounded-circle img-fluid" src="' + escapeHtml(imgSrc) + '" alt="' + escapeHtml(member.name) + '" loading="lazy" style="width:100%;aspect-ratio:1;object-fit:cover;" />' +
        '<h6 class="mt-2 mb-0 fw-bold fs-10">' + escapeHtml(member.name) + '</h6>' +
        '<p class="text-body-secondary fs-11 mb-0">' + escapeHtml(roleText) + '</p>';

      container.appendChild(col);
    });

  } catch (error) {
    console.error('회원 그리드 로드 실패:', error);
  }
}

// 카테고리 필터 카운트 업데이트
function updateCategoryCounts(grouped) {
  var totalCount = 0;
  Object.keys(CATEGORIES).forEach(function(catKey) {
    var count = (grouped[catKey] && grouped[catKey].length) || 0;
    totalCount += count;
    var badge = document.getElementById('count-' + catKey);
    if (badge) badge.textContent = count;
  });
  var allBadge = document.getElementById('count-all');
  if (allBadge) allBadge.textContent = totalCount;
}

// 검색/필터 기능 바인딩
function rebindFilters() {
  var searchName = document.getElementById('searchName');
  var memberItems = document.querySelectorAll('.member-item');
  var categoryHeaders = document.querySelectorAll('.category-header');
  var filterButtons = document.querySelectorAll('.category-filter-btn');

  var selectedCategory = '';

  function filterMembers() {
    var searchQuery = searchName ? searchName.value.toLowerCase().trim() : '';
    var categoryVisibleCounts = {};
    var totalVisible = 0;

    memberItems.forEach(function(item) {
      var memberName = item.getAttribute('data-name').toLowerCase();
      var memberCategory = item.getAttribute('data-category');
      var card = item.querySelector('.member-compact-card');
      var memberField = card ? (card.getAttribute('data-field') || '').toLowerCase() : '';
      var memberCompany = card ? (card.getAttribute('data-company') || '').toLowerCase() : '';

      var searchMatch = searchQuery === '' ||
        memberName.indexOf(searchQuery) !== -1 ||
        memberField.indexOf(searchQuery) !== -1 ||
        memberCompany.indexOf(searchQuery) !== -1;
      var categoryMatch = selectedCategory === '' || memberCategory === selectedCategory;

      if (searchMatch && categoryMatch) {
        item.style.display = '';
        totalVisible++;
        if (!categoryVisibleCounts[memberCategory]) categoryVisibleCounts[memberCategory] = 0;
        categoryVisibleCounts[memberCategory]++;
      } else {
        item.style.display = 'none';
      }
    });

    categoryHeaders.forEach(function(header) {
      var category = header.getAttribute('data-category');
      var visibleCount = categoryVisibleCounts[category] || 0;
      if (visibleCount > 0) {
        header.style.display = '';
        var countSpan = header.querySelector('.category-count');
        if (countSpan) countSpan.textContent = visibleCount + '명';
      } else {
        header.style.display = 'none';
      }
    });
  }

  if (searchName && !searchName.dataset.bound) {
    searchName.addEventListener('input', filterMembers);
    searchName.dataset.bound = 'true';
  }

  filterButtons.forEach(function(btn) {
    if (!btn.dataset.bound) {
      btn.addEventListener('click', function() {
        filterButtons.forEach(function(b) {
          b.classList.remove('active', 'btn-dark');
          b.classList.add('btn-outline-dark');
        });
        btn.classList.add('active', 'btn-dark');
        btn.classList.remove('btn-outline-dark');
        selectedCategory = btn.getAttribute('data-category');
        filterMembers();
      });
      btn.dataset.bound = 'true';
    }
  });
}

// 회원 추가
async function addMember(formData) {
  try {
    var password = formData.password;
    if (!password) { alert('관리 비밀번호를 입력해주세요.'); return false; }
    var hash = await hashMemberPassword(password);
    if (hash !== ADMIN_PASSWORD_HASH) { alert('비밀번호가 올바르지 않습니다.'); return false; }

    var imageUrl = '';
    if (formData.imageFile) {
      imageUrl = await uploadMemberImage(formData.imageFile);
    }

    var insertData = {
      name: formData.name,
      role: formData.role || '회원',
      company: formData.company || '',
      field: formData.field || '',
      phone: formData.phone || '',
      position: formData.position || '',
      birth: formData.birth || '',
      address: formData.address || '',
      title: formData.title || '',
      category: formData.category || 'service',
      image_url: imageUrl || 'assets/img/team/default.jpg',
      sort_order: formData.sort_order || 0
    };

    var result = await window.supabase.from('members').insert([insertData]).select();
    if (result.error) throw result.error;

    alert('회원이 추가되었습니다.');
    return true;
  } catch (error) {
    console.error('회원 추가 실패:', error);
    alert('회원 추가에 실패했습니다: ' + error.message);
    return false;
  }
}

// 회원 삭제
async function deleteMember(memberId) {
  var password = prompt('회원을 삭제하려면 관리 비밀번호를 입력해주세요:');
  if (!password) return false;

  try {
    var hash = await hashMemberPassword(password);
    if (hash !== ADMIN_PASSWORD_HASH) { alert('비밀번호가 올바르지 않습니다.'); return false; }
    if (!confirm('정말로 이 회원을 삭제하시겠습니까?')) return false;

    var result = await window.supabase.from('members').delete().eq('id', memberId);
    if (result.error) throw result.error;

    alert('회원이 삭제되었습니다.');
    return true;
  } catch (error) {
    console.error('회원 삭제 실패:', error);
    alert('회원 삭제에 실패했습니다: ' + error.message);
    return false;
  }
}

// 회원 수정
async function updateMember(memberId, formData) {
  try {
    var password = formData.password;
    if (!password) { alert('관리 비밀번호를 입력해주세요.'); return false; }
    var hash = await hashMemberPassword(password);
    if (hash !== ADMIN_PASSWORD_HASH) { alert('비밀번호가 올바르지 않습니다.'); return false; }

    var updateData = {
      name: formData.name,
      role: formData.role || '회원',
      company: formData.company || '',
      field: formData.field || '',
      phone: formData.phone || '',
      position: formData.position || '',
      birth: formData.birth || '',
      address: formData.address || '',
      title: formData.title || '',
      category: formData.category || 'service'
    };

    // 새 이미지가 있으면 업로드
    if (formData.imageFile) {
      updateData.image_url = await uploadMemberImage(formData.imageFile);
    }

    var result = await window.supabase.from('members').update(updateData).eq('id', memberId).select();
    if (result.error) throw result.error;

    alert('회원 정보가 수정되었습니다.');
    return true;
  } catch (error) {
    console.error('회원 수정 실패:', error);
    alert('회원 수정에 실패했습니다: ' + error.message);
    return false;
  }
}

// 수정 폼 열기 - DB에서 회원 정보 가져와서 폼에 채우기
async function openEditForm() {
  var memberId = document.getElementById('memberModal').getAttribute('data-current-id');
  if (!memberId) return;

  try {
    var result = await window.supabase.from('members').select('*').eq('id', parseInt(memberId)).single();
    if (result.error) throw result.error;
    var member = result.data;

    // 상세 모달 닫기
    var detailModal = bootstrap.Modal.getInstance(document.getElementById('memberModal'));
    if (detailModal) detailModal.hide();

    // 폼에 기존 데이터 채우기
    setTimeout(function() {
      var form = document.getElementById('addMemberForm');
      if (!form) return;

      form.querySelector('#addMemberName').value = member.name || '';
      form.querySelector('#addMemberRole').value = member.role || '회원';
      form.querySelector('#addMemberCategory').value = member.category || 'service';
      form.querySelector('#addMemberCompany').value = member.company || '';
      form.querySelector('#addMemberField').value = member.field || '';
      form.querySelector('#addMemberPosition').value = member.position || '';
      form.querySelector('#addMemberPhone').value = member.phone || '';
      form.querySelector('#addMemberBirth').value = member.birth || '';
      form.querySelector('#addMemberAddress').value = member.address || '';
      form.querySelector('#addMemberTitle').value = member.title || '';
      form.querySelector('#addMemberPassword').value = '';

      // 현재 프로필 사진 미리보기
      var preview = document.getElementById('imagePreview');
      if (preview && member.image_url) {
        preview.innerHTML = '<img src="' + escapeHtml(member.image_url) + '" class="rounded-circle" style="width:80px;height:80px;object-fit:cover;" /><small class="d-block text-muted mt-1">새 사진을 선택하지 않으면 기존 사진이 유지됩니다</small>';
      }

      // 수정 모드 설정
      currentEditMemberId = parseInt(memberId);
      document.getElementById('addMemberModalLabel').textContent = '회원 수정';
      form.querySelector('button[type="submit"]').textContent = '회원 수정';

      // 추가 모달 열기
      var addModal = new bootstrap.Modal(document.getElementById('addMemberModal'));
      addModal.show();
    }, 400);

  } catch (error) {
    console.error('회원 정보 조회 실패:', error);
    alert('회원 정보를 불러오는데 실패했습니다.');
  }
}

// 회원 추가 폼 제출 핸들러
async function handleAddMemberSubmit(event) {
  event.preventDefault();
  var form = event.target;
  var submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = '등록 중...';

  var imageInput = document.getElementById('addMemberImage');
  var imageFile = imageInput && imageInput.files.length > 0 ? imageInput.files[0] : null;

  var formData = {
    name: form.querySelector('#addMemberName').value.trim(),
    role: form.querySelector('#addMemberRole').value,
    company: form.querySelector('#addMemberCompany').value.trim(),
    field: form.querySelector('#addMemberField').value.trim(),
    phone: form.querySelector('#addMemberPhone').value.trim(),
    position: form.querySelector('#addMemberPosition').value.trim(),
    birth: form.querySelector('#addMemberBirth').value.trim(),
    address: form.querySelector('#addMemberAddress').value.trim(),
    title: form.querySelector('#addMemberTitle').value.trim(),
    category: form.querySelector('#addMemberCategory').value,
    password: form.querySelector('#addMemberPassword').value,
    imageFile: imageFile
  };

  if (!formData.name) {
    alert('이름을 입력해주세요.');
    submitBtn.disabled = false;
    submitBtn.textContent = '회원 등록';
    return;
  }

  var isEdit = currentEditMemberId !== null;
  var success;

  try {
    if (isEdit) {
      success = await updateMember(currentEditMemberId, formData);
    } else {
      success = await addMember(formData);
    }

    submitBtn.disabled = false;
    submitBtn.textContent = isEdit ? '회원 수정' : '회원 등록';

    if (success) {
      form.reset();
      currentEditMemberId = null;
      var preview = document.getElementById('imagePreview');
      if (preview) preview.innerHTML = '';
      document.getElementById('addMemberModalLabel').textContent = '회원 추가';
      submitBtn.textContent = '회원 등록';
      var modal = bootstrap.Modal.getInstance(document.getElementById('addMemberModal'));
      if (modal) modal.hide();
      if (document.getElementById('membersList')) await loadMembers();
      if (document.getElementById('membersGrid')) await loadMembersGrid();
    }
  } catch (error) {
    console.error('회원 처리 오류:', error);
    alert('처리 중 오류가 발생했습니다.');
    submitBtn.disabled = false;
    submitBtn.textContent = isEdit ? '회원 수정' : '회원 등록';
  }
}

// 삭제 버튼 핸들러
async function handleDeleteMember() {
  var memberId = document.getElementById('memberModal').getAttribute('data-current-id');
  if (!memberId) return;

  try {
    var success = await deleteMember(parseInt(memberId));
    if (success) {
      var modal = bootstrap.Modal.getInstance(document.getElementById('memberModal'));
      if (modal) modal.hide();
      if (document.getElementById('membersList')) await loadMembers();
      if (document.getElementById('membersGrid')) await loadMembersGrid();
    }
  } catch (error) {
    console.error('회원 삭제 오류:', error);
    alert('삭제 중 오류가 발생했습니다.');
  }
}

// 이미지 미리보기
function setupImagePreview() {
  var imageInput = document.getElementById('addMemberImage');
  if (!imageInput) return;

  imageInput.addEventListener('change', function() {
    var preview = document.getElementById('imagePreview');
    if (!preview) return;
    preview.innerHTML = '';
    if (this.files && this.files[0]) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var img = document.createElement('img');
        img.src = e.target.result;
        img.className = 'rounded-circle';
        img.style.cssText = 'width:80px;height:80px;object-fit:cover;';
        preview.appendChild(img);
      };
      reader.readAsDataURL(this.files[0]);
    }
  });
}

// 상세 모달 이벤트 설정
function setupMemberModal() {
  var memberModal = document.getElementById('memberModal');
  if (!memberModal) return;

  memberModal.addEventListener('show.bs.modal', function(event) {
    var card = event.relatedTarget;
    if (!card) return;

    var id = card.getAttribute('data-id');
    var name = card.getAttribute('data-name');
    var role = card.getAttribute('data-role');
    var company = card.getAttribute('data-company');
    var field = card.getAttribute('data-field');
    var phone = card.getAttribute('data-phone');
    var img = card.getAttribute('data-img');
    var position = card.getAttribute('data-position');
    var birth = card.getAttribute('data-birth');
    var address = card.getAttribute('data-address');
    var title = card.getAttribute('data-title');

    memberModal.setAttribute('data-current-id', id || '');

    document.getElementById('modalImg').src = img;
    document.getElementById('modalImg').alt = name;
    document.getElementById('modalName').textContent = name;
    document.getElementById('modalRole').textContent = role;

    var companyRow = document.getElementById('modalCompanyRow');
    if (companyRow) {
      if (company) { document.getElementById('modalCompany').textContent = company; companyRow.style.display = 'block'; }
      else { companyRow.style.display = 'none'; }
    }

    var fieldRow = document.getElementById('modalFieldRow');
    if (fieldRow) {
      if (field) { document.getElementById('modalField').textContent = field; fieldRow.style.display = 'block'; }
      else { fieldRow.style.display = 'none'; }
    }

    var positionRow = document.getElementById('modalPositionRow');
    if (positionRow) {
      if (position) { document.getElementById('modalPosition').textContent = position; positionRow.style.display = 'block'; }
      else { positionRow.style.display = 'none'; }
    }

    var birthRow = document.getElementById('modalBirthRow');
    if (birthRow) {
      if (birth) { document.getElementById('modalBirth').textContent = birth + '년생'; birthRow.style.display = 'block'; }
      else { birthRow.style.display = 'none'; }
    }

    var addressRow = document.getElementById('modalAddressRow');
    if (addressRow) {
      if (address) { document.getElementById('modalAddress').textContent = address; addressRow.style.display = 'block'; }
      else { addressRow.style.display = 'none'; }
    }

    var titleEl = document.getElementById('modalTitle');
    if (titleEl) {
      if (title) { titleEl.textContent = title; titleEl.style.display = 'block'; }
      else { titleEl.style.display = 'none'; }
    }

    var phoneEl = document.getElementById('modalPhone');
    if (phoneEl) {
      phoneEl.textContent = phone;
      phoneEl.href = 'tel:' + (phone || '').replace(/-/g, '');
    }
    var callBtn = document.getElementById('modalCallBtn');
    if (callBtn) {
      callBtn.href = 'tel:' + (phone || '').replace(/-/g, '');
    }
  });
}

// 초기화
document.addEventListener('DOMContentLoaded', function() {
  setupMemberModal();
  setupImagePreview();

  var addForm = document.getElementById('addMemberForm');
  if (addForm) addForm.addEventListener('submit', handleAddMemberSubmit);

  var deleteBtn = document.getElementById('deleteMemberBtn');
  if (deleteBtn) deleteBtn.addEventListener('click', handleDeleteMember);

  var editBtn = document.getElementById('editMemberBtn');
  if (editBtn) editBtn.addEventListener('click', openEditForm);

  // 추가 모달이 닫힐 때 수정 모드 리셋
  var addModalEl = document.getElementById('addMemberModal');
  if (addModalEl) {
    addModalEl.addEventListener('hidden.bs.modal', function() {
      currentEditMemberId = null;
      document.getElementById('addMemberModalLabel').textContent = '회원 추가';
      var submitBtn = addModalEl.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = '회원 등록';
      var preview = document.getElementById('imagePreview');
      if (preview) preview.innerHTML = '';
    });
  }

  // members.html 용
  if (document.getElementById('membersList')) {
    loadMembers();
  }

  // index.html 용
  if (document.getElementById('membersGrid')) {
    loadMembersGrid();
  }
});
