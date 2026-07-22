-- Tworzy tabele profiles jezeli nie istnieje
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Próbuje dodać kolumnę 'balance', na wypadek gdyby tabela profiles istniała już wcześniej bez tej kolumny.
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'balance') then
    alter table public.profiles add column balance numeric(10,2) default 0.00 not null;
  end if;
end $$;

-- Zabezpieczenia (Row Level Security)
alter table public.profiles enable row level security;

-- Użytkownik widzi tylko swój profil
create policy "Users can view own profile." on public.profiles
  for select using (auth.uid() = id);

-- Tymczasowo pozwalamy użytkownikom aktualizować swój profil na rzecz testów TopUp
create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);
  
create policy "Users can insert own profile." on public.profiles
  for insert with check (auth.uid() = id);

-- Funkcja przypisująca profil od razu po rejestracji
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, balance)
  values (new.id, 0.00);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger wywolujacy funkcje
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Wypelnienie profili dla kont, ktore juz istnieja a nie mialy profilu (np. twoje wczesniejsze testowe)
insert into public.profiles (id, balance)
select id, 0.00 from auth.users
where not exists (
  select 1 from public.profiles where public.profiles.id = auth.users.id
);
