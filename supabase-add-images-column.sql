-- board_posts 테이블에 images 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- images 컬럼 추가 (JSON 배열 타입)
ALTER TABLE board_posts
ADD COLUMN IF NOT EXISTS images JSONB;

-- 인덱스 추가 (선택사항, 성능 향상)
CREATE INDEX IF NOT EXISTS idx_board_posts_images
ON board_posts USING GIN (images);

-- 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'board_posts'
ORDER BY ordinal_position;
