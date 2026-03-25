import { json, parseBody, requireAdmin } from "./_shared.js";

export default async function handler(request: any, response: any) {
  if (request.method !== "POST") {
    json(response, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const context = await requireAdmin(request, response);
    if (!context) return;

    const { admin } = context;

    const body = await parseBody(request);

    const {
      email,
      password,
      fullName,
      employeeCode,
      store,
      jobTitle,
      role,
    } = body ?? {};

    if (!email || !password || !fullName || !employeeCode || !store || !jobTitle || !role) {
      json(response, 400, { error: "Missing required fields." });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedEmployeeCode = String(employeeCode).trim().toUpperCase();

    const { data: createdAuthData, error: createAuthError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: String(password),
      email_confirm: true,
      user_metadata: {
        fullName: String(fullName).trim(),
        role: String(role),
        store: String(store),
      },
    });

    if (createAuthError || !createdAuthData.user) {
      json(response, 400, {
        error: createAuthError?.message || "Unable to create auth user.",
      });
      return;
    }

    const appUser = {
      id: crypto.randomUUID(),
      auth_user_id: createdAuthData.user.id,
      full_name: String(fullName).trim(),
      email: normalizedEmail,
      employee_code: normalizedEmployeeCode,
      store: String(store),
      job_title: String(jobTitle).trim(),
      role: String(role),
      is_blocked: false,
      blocked_at: null,
      created_at: new Date().toISOString(),
    };

    const { error: profileError } = await admin.from("app_users").insert(appUser);

    if (profileError) {
      await admin.auth.admin.deleteUser(createdAuthData.user.id);
      json(response, 400, {
        error: profileError.message || "Unable to create app profile.",
      });
      return;
    }

    json(response, 200, {
      user: {
        id: appUser.id,
        authUserId: appUser.auth_user_id,
        fullName: appUser.full_name,
        email: appUser.email,
        employeeCode: appUser.employee_code,
        store: appUser.store,
        jobTitle: appUser.job_title,
        role: appUser.role,
        isBlocked: appUser.is_blocked,
        blockedAt: appUser.blocked_at,
        createdAt: appUser.created_at,
      },
    });
  } catch (error: any) {
    console.error("create-user error", error);
    json(response, 500, {
      error: error?.message || "Unexpected server error.",
      stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
    });
  }
}
