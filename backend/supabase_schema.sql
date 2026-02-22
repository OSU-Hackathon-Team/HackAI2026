-- Create an enum for the keyframe severity
create type keyframe_severity as enum ('critical', 'warning', 'positive', 'neutral');

create table public.interview_sessions (
  id text primary key,            -- session-xxxx
  user_id text,                   -- Clerk user id (optional if guest)
  role text,
  company text,
  date text,
  duration text default '10:00',
  score integer default 0,
  gaze integer default 0,
  confidence integer default 0,
  composure integer default 0,
  spikes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.interview_reports (
  session_id text primary key references public.interview_sessions(id) on delete cascade,
  report_markdown text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.interview_keyframes (
  id uuid default gen_random_uuid() primary key,
  session_id text not null references public.interview_sessions(id) on delete cascade,
  timestamp_sec double precision not null,
  
  -- Visual Metrics
  gaze_score double precision,
  fidget_index double precision,
  is_visually_confident boolean,
  
  -- Audio Metrics
  volume_rms double precision,
  pitch_stdev double precision,
  pacing_wpm double precision,
  is_audibly_confident boolean,
  
  -- Combined Insights
  overall_confidence_score double precision,
  keyframe_reason text,
  severity keyframe_severity default 'neutral',
  
  -- Transcription / Context
  interviewer_question text,
  associated_transcript text,
  ai_response text,
  filler_words_count integer default 0,
  sentiment_score double precision default 0.5,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Optimize queries by session and timestamp
create index idx_keyframes_session on public.interview_keyframes (session_id);
create index idx_keyframes_timestamp on public.interview_keyframes (session_id, timestamp_sec);

-- Enable RLS (simplified for now)
alter table public.interview_sessions enable row level security;
alter table public.interview_reports enable row level security;
alter table public.interview_keyframes enable row level security;

create policy "Allow all access sessions" on public.interview_sessions for all using (true);
create policy "Allow all access reports" on public.interview_reports for all using (true);
create policy "Allow all access keyframes" on public.interview_keyframes for all using (true);
