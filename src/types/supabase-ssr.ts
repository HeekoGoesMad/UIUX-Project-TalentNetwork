declare module "@supabase/ssr" {
  export interface CookieToSet {
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }

  export interface CookieMethodsServer {
    getAll(): { name: string; value: string }[] | Promise<{ name: string; value: string }[]>;
    setAll?(cookiesToSet: CookieToSet[]): void | Promise<void>;
  }

  export interface ServerClientOptions {
    cookies: CookieMethodsServer;
    cookieOptions?: Record<string, unknown>;
    cookieEncoding?: "raw" | "base64url";
  }

  export function createBrowserClient<Database = unknown>(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>
  ): import("@supabase/supabase-js").SupabaseClient<Database>;

  export function createServerClient<Database = unknown>(
    supabaseUrl: string,
    supabaseKey: string,
    options: ServerClientOptions
  ): import("@supabase/supabase-js").SupabaseClient<Database>;
}
