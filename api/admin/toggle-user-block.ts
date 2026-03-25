import { json, parseBody, requireAdmin } from "./_shared";

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
    const { id, block } = body ?? {};

    if (!id || typeof block !== "boolean") {
      json(response, 400, { error: "Missing user block payload." });
      return;
    }

    const { data: existingUser, error: existingUserError } = await admin
      .from("app_users")
      .select("*")
      .eq("id", String(id))
      .maybeSingle();

    if (existingUserError || !existingUser) {
      json(response, 404, { error: "User not found." });
      return;
    }

    if (adminProfile.id === existingUser.id) {
      json(response, 400, { error: "You cannot block your own account." });
      return;
    }

    const blockedAt = block ? new Date().toISOString() : null;
    const { error: updateError } = await admin
      .from("app_users")
      .update({ is_blocked: block, blocked_at: blockedAt })
      .eq("id", String(id));

    if (updateError) {
      json(response, 400, { error: updateError.message || "Unable to update block status." });
      return;
    }

    json(response, 200, {
      user: {
        id: existingUser.id,
        authUserId: existingUser.auth_user_id,
        fullName: existingUser.full_name,
        email: existingUser.email,
        employeeCode: existingUser.employee_code,
        store: existingUser.store,
        jobTitle: existingUser.job_title,
        role: existingUser.role,
        isBlocked: block,
        blockedAt,
        createdAt: existingUser.created_at,
      },
    });
  } catch (error: any) {
    console.error("toggle-user-block error", error);
    json(response, 500, {
      error: error?.message || "Unexpected server error.",
      stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
    });
  }
}
