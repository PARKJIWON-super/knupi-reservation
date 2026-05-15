-- Create a public guestbook table for short chat-like messages.

create table if not exists public.guestbook_messages (
  id bigserial primary key,
  nickname text not null check (char_length(trim(nickname)) between 1 and 20),
  message text not null check (char_length(trim(message)) between 1 and 300),
  created_at timestamptz not null default now()
);

alter table public.guestbook_messages enable row level security;

create policy "Anyone can read guestbook messages"
  on public.guestbook_messages
  for select
  using (true);

create policy "Anyone can write guestbook messages"
  on public.guestbook_messages
  for insert
  with check (true);

create index if not exists guestbook_messages_created_at_idx
  on public.guestbook_messages (created_at);