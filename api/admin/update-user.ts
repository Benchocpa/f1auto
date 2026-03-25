import { json, parseBody, requireAdmin } from "./_shared.js";

export default async function handler(request: any, response: any) {
  if (request.method !== "POST") {
    json(response, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const context = await requireAdmin(request, response);
    if (!context) return;

    const { admin, adminProfile } = context;
    const body = await parseBody(request);
    const { id, email, fullName, employeeCode, store, jobTitle, role, password } = body ?? {};

    if (!id || !email || !fullName || !employeeCode || !store || !jobTitle || !role) {
      json(response, 400, { error: "Missing required fields." });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedEmployeeCode = String(employeeCode).trim().toUpperCase();
    const normalizedPassword = typeof password === "string" ? password.trim() : "";

    let { data: existingUser, error: existingUserError } = await admin
      .from("app_users")
      .select("*")
      .eq("id", String(id))
      .maybeSingle();

    if (existingUserError) {
      json(response, 404, { error: "User not found." });
      return;
    }

    if (!existingUser) {
      const { data: fallbackUser, error: fallbackUserError } = await admin
        .from("app_users")
        .select("*")
        .or(`auth_user_id.eq.${adminProfile.auth_user_id},email.eq.${normalizedEmail}`)
        .maybeSingle();

      if (fallbackUserError || !fallbackUser) {
        json(response, 404, { error: "User not found." });
        return;
      }

      existingUser = fallbackUser;
    }

    if (adminProfile.id === existingUser.id && String(role) !== "admin") {
      json(response, 400, { error: "You cannot remove your own administrator role." });
      return;
    }

    if (normalizedPassword && normalizedPassword.length < 8) {
      json(response, 400, { error: "The new password must be at least 8 characters." });
      return;
    }

    if (existingUser.auth_user_id) {
      const { error: authUpdateError } = await admin.auth.admin.updateUserById(
        existingUser.auth_user_id,
        {
          email: normalizedEmail,
          email_confirm: true,
          password: normalizedPassword || undefined,
          user_metadata: {
            fullName: String(fullName).trim(),
            role: String(role),
            store: String(store),
          },
        }
      );

      if (authUpdateError) {
        json(response, 400, { error: authUpdateError.message || "Unable to update auth user." });
        return;
      }
    }

    const appUser = {
      full_name: String(fullName).trim(),
      email: normalizedEmail,
      employee_code: normalizedEmployeeCode,
      store: String(store),
      job_title: String(jobTitle).trim(),
      role: String(role),
    };

    const { error: updateError } = await admin.from("app_users").update(appUser).eq("id", String(id));

    if (updateError) {
      json(response, 400, { error: updateError.message || "Unable to update app profile." });
      return;
    }

    json(response, 200, {
      user: {
        id: existingUser.id,
        authUserId: existingUser.auth_user_id,
        fullName: appUser.full_name,
        email: appUser.email,
        employeeCode: appUser.employee_code,
        store: appUser.store,
        jobTitle: appUser.job_title,
        role: appUser.role,
        isBlocked: existingUser.is_blocked ?? false,
        blockedAt: existingUser.blocked_at ?? null,
        createdAt: existingUser.created_at,
      },
    });
  } catch (error: any) {
    console.error("update-user error", error);
    json(response, 500, {
      error: error?.message || "Unexpected server error.",
      stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
    });
  }
}
