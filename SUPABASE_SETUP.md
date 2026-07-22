# Instrukcje Konfiguracji Supabase

Aby podłączyć backend i zapisywać zamówienia w bazie danych, wykonaj następujące kroki:

## 1. Konfiguracja bazy danych (SQL)

W panelu swojego projektu Supabase przejdź do zakładki **SQL Editor** i wykonaj poniższe zapytanie, które wygeneruje potrzebne tabele:

```sql
-- Tabela do przetrzymywania profili użytkowników (rozszerzenie autoryzacji Supabase)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
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
```

## 2. Podpięcie środowiska (Zmienne .env)

Utwórz w głównym folderze projektu plik `.env.local` i wklej do niego swoje dane dostępowe do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=twoj_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=twoj_anon_key_supabase
NFA_API_KEY=rsk_test_uMKWV_LizLQdCUkG-ht7V7Bq8gr2zbe6bhEpE8DSs8M
```

Url oraz anon key znajdziesz w panelu Supabase w: **Project Settings -> API**.

## 3. Uruchomienie projektu

Mając skonfigurowane zmienne, uruchom projekt komendą:

```bash
npm run dev
```

Przejdź na adres `http://localhost:3000` i wypróbuj testowy zakup kont! (Konta zakupione testowym kluczem NFA nic Cię nie kosztują, a API zwróci przykładowe zmyślone dane do celów weryfikacji integracji).
