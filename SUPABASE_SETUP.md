# Instrukcje Konfiguracji Supabase

Aby podłączyć backend i zapisywać zamówienia w bazie danych, wykonaj następujące kroki:

## 1. Konfiguracja bazy danych (SQL)

W panelu swojego projektu Supabase przejdź do zakładki **SQL Editor** i wykonaj poniższe zapytanie, które wygeneruje potrzebne tabele:

```sql
-- Tabela do przetrzymywania profili użytkowników (rozszerzenie autoryzacji Supabase)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  is_admin boolean default false,
  is_banned boolean default false,
  banned_at timestamp with time zone,
  can_topup boolean default true,
  can_purchase boolean default true,
  can_update_profile boolean default true,
  ban_reason text,
  ban_type text default 'manual',
  ban_expires_at timestamp with time zone,
  ban_acknowledged boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela zamówień
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  product_type text not null,
  quantity integer not null default 1,
  total_price numeric not null,
  status text not null default 'pending', -- 'pending', 'completed', 'failed'
  account_details text, -- Zwrócone dane konta (login:hasło) z API NFA
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Zabezpieczenia RLS (Row Level Security) - użytkownicy widzą tylko własne zamówienia
alter table public.orders enable row level security;
create policy "Users can view their own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can insert their own orders" on public.orders for insert with check (auth.uid() = user_id);

-- --- NOWE DODATKI (Bezpieczeństwo) ---

-- 1. Dodaj kolumnę recovery_email do profili
alter table public.profiles add column if not exists recovery_email text;

-- 2. Tabela aktywności logowania (Login Activity & Active Sessions)
create table public.login_activity (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  ip_address text,
  location text,
  user_agent text,
  action text default 'login', -- 'login' lub 'logout'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS dla historii logowania
alter table public.login_activity enable row level security;
create policy "Users can view their own login activity" on public.login_activity for select using (auth.uid() = user_id);
create policy "Users can insert their own login activity" on public.login_activity for insert with check (auth.uid() = user_id);
create policy "Users can delete their own login activity" on public.login_activity for delete using (auth.uid() = user_id);

-- 3. Tabela do analityki ruchu (Page Views)
create table public.page_views (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,
  path text not null,
  user_agent text,
  device_type text, -- 'Desktop', 'Mobile', 'Tablet'
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela do analityki ruchu może być wstawiana przez anonów (middleware)
alter table public.page_views enable row level security;
create policy "Anyone can insert page views" on public.page_views for insert with check (true);
create policy "Admins can view page views" on public.page_views for select using (
  exists (
    select 1 from public.profiles where profiles.id = auth.uid() and is_admin = true
  )
);

-- 4. Tabela do śledzenia koszyków (Cart Abandonment)
create table public.checkout_sessions (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,
  user_id uuid references public.profiles(id),
  product_type text not null,
  status text default 'started', -- 'started', 'completed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.checkout_sessions enable row level security;
create policy "Anyone can insert checkout sessions" on public.checkout_sessions for insert with check (true);
create policy "Users can update their own checkout sessions" on public.checkout_sessions for update using (auth.uid() = user_id);
create policy "Admins can view checkout sessions" on public.checkout_sessions for select using (
  exists (
    select 1 from public.profiles where profiles.id = auth.uid() and is_admin = true
  )
);
```

## 2. Podpięcie środowiska (Zmienne .env)

Utwórz w głównym folderze projektu plik `.env.local` i wklej do niego swoje dane dostępowe do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=twoj_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=twoj_anon_key_supabase
NFA_API_KEY=your_nfa_api_key_here_rotate_immediately
```

Url oraz anon key znajdziesz w panelu Supabase w: **Project Settings -> API**.

## 3. Uruchomienie projektu

Mając skonfigurowane zmienne, uruchom projekt komendą:

```bash
npm run dev
```

Przejdź na adres `http://localhost:3000` i wypróbuj testowy zakup kont! (Konta zakupione testowym kluczem NFA nic Cię nie kosztują, a API zwróci przykładowe zmyślone dane do celów weryfikacji integracji).
