import { createClient } from "@supabase/supabase-js";

const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // Sync auth state to cookies so middleware can access it
      storage: isBrowser ? {
        getItem: (key) => {
          const value = window.localStorage.getItem(key);
          if (value) {
            try {
              const parsed = JSON.parse(value);
              if (parsed.access_token) {
                document.cookie = `${key}=${parsed.access_token}; path=/; max-age=31536000; SameSite=Lax; Secure`;
              }
            } catch (e) {
              // Ignore
            }
          }
          return value;
        },
        setItem: (key, value) => {
          window.localStorage.setItem(key, value);
          try {
            const parsed = JSON.parse(value);
            if (parsed.access_token) {
              document.cookie = `${key}=${parsed.access_token}; path=/; max-age=31536000; SameSite=Lax; Secure`;
            }
          } catch (e) {
            // Ignore
          }
        },
        removeItem: (key) => {
          window.localStorage.removeItem(key);
          document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      } : undefined
    }
  }
);

