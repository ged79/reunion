-- =====================================================================
-- 민통 지회 홈페이지 — 데이터베이스 스키마 (Phase 0, 단순화 버전)
-- Supabase SQL Editor에 그대로 붙여넣어 실행하세요.
-- 범위: 회원 명부(핵심) · 공지 · 행사 · 사진 · 가입신청 · (선택)회계
-- =====================================================================

-- ---------- 지회(Branches) ----------
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  region text not null,
  contact_email text,
  contact_phone text,
  description text,
  color text default '#1e40af',
  logo_url text,
  youtube_url text,
  facebook_url text,
  instagram_url text,
  created_at timestamptz default now()
);

-- ---------- 회원(Members) — 핵심 ----------
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  name text not null,
  role text default '회원',                 -- 회장/부회장/사무국장/회원 등
  category text default '청년부',            -- 소속(division). 현재 청년부, 향후 협의회 확대
  company text,
  position text,
  industry text,                            -- 업종/직업 (명부 필터 기준)
  birth_year int,
  address text,
  phone text,
  phone_public boolean default true,        -- 명부에 전화번호 공개 여부
  photo_url text,
  consent_at timestamptz,                   -- 개인정보 명부공개 동의 시각 (없으면 미동의)
  created_at timestamptz default now()
);

-- ---------- 공지(Notices) ----------
create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  title text not null,
  content text not null,
  important boolean default false,
  created_at timestamptz default now()
);

-- ---------- 행사(Events) ----------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  title text not null,
  date date not null,
  location text not null,
  description text,
  created_at timestamptz default now()
);

-- ---------- 사진(Photos) ----------
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  image_url text not null,
  caption text,
  created_at timestamptz default now()
);

-- ---------- 가입신청(Join Applications) ----------
create table if not exists join_applications (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  company text,
  industry text,
  motivation text,
  referrer text,
  status text default '대기중' check (status in ('대기중','승인','거절')),
  created_at timestamptz default now()
);

-- ---------- 회계(Transactions) — 선택, 안 쓰는 지회는 비워둠 ----------
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  date date not null,
  description text not null,
  category text,
  type text check (type in ('수입','지출')),
  amount bigint not null default 0,
  -- 잔액(balance)은 저장하지 않고 날짜순 누적으로 앱에서 자동 계산
  created_at timestamptz default now()
);

-- ---------- 지회 관리자(Branch Managers) — 관리자 인증/권한 ----------
create table if not exists branch_managers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  branch_id uuid references branches(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, branch_id)
);

-- =====================================================================
-- RLS (Row Level Security)
-- 공개 읽기 + "각 지회 관리자는 자기 지회만 수정" 원칙
-- =====================================================================
alter table branches          enable row level security;
alter table members           enable row level security;
alter table notices           enable row level security;
alter table events            enable row level security;
alter table photos            enable row level security;
alter table join_applications enable row level security;
alter table transactions      enable row level security;
alter table branch_managers   enable row level security;

-- 현재 로그인 사용자가 관리하는 지회 id 목록
create or replace function my_branch_ids()
returns setof uuid language sql security definer stable as $$
  select branch_id from branch_managers where user_id = auth.uid()
$$;

-- ---- 공개 읽기 ----
create policy "public read branches" on branches for select using (true);
create policy "public read members"  on members  for select using (true);
create policy "public read notices"  on notices  for select using (true);
create policy "public read events"   on events   for select using (true);
create policy "public read photos"   on photos   for select using (true);
create policy "public read transactions" on transactions for select using (true);

-- ---- 가입신청: 누구나 제출(insert), 관리자만 조회/수정 ----
create policy "anyone submit application" on join_applications
  for insert with check (true);
create policy "managers read applications" on join_applications
  for select using (branch_id in (select my_branch_ids()));
create policy "managers update applications" on join_applications
  for update using (branch_id in (select my_branch_ids()));

-- ---- 관리자 본인 매핑 조회 ----
create policy "managers read own mapping" on branch_managers
  for select using (user_id = auth.uid());

-- ---- 관리자: 자기 지회 콘텐츠 전체 관리(쓰기) ----
-- members
create policy "managers write members" on members
  for all using (branch_id in (select my_branch_ids()))
  with check (branch_id in (select my_branch_ids()));
-- notices
create policy "managers write notices" on notices
  for all using (branch_id in (select my_branch_ids()))
  with check (branch_id in (select my_branch_ids()));
-- events
create policy "managers write events" on events
  for all using (branch_id in (select my_branch_ids()))
  with check (branch_id in (select my_branch_ids()));
-- photos
create policy "managers write photos" on photos
  for all using (branch_id in (select my_branch_ids()))
  with check (branch_id in (select my_branch_ids()));
-- transactions
create policy "managers write transactions" on transactions
  for all using (branch_id in (select my_branch_ids()))
  with check (branch_id in (select my_branch_ids()));

-- =====================================================================
-- 시드 데이터: 영동군 지회 1개
-- (회원/공지/행사 실제 데이터는 추후 관리자 패널에서 입력)
-- =====================================================================
insert into branches (slug, name, region, contact_email, contact_phone, description, color)
values ('yeongdong', '민족통일청년회 영동군', '충청북도 영동군',
        'yeongdong@mintong.kr', '043-740-0000', '영동군 평화통일 운동의 중심', '#1e40af')
on conflict (slug) do nothing;

-- =====================================================================
-- 다음 단계 (대시보드에서 직접):
-- 1) Storage > New bucket > name: photos > Public: ON  (사진 업로드용)
-- 2) Authentication > 관리자 계정 생성 후, branch_managers 에 매핑 INSERT:
--    insert into branch_managers (user_id, branch_id)
--    values ('<auth user uuid>', (select id from branches where slug='yeongdong'));
-- =====================================================================
