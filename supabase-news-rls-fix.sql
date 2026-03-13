-- =============================================
-- News 테이블 RLS 정책 수정
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Anyone can read news" ON news;
DROP POLICY IF EXISTS "Anyone can insert news" ON news;
DROP POLICY IF EXISTS "Anyone can update news" ON news;
DROP POLICY IF EXISTS "Anyone can delete news" ON news;

DROP POLICY IF EXISTS "Anyone can read comments" ON comments;
DROP POLICY IF EXISTS "Anyone can insert comments" ON comments;
DROP POLICY IF EXISTS "Anyone can update comments" ON comments;
DROP POLICY IF EXISTS "Anyone can delete comments" ON comments;

-- RLS 활성화
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read news" ON news
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read comments" ON comments
  FOR SELECT USING (true);

-- 모든 사용자가 작성 가능
CREATE POLICY "Anyone can insert news" ON news
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert comments" ON comments
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 수정/삭제 가능 (비밀번호는 클라이언트에서 확인)
CREATE POLICY "Anyone can update news" ON news
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete news" ON news
  FOR DELETE USING (true);

CREATE POLICY "Anyone can update comments" ON comments
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete comments" ON comments
  FOR DELETE USING (true);
