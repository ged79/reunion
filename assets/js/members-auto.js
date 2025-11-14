// 회원 데이터 배열 (여기만 수정하면 자동으로 카테고리별 그룹화됩니다)
const membersData = [
  {name:"김종원",role:"청년회장",company:"(주)범증",field:"건설업",category:"leadership",image:"0.jpg",desc:"민족통일청년회 영동군 지부를 이끌며 지역 건설업계 발전에 앞장서고 있습니다."},
  {name:"임진석",role:"총무",company:"레인보우꽃집 / (주)코넥서스 이사",field:"서비스업",category:"leadership",image:"1.jpg",desc:"조직의 총무로서 회원 관리와 대외 협력을 담당하고 있습니다."},
  {name:"김용국",role:"회원",company:"",field:"장비임대업",category:"service",image:"2.jpg",desc:"사다리차 사업을 통해 지역 산업 발전에 기여하고 있습니다."},
  {name:"박수용",role:"회원",company:"",field:"건설업",category:"construction",image:"8.jpg",desc:"건설업 분야에서 활동하고 있습니다."},
  {name:"최원호",role:"회원",company:"",field:"건설업",category:"construction",image:"3.jpg",desc:"건설업을 경영하며 지역 인프라 발전에 기여하고 있습니다."},
  {name:"한성욱",role:"회원",company:"신협",field:"금융업",category:"finance",image:"6.jpg",desc:"지역 금융 발전과 주민 재무 관리를 지원하고 있습니다."},
  {name:"박성현",role:"회원",company:"길인당 CEO",field:"인쇄업",category:"manufacturing",image:"7.jpg",desc:"지역 인쇄 및 판촉물 제작을 통해 사업체들을 지원하고 있습니다."},
  {name:"이경환",role:"회원",company:"코넥서스 CTO",field:"IT 기업",category:"tech",image:"4.jpg",desc:"홈페이지, 앱, 시스템 구축 및 유지보수를 전문으로 하는 IT 전문가입니다."},
  {name:"다니엘",role:"회원",company:"",field:"",category:"other",image:"3.jpg",desc:"민족통일청년회 영동군 지부 회원으로 활동하고 있습니다."},
  {name:"돈이",role:"회원",company:"",field:"",category:"other",image:"4.jpg",desc:"민족통일청년회 영동군 지부 회원으로 활동하고 있습니다."},
  {name:"모티베이션",role:"회원",company:"",field:"",category:"other",image:"5.jpg",desc:"민족통일청년회 영동군 지부 회원으로 활동하고 있습니다."},
  {name:"배명호",role:"회원",company:"",field:"",category:"other",image:"9.jpg",desc:"민족통일청년회 영동군 지부 회원으로 활동하고 있습니다."},
  {name:"셔니",role:"회원",company:"",field:"",category:"other",image:"0.jpg",desc:"민족통일청년회 영동군 지부 회원으로 활동하고 있습니다."},
  {name:"여형구",role:"회원",company:"",field:"",category:"other",image:"1.jpg",desc:"민족통일청년회 영동군 지부 회원으로 활동하고 있습니다."},
  {name:"연규영",role:"회원",company:"",field:"",category:"other",image:"2.jpg",desc:"민족통일청년회 영동군 지부 회원으로 활동하고 있습니다."},
  {name:"열심히살자",role:"회원",company:"",field:"",category:"other",image:"3.jpg",desc:"민족통일청년회 영동군 지부 회원으로 활동하고 있습니다."},
  {name:"김영균",role:"회원",company:"",field:"",category:"other",image:"4.jpg",desc:"민족통일청년회 영동군 지부 회원으로 활동하고 있습니다."},
  {name:"윤용수",role:"회원",company:"",field:"",category:"other",image:"5.jpg",desc:"민족통일청년회 영동군 지부 회원으로 활동하고 있습니다."},
  {name:"윤진한",role:"회원",company:"",field:"",category:"other",image:"6.jpg",desc:"민족통일청년회 영동군 지부 회원으로 활동하고 있습니다."},
  {name:"이정희",role:"회원",company:"",field:"",category:"other",image:"7.jpg",desc:"민족통일청년회 영동군 지부 회원으로 활동하고 있습니다."},
  {name:"이종만",role:"회원",company:"",field:"",category:"other",image:"8.jpg",desc:"민족통일청년회 영동군 지부 회원으로 활동하고 있습니다."},
  {name:"정성용",role:"회원",company:"",field:"",category:"other",image:"9.jpg",desc:"민족통일청년회 영동군 지부 회원으로 활동하고 있습니다."},
  {name:"조훈희",role:"회원",company:"",field:"",category:"other",image:"0.jpg",desc:"민족통일청년회 영동군 지부 회원으로 활동하고 있습니다."},
  {name:"채흥열",role:"회원",company:"",field:"",category:"other",image:"1.jpg",desc:"민족통일청년회 영동군 지부 회원으로 활동하고 있습니다."},
  {name:"최두호",role:"회원",company:"",field:"해병대",category:"other",image:"2.jpg",desc:"민족통일청년회 영동군 지부 회원으로 활동하고 있습니다."}
];

const categories = {
  leadership: {title:"지도부",icon:"👔",color:"#667eea"},
  construction: {title:"건설/부동산",icon:"🏗️",color:"#f093fb"},
  tech: {title:"IT/기술",icon:"💻",color:"#4facfe"},
  service: {title:"서비스업",icon:"🌸",color:"#43e97b"},
  finance: {title:"금융업",icon:"🏦",color:"#fa709a"},
  manufacturing: {title:"제조/인쇄",icon:"📄",color:"#feca57"},
  other: {title:"기타 회원",icon:"👥",color:"#95a5a6"}
};

function renderMembers() {
  const container = document.getElementById('membersListContainer');
  if (!container) return;

  Object.keys(categories).forEach((catKey) => {
    const catMembers = membersData.filter(m => m.category === catKey);
    if (catMembers.length === 0) return;

    const cat = categories[catKey];

    // 카테고리 헤더
    const headerDiv = document.createElement('div');
    headerDiv.className = 'col-12';
    headerDiv.innerHTML = '<div class="category-header-custom"><span class="category-icon">' + cat.icon + '</span><h3>' + cat.title + '</h3><span class="category-count">' + catMembers.length + '명</span></div>';
    container.appendChild(headerDiv);

    catMembers.forEach((member) => {
      const memberDiv = document.createElement('div');
      memberDiv.className = 'col-12';

      const badgeClass = member.role === '청년회장' ? 'bg-primary' : (member.role === '총무' ? 'bg-info' : 'bg-secondary');
      const roleHTML = member.role !== '회원' ? '<span class="badge ' + badgeClass + ' ms-2">' + member.role + '</span>' : '';
      const companyHTML = member.company ? '<p class="mb-2"><strong>회사명:</strong> ' + member.company + '</p>' : '';
      const fieldHTML = member.field ? '<p class="mb-2"><strong>전문분야:</strong> ' + member.field + '</p>' : '';
      const fieldBadgeHTML = member.field ? '<p class="mb-2"><strong>분야:</strong> <span class="badge bg-secondary">' + member.field + '</span></p>' : '';

      // 데스크톱 레이아웃 (기존 구조)
      memberDiv.innerHTML = '<div class="row align-items-center member-row-desktop"><div class="col-md-3 col-lg-2 text-center mb-3 mb-md-0"><img class="rounded-circle img-fluid" src="assets/img/team/' + member.image + '" alt="' + member.name + '" style="max-width: 150px;" /></div><div class="col-md-9 col-lg-10"><h4 class="mb-2">' + member.name + ' ' + roleHTML + '</h4>' + companyHTML + fieldHTML + fieldBadgeHTML + '<p class="text-body-tertiary mb-0">' + member.desc + '</p></div></div><hr class="mt-4" />';

      // 모바일 컴팩트 카드
      const mobileCard = document.createElement('div');
      mobileCard.className = 'member-card-mobile';
      mobileCard.style.borderLeftColor = cat.color;
      mobileCard.innerHTML = '<img src="assets/img/team/' + member.image + '" alt="' + member.name + '"><div class="member-info"><h4>' + member.name + ' ' + (member.role !== '회원' ? '<span class="badge ' + badgeClass + '" style="font-size:0.65rem">' + member.role + '</span>' : '') + '</h4>' + (member.company ? '<p>' + member.company + '</p>' : '') + (member.field ? '<p>' + member.field + '</p>' : '') + '</div>';

      memberDiv.appendChild(mobileCard);
      container.appendChild(memberDiv);
    });
  });
}

document.addEventListener('DOMContentLoaded', renderMembers);
