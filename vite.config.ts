import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import createUserHandler from "./api/admin/create-user";
import updateUserHandler from "./api/admin/update-user";
import deleteUserHandler from "./api/admin/delete-user";
import toggleUserBlockHandler from "./api/admin/toggle-user-block";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  process.env.SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  process.env.SUPABASE_ANON_KEY =
    env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    plugins: [
      react(),
      {
        name: "local-api-routes",
        configureServer(server) {
          const routes = [
            ["/api/admin/create-user", createUserHandler],
            ["/api/admin/update-user", updateUserHandler],
            ["/api/admin/delete-user", deleteUserHandler],
            ["/api/admin/toggle-user-block", toggleUserBlockHandler],
          ] as const;

          routes.forEach(([path, handler]) => {
            server.middlewares.use(path, async (req, res) => {
              await handler(req, res);
            });
          });
        },
      },
    ],
  };
});
