-- =============================================
-- 회원 게시판 테이블 스키마
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 게시글 테이블
CREATE TABLE IF NOT EXISTS board_posts (
  id BIGSERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL DEFAULT 'etc',
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  author_img VARCHAR(255),
  password VARCHAR(255) NOT NULL,
  views INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 댓글 테이블
CREATE TABLE IF NOT EXISTS board_comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  author_name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_board_posts_category ON board_posts(category);
CREATE INDEX IF NOT EXISTS idx_board_posts_created_at ON board_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_comments_post_id ON board_comments(post_id);

-- RLS (Row Level Security) 정책
ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_comments ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read posts" ON board_posts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read comments" ON board_comments
  FOR SELECT USING (true);

-- 모든 사용자가 작성 가능
CREATE POLICY "Anyone can insert posts" ON board_posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert comments" ON board_comments
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 수정/삭제 가능 (비밀번호는 클라이언트에서 확인)
CREATE POLICY "Anyone can update posts" ON board_posts
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete posts" ON board_posts
  FOR DELETE USING (true);

-- 샘플 데이터 (선택사항)
INSERT INTO board_posts (category, title, content, author_name, author_img, password, views, comments) VALUES
('request', '인테리어 업체 추천해주세요', '사무실 리모델링을 계획하고 있는데, 회원분들 중에 인테리어 전문가 계신가요?

믿을 수 있는 분께 맡기고 싶습니다.

예산은 대략 3000만원 정도 생각하고 있고, 면적은 약 30평입니다.

연락 부탁드립니다!', '한성욱', 'assets/img/team/6.jpg', '1234', 24, 2),

('info', '2025년 건설업 동향 정보 공유', '올해 건설업계 전망과 주요 정책 변화에 대해 정리했습니다.

1. 주택 공급 확대 정책
2. 건설 안전 규제 강화
3. 친환경 건축 의무화

관심 있으신 분들 참고하세요.', '김종원', 'assets/img/team/0.jpg', '1234', 45, 0),

('share', '사무용 가구 나눔합니다', '사무실 이전으로 책상 2개, 의자 4개 나눔합니다.

필요하신 분 연락주세요.
직접 수거 가능하신 분만요.

위치: 영동읍', '이경환', 'assets/img/team/4.jpg', '1234', 18, 0),

('etc', '다음 모임 일정 문의', '다음 정기 모임이 언제인지 아시는 분 계신가요?

일정 조율이 필요해서요.', '박성현', 'assets/img/team/7.jpg', '1234', 32, 0);

-- 샘플 댓글
INSERT INTO board_comments (post_id, author_name, content) VALUES
(1, '조훈희', '저희 회사에서 인테리어 하고 있습니다. 연락주세요!'),
(1, '김종원', '조훈희 회원님 추천드립니다. 실력 좋으세요.');
