-- ============================================
-- 회원 테이블 (members)
-- ============================================

-- 기존 테이블이 있으면 삭제 후 재생성
DROP TABLE IF EXISTS members;

CREATE TABLE members (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  role VARCHAR(20) DEFAULT '회원',
  company VARCHAR(100),
  field VARCHAR(50),
  phone VARCHAR(20),
  position VARCHAR(50),
  birth VARCHAR(10),
  address VARCHAR(200),
  title VARCHAR(200),
  category VARCHAR(20) NOT NULL DEFAULT 'service',
  image_url VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 모든 작업 허용 (기존 패턴과 동일)
CREATE POLICY "Allow all operations on members" ON members
  FOR ALL USING (true) WITH CHECK (true);
