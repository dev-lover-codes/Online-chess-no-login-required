-- Run this in your Supabase SQL Editor (https://app.supabase.com)
-- Dashboard → SQL Editor → New Query → Paste & Run

CREATE TABLE IF NOT EXISTS games (
  id text PRIMARY KEY,                    -- 6-char room code
  player1_id text NOT NULL,              -- host session ID
  player2_id text,                       -- guest session ID (null until joined)
  fen text NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  turn text NOT NULL DEFAULT 'white',
  status text NOT NULL DEFAULT 'waiting', -- waiting | active | finished
  winner text,                           -- white | black | draw
  p1_timer integer DEFAULT 600,          -- seconds remaining (White)
  p2_timer integer DEFAULT 600,          -- seconds remaining (Black)
  history jsonb DEFAULT '[]',            -- list of SAN move strings
  chat jsonb DEFAULT '[]',               -- list of chat message objects
  last_from text,                        -- last move source square
  last_to text,                          -- last move target square
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (allow all for now since there is no auth)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON games FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime on the games table
-- (also do this in Supabase Dashboard → Database → Replication → toggle games)
ALTER PUBLICATION supabase_realtime ADD TABLE games;
