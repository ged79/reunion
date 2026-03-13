-- 회계 시스템 Supabase 테이블 생성
-- Supabase 대시보드 SQL Editor에서 실행

-- 거래 내역 (accountingData)
CREATE TABLE IF NOT EXISTS accounting_data (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE accounting_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on accounting_data" ON accounting_data FOR ALL USING (true) WITH CHECK (true);

-- 납부 데이터 (paymentData)
CREATE TABLE IF NOT EXISTS payment_data (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE payment_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on payment_data" ON payment_data FOR ALL USING (true) WITH CHECK (true);
