-- Drop existing schema if it exists to cleanly recreate it
drop table if exists public.interview_keyframes cascade;
drop type if exists keyframe_severity cascade;

-- Create an enum for the keyframe severity (optional, but useful for filtering)
create type keyframe_severity as enum ('critical', 'warning', 'positive', 'neutral');

create table public.interview_keyframes (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,       -- Links to the specific interview session
  timestamp_sec double precision not null, -- Exact time in the interview this keyframe occurred
  
  -- Visual Metrics (Polled from OpenCV/CV pipeline)
  gaze_score double precision,    -- e.g. 0.0 to 1.0
  fidget_index double precision,  -- e.g. 0.0 to 1.0
  is_visually_confident boolean,
  
  -- Audio Metrics (Polled from Librosa pipeline)
  volume_rms double precision,    -- Volume energy level
  pitch_stdev double precision,   -- Pitch stability
  pacing_wpm double precision,    -- Words per minute at this exact timestamp
  is_audibly_confident boolean,
  
  -- Combined Insights (The "Aha!" moments)
  overall_confidence_score double precision, -- Aggregated score (e.g., 0.6 * visual + 0.4 * audio)
  keyframe_reason text,           -- Why was this saved? e.g., "Candidate looked away while speaking softly"
  severity keyframe_severity default 'neutral', -- How actionable this moment is for the final dashboard
  
  -- Transcription / Context
  interviewer_question text,      -- The question asked by the AI
  associated_transcript text,     -- What the candidate was saying at this exact moment
  ai_response text,               -- The AI's evaluation or follow-up response

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Optimize queries by session and timestamp (crucial for re-playing the timeline on the frontend)
create index idx_keyframes_session on public.interview_keyframes (session_id);
create index idx_keyframes_timestamp on public.interview_keyframes (session_id, timestamp_sec);

-- Enable RLS
alter table public.interview_keyframes enable row level security;
create policy "Allow read access" on public.interview_keyframes for select using (true);
