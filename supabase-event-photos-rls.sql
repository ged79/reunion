-- =============================================
-- Event Photos 테이블 RLS 정책
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Anyone can read event_photos" ON event_photos;
DROP POLICY IF EXISTS "Anyone can insert event_photos" ON event_photos;
DROP POLICY IF EXISTS "Anyone can update event_photos" ON event_photos;
DROP POLICY IF EXISTS "Anyone can delete event_photos" ON event_photos;

-- RLS 활성화
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read event_photos" ON event_photos
  FOR SELECT USING (true);

-- 모든 사용자가 작성 가능
CREATE POLICY "Anyone can insert event_photos" ON event_photos
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 수정/삭제 가능
CREATE POLICY "Anyone can update event_photos" ON event_photos
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete event_photos" ON event_photos
  FOR DELETE USING (true);
