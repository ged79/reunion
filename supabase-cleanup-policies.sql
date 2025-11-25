-- =============================================
-- RLS 정책 정리 및 재설정
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- NEWS 테이블: 모든 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can delete news" ON news;
DROP POLICY IF EXISTS "Anyone can insert news" ON news;
DROP POLICY IF EXISTS "Anyone can read all news" ON news;
DROP POLICY IF EXISTS "Anyone can read news" ON news;
DROP POLICY IF EXISTS "Anyone can read published news" ON news;
DROP POLICY IF EXISTS "Anyone can update news" ON news;
DROP POLICY IF EXISTS "Authenticated users can insert news" ON news;
DROP POLICY IF EXISTS "Authors can delete own news" ON news;
DROP POLICY IF EXISTS "Authors can update own news" ON news;

-- COMMENTS 테이블: 중복 정책 삭제
DROP POLICY IF EXISTS "Authors can delete own comments" ON comments;
DROP POLICY IF EXISTS "Authors can update own comments" ON comments;

-- 간단하고 명확한 정책 재설정
-- NEWS 테이블
CREATE POLICY "Enable read access for all users" ON news
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON news
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON news
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON news
  FOR DELETE USING (true);

-- COMMENTS 테이블
CREATE POLICY "Enable read access for all users" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON comments
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON comments
  FOR DELETE USING (true);

-- 정책 확인
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('news', 'comments', 'board_posts')
ORDER BY tablename, policyname;
