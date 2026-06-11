-- =====================================================================
-- 보안 잠금 (Phase 2 — 1단계)  2026-06-11
-- Supabase 대시보드 > SQL Editor 에 전체 붙여넣고 Run 하세요.
--
-- 적용 효과:
--   1) 회원 명부(members): 로그인한 회원만 조회 가능 (현재는 누구나 조회 가능!)
--   2) 모든 쓰기(등록/수정/삭제): 관리자 계정만 가능 (현재는 키만 알면 누구나!)
--   3) 회계(accounting_data): 로그인한 회원만 조회
--   4) 사진 저장소(events 버킷): 업로드/삭제는 관리자만
--   5) 공지/행사(news)·사진 목록(event_photos)의 "읽기"는 공개 유지
--
-- 전제: Auth 계정이 이미 생성되어 있어야 함 (회원 26명 + 관리자 1명 — 완료됨)
-- =====================================================================

-- 관리자 판별: JWT의 app_metadata.role 이 'admin'인 계정
create or replace function is_admin() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

-- ---------------------------------------------------------------------
-- 0) 기존의 느슨한 정책 전부 제거 (깨끗한 상태에서 다시 정의)
-- ---------------------------------------------------------------------
do $$
declare p record;
begin
  for p in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('members', 'news', 'event_photos', 'accounting_data')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
  -- storage.objects 의 기존 정책도 제거 (events 버킷용 새 정책으로 대체)
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
  loop
    execute format('drop policy if exists %I on storage.objects', p.policyname);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 1) 회원 명부 — 로그인 회원만 읽기, 관리자만 쓰기
-- ---------------------------------------------------------------------
alter table members enable row level security;

create policy "members_read_authenticated" on members
  for select to authenticated using (true);

create policy "members_write_admin" on members
  for all to authenticated using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- 2) 공지/행사(news) — 공개 읽기(게시된 글만), 관리자만 쓰기
-- ---------------------------------------------------------------------
alter table news enable row level security;

create policy "news_read_published" on news
  for select using (is_published = true);

create policy "news_admin_all" on news
  for all to authenticated using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- 3) 행사 사진(event_photos) — 공개 읽기, 관리자만 쓰기
-- ---------------------------------------------------------------------
alter table event_photos enable row level security;

create policy "photos_read_public" on event_photos
  for select using (true);

create policy "photos_write_admin" on event_photos
  for all to authenticated using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- 4) 회계(accounting_data) — 로그인 회원만 읽기, 관리자만 쓰기
-- ---------------------------------------------------------------------
alter table accounting_data enable row level security;

create policy "accounting_read_authenticated" on accounting_data
  for select to authenticated using (true);

create policy "accounting_write_admin" on accounting_data
  for all to authenticated using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- 5) 저장소(events 버킷) — 공개 읽기, 관리자만 업로드/삭제
-- ---------------------------------------------------------------------
create policy "storage_read_public" on storage.objects
  for select using (bucket_id = 'events');

create policy "storage_insert_admin" on storage.objects
  for insert to authenticated with check (bucket_id = 'events' and is_admin());

create policy "storage_update_admin" on storage.objects
  for update to authenticated using (bucket_id = 'events' and is_admin());

create policy "storage_delete_admin" on storage.objects
  for delete to authenticated using (bucket_id = 'events' and is_admin());

-- =====================================================================
-- 실행 후 확인 방법:
--   1) 로그아웃(시크릿창) 상태에서 /yeongdong/members → 명부 안 보여야 정상
--   2) 회원 로그인 후 명부 보이면 정상
--   3) 관리자 로그인 후 행사 등록되면 정상
-- 주의: 이 파일 실행 전까지는 기존처럼 열려 있음 (코드만으론 DB가 잠기지 않음)
-- =====================================================================
