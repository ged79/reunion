-- ============================================================================
-- 영동 지회 1회성 마이그레이션  (기존 데이터 → 신규 스키마, 같은 프로젝트 내)
-- 기존 members(27)/news(22) 는 legacy_* 로 백업 보존됩니다.
-- Supabase 대시보드 SQL Editor 에 "전체 붙여넣고" 한 번 Run 하세요.
-- (schema.sql 를 따로 실행할 필요 없음 — 이 파일에 모두 포함)
-- ============================================================================
begin;

-- 1) 기존(old) 테이블 백업용 이름 변경 -----------------------------------------
alter table if exists members rename to legacy_members;
alter table if exists news    rename to legacy_news;
alter table if exists events  rename to legacy_events;    -- 비어있음
alter table if exists gallery rename to legacy_gallery;   -- 비어있음

-- 2) 신규 스키마 -------------------------------------------------------------
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  region text not null,
  contact_email text, contact_phone text, description text,
  color text default '#1e40af',
  logo_url text, youtube_url text, facebook_url text, instagram_url text,
  created_at timestamptz default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  name text not null,
  role text default '회원',
  category text,                  -- 분류(coarse): 지도부/건설·건축/전기·설비/장비·렌탈/서비스·유통/금융/IT  (필터용)
  company text,
  position text,
  industry text,                  -- 업종/하는 일 (상세, 카드 표시용) ← 기존 field
  birth_year int,
  address text,
  phone text,
  phone_public boolean default true,
  photo_url text,
  consent_at timestamptz,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  title text not null, content text not null,
  important boolean default false,
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  title text not null, date date not null, location text not null, description text,
  created_at timestamptz default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  image_url text not null, caption text,
  created_at timestamptz default now()
);

create table if not exists join_applications (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  name text not null, phone text not null, email text,
  company text, industry text, motivation text, referrer text,
  status text default '대기중' check (status in ('대기중','승인','거절')),
  created_at timestamptz default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  date date not null, description text not null, category text,
  type text check (type in ('수입','지출')),
  amount bigint not null default 0,
  created_at timestamptz default now()
);

create table if not exists branch_managers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  branch_id uuid references branches(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, branch_id)
);

-- 3) RLS --------------------------------------------------------------------
alter table branches          enable row level security;
alter table members           enable row level security;
alter table notices           enable row level security;
alter table events            enable row level security;
alter table photos            enable row level security;
alter table join_applications enable row level security;
alter table transactions      enable row level security;
alter table branch_managers   enable row level security;

create or replace function my_branch_ids()
returns setof uuid language sql security definer stable as $$
  select branch_id from branch_managers where user_id = auth.uid()
$$;

create policy "public read branches"     on branches     for select using (true);
create policy "public read members"      on members      for select using (true);
create policy "public read notices"      on notices      for select using (true);
create policy "public read events"       on events       for select using (true);
create policy "public read photos"       on photos       for select using (true);
create policy "public read transactions" on transactions for select using (true);

create policy "anyone submit application"   on join_applications for insert with check (true);
create policy "managers read applications"  on join_applications for select using (branch_id in (select my_branch_ids()));
create policy "managers update applications" on join_applications for update using (branch_id in (select my_branch_ids()));
create policy "managers read own mapping"   on branch_managers   for select using (user_id = auth.uid());

create policy "managers write members"      on members      for all using (branch_id in (select my_branch_ids())) with check (branch_id in (select my_branch_ids()));
create policy "managers write notices"      on notices      for all using (branch_id in (select my_branch_ids())) with check (branch_id in (select my_branch_ids()));
create policy "managers write events"       on events       for all using (branch_id in (select my_branch_ids())) with check (branch_id in (select my_branch_ids()));
create policy "managers write photos"       on photos       for all using (branch_id in (select my_branch_ids())) with check (branch_id in (select my_branch_ids()));
create policy "managers write transactions" on transactions for all using (branch_id in (select my_branch_ids())) with check (branch_id in (select my_branch_ids()));

-- 4) 지회 시드 (영동) --------------------------------------------------------
insert into branches (slug, name, region, contact_email, contact_phone, description, color)
values ('yeongdong', '민족통일청년회 영동군', '충청북도 영동군',
        'yeongdong@mintong.kr', '043-740-0000', '영동군 평화통일 운동의 중심', '#1e40af')
on conflict (slug) do nothing;

-- 5) 회원 이관 (legacy_members → members) -------------------------------------
insert into members (branch_id, name, role, category, company, position, industry,
                     birth_year, address, phone, photo_url, sort_order, created_at)
select
  (select id from branches where slug='yeongdong'),
  name,
  coalesce(nullif(role,''), '회원'),
  case category
    when 'leadership'   then '지도부'
    when 'construction' then '건설/건축'
    when 'electric'     then '전기/설비'
    when 'equipment'    then '장비/렌탈'
    when 'service'      then '서비스/유통'
    when 'finance'      then '금융'
    when 'it'           then 'IT'
    else coalesce(nullif(category,''), '기타')
  end,
  nullif(company,''),
  nullif(position,''),
  nullif(field,''),
  nullif(regexp_replace(coalesce(birth,''), '\D', '', 'g'), '')::int,
  nullif(address,''),
  nullif(phone,''),
  case
    when image_url is null or image_url = '' then null
    when image_url like 'http%' then image_url
    else 'https://mintong.netlify.app/' || image_url
  end,
  coalesce(sort_order, 0),
  created_at
from legacy_members;

-- 6) 활동소식/공지(legacy_news) → 공지(notices) ------------------------------
insert into notices (branch_id, title, content, important, created_at)
select
  (select id from branches where slug='yeongdong'),
  title,
  content,
  false,
  created_at
from legacy_news;

commit;

-- ============================================================================
-- 실행 후 확인:  select count(*) from members;   -- 27 이어야 함
--               select count(*) from notices;   -- 22 이어야 함
-- 백업은 legacy_members / legacy_news 에 그대로 남아있습니다.
-- 문제 없으면 나중에:  drop table legacy_members, legacy_news, legacy_events, legacy_gallery;
-- ============================================================================
