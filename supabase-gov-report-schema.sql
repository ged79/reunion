-- 군정보고 테이블 생성
-- Supabase SQL Editor에서 실행하세요

-- 1. gov_reports 테이블 생성
CREATE TABLE IF NOT EXISTS gov_reports (
    id BIGSERIAL PRIMARY KEY,
    report_type VARCHAR(50) DEFAULT 'other',  -- policy, meeting, briefing, other
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    event_date DATE,
    location VARCHAR(200),
    author_name VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    images JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. gov_report_comments 테이블 생성
CREATE TABLE IF NOT EXISTS gov_report_comments (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT REFERENCES gov_reports(id) ON DELETE CASCADE,
    author_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE gov_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE gov_report_comments ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성 - 모든 사용자가 읽기/쓰기 가능
CREATE POLICY "Allow all operations on gov_reports" ON gov_reports
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on gov_report_comments" ON gov_report_comments
    FOR ALL USING (true) WITH CHECK (true);

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_gov_reports_created_at ON gov_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gov_reports_report_type ON gov_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_gov_report_comments_report_id ON gov_report_comments(report_id);

-- 완료 메시지
SELECT '군정보고 테이블 생성 완료!' as message;
