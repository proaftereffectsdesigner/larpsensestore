-- WŁĄCZ RLS NA TABELI ZAMÓWIEŃ (KONT)
-- Uruchom ten skrypt w Supabase SQL Editor (zakładka SQL)

-- 1. Włączamy Row Level Security na tabeli 'orders'
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 2. Tworzymy polisę (zasadę) bezpieczeństwa, która pozwala użytkownikom odczytywać (SELECT)
--    tylko te zamówienia, które należą do ich auth.uid()
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

-- Wskazówka: Powyższa polisa dotyczy odczytu. Aplikacja Next.js używa klucza "service_role" w ukrytych API, 
-- więc ma uprawnienia do tworzenia i modyfikacji wszystkich rekordów niezależnie od RLS,
-- co jest poprawne. Ograniczenie RLS wpłynie TYLKO na aplikację kliencką (np. Python Desktop App),
-- która łączy się jako zwykły, uwierzytelniony użytkownik.
