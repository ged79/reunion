-- =============================================
-- 행사 참석자 테이블 스키마
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 참석자 테이블 생성
CREATE TABLE IF NOT EXISTS event_participants (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  member_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 중복 방지: 같은 행사에 같은 회원은 한 번만 참석 가능
  UNIQUE(event_id, member_name)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_member_name ON event_participants(member_name);

-- RLS 활성화
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read event_participants" ON event_participants
  FOR SELECT USING (true);

-- 모든 사용자가 참석 등록 가능
CREATE POLICY "Anyone can insert event_participants" ON event_participants
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 참석 취소 가능
CREATE POLICY "Anyone can delete event_participants" ON event_participants
  FOR DELETE USING (true);
