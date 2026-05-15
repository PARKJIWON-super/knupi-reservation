-- Allow the app's operator mode to delete guestbook messages without opening public DELETE RLS.
-- The client calls this function only after the operator credentials are entered on the main page.

create or replace function public.delete_guestbook_message_as_admin(
  message_id bigint,
  admin_name text,
  admin_code text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if admin_name <> '운영자' or admin_code <> '12345' then
    raise exception 'Unauthorized';
  end if;

  delete from public.guestbook_messages
  where id = message_id;
end;
$$;

grant execute on function public.delete_guestbook_message_as_admin(bigint, text, text) to anon;
grant execute on function public.delete_guestbook_message_as_admin(bigint, text, text) to authenticated;