import { createClient } from "@supabase/supabase-js";

export async function parseBody(request: any) {
  if (request.body) return request.body;

  const chunks: Uint8Array[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (!chunks.length) return {};

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function json(response: any, status: number, body: unknown) {
  if (typeof response.status === "function") {
    response.status(status).setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(body));
    return;
  }

  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}

function getClients() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return {
    admin: createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
    auth: createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
  };
}

export async function requireAdmin(request: any, response: any) {
  const authHeader = request.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    json(response, 401, { error: "Missing bearer token." });
    return null;
  }

  const { admin, auth } = getClients();
  const {
    data: { user: requester },
    error: requesterError,
  } = await auth.auth.getUser(token);

  if (requesterError || !requester) {
    json(response, 401, { error: "Invalid auth token." });
    return null;
  }

  const { data: adminProfile, error: adminProfileError } = await admin
    .from("app_users")
    .select("id, role, email, auth_user_id, employee_code")
    .or(`auth_user_id.eq.${requester.id},email.eq.${requester.email}`)
    .maybeSingle();

  if (adminProfileError || !adminProfile || adminProfile.role !== "admin") {
    json(response, 403, { error: "Only administrators can manage users." });
    return null;
  }

  return { admin, auth, requester, adminProfile };
}
