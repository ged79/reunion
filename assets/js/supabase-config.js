// Supabase 설정
const SUPABASE_URL = 'https://qcepxveeuscqvsuhbqyd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZXB4dmVldXNjcXZzdWhicXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzkzNTgsImV4cCI6MjA3OTAxNTM1OH0.QV9Z9Wc6W9dbxYF5EZq7isIOQC7CBEQ3KLXmqFNh3Ro';

// Supabase 클라이언트 초기화
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
