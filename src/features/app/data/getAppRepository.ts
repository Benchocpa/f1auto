import { localRepository } from "./localRepository";
import type { AppRepository } from "./repository";
import { supabaseRepository } from "./supabaseRepository";
import { isSupabaseConfigured } from "./supabaseClient";

export function getAppRepository(): AppRepository {
  const provider = import.meta.env.VITE_APP_DATA_PROVIDER ?? "local";

  if (provider === "supabase" && isSupabaseConfigured) {
    return supabaseRepository;
  }

  return localRepository;
}
