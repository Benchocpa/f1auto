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
    const { id } = body ?? {};

    if (!id) {
      json(response, 400, { error: "Missing user id." });
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
      json(response, 400, { error: "You cannot delete your own account." });
      return;
    }

    if (existingUser.auth_user_id) {
      const { error: authDeleteError } = await admin.auth.admin.deleteUser(existingUser.auth_user_id);
      if (authDeleteError) {
        json(response, 400, { error: authDeleteError.message || "Unable to delete auth user." });
        return;
      }
    }

    const { error: deleteError } = await admin.from("app_users").delete().eq("id", String(id));

    if (deleteError) {
      json(response, 400, { error: deleteError.message || "Unable to delete app profile." });
      return;
    }

    json(response, 200, { success: true });
  } catch (error: any) {
    console.error("delete-user error", error);
    json(response, 500, {
      error: error?.message || "Unexpected server error.",
      stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
    });
  }
}
