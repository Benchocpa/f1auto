import { LogIn, Shield, Users, Clock3, CarFront } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import type { LoginFormState, PasswordResetFormState, Translate, UserEntry } from "../types";
import { LocationBrand, StatCard, Field } from "./common";

interface LoginScreenProps {
  configuredLocationLabel: string;
  configuredLocationLogoKey: string;
  configuredLocationSubtitle: string;
  feedback: string | null;
  isPasswordRecoveryMode: boolean;
  isPasswordResetRequestMode: boolean;
  isSupabaseAuthEnabled: boolean;
  loginForm: LoginFormState;
  onForgotPasswordClick: () => void;
  onLoginSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onLoginFormChange: React.Dispatch<React.SetStateAction<LoginFormState>>;
  onOpenTimeControl: () => void;
  onPasswordRecoveryCancel: () => void;
  onPasswordRecoverySubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onPasswordResetFormChange: React.Dispatch<React.SetStateAction<PasswordResetFormState>>;
  onPasswordResetRequestSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  passwordResetForm: PasswordResetFormState;
  t: Translate;
  totalOpenShifts: number;
  totalVehicles: number;
  users: UserEntry[];
}

export function LoginScreen({
  configuredLocationLabel,
  configuredLocationLogoKey,
  configuredLocationSubtitle,
  feedback,
  isPasswordRecoveryMode,
  isPasswordResetRequestMode,
  isSupabaseAuthEnabled,
  loginForm,
  onForgotPasswordClick,
  onLoginSubmit,
  onLoginFormChange,
  onOpenTimeControl,
  onPasswordRecoveryCancel,
  onPasswordRecoverySubmit,
  onPasswordResetFormChange,
  onPasswordResetRequestSubmit,
  passwordResetForm,
  t,
  totalOpenShifts,
  totalVehicles,
  users,
}: LoginScreenProps) {
  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="hero-panel">
            <div className="space-y-5">
              <LocationBrand
                title={configuredLocationLabel}
                subtitle={configuredLocationSubtitle}
                logoKey={configuredLocationLogoKey}
              />
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-stone-200">
                <Shield className="h-4 w-4" />
                {t("Secure access", "Acceso seguro")}
              </div>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {t("Sign in to continue.", "Inicia sesion para continuar.")}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300 sm:text-base">
                  {t(
                    "Users can access vehicles and time control. Only administrators can enter the admin module.",
                    "Los usuarios pueden entrar a vehiculos y control de tiempo. Solo los administradores pueden entrar al modulo admin."
                  )}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard
                  icon={<CarFront className="h-5 w-5" />}
                  label={t("Vehicle intake", "Ingreso de vehiculos")}
                  value={String(totalVehicles)}
                  detail={t("Operational access", "Acceso operativo")}
                />
                <StatCard
                  icon={<Clock3 className="h-5 w-5" />}
                  label={t("Time control", "Control de tiempo")}
                  value={String(totalOpenShifts)}
                  detail={t("Open shifts", "Turnos abiertos")}
                />
                <StatCard
                  icon={<Users className="h-5 w-5" />}
                  label={t("Users", "Usuarios")}
                  value={String(users.length)}
                  detail={t("Registered accounts", "Cuentas registradas")}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-12 rounded-2xl px-5 text-sm sm:h-14 sm:px-6 sm:text-base"
                  onClick={onOpenTimeControl}
                >
                  <Clock3 className="mr-2 h-4 w-4" />
                  {t("Open time control", "Abrir control de tiempo")}
                </Button>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">{t("Access", "Acceso")}</p>
                <h2 className="panel-title">{t("User login", "Ingreso de usuario")}</h2>
              </div>
              <Badge variant="secondary">{t("English default", "Ingles por defecto")}</Badge>
            </div>

            {feedback ? (
              <div className="mb-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {feedback}
              </div>
            ) : null}

            {isPasswordRecoveryMode ? (
              <form className="grid gap-4" onSubmit={onPasswordRecoverySubmit}>
                <Field label={t("New password", "Nueva contrasena")}>
                  <Input
                    type="password"
                    value={passwordResetForm.password}
                    onChange={(event) =>
                      onPasswordResetFormChange((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    autoComplete="new-password"
                    placeholder={t("Minimum 8 characters", "Minimo 8 caracteres")}
                    required
                  />
                </Field>

                <Field label={t("Confirm password", "Confirmar contrasena")}>
                  <Input
                    type="password"
                    value={passwordResetForm.confirmPassword}
                    onChange={(event) =>
                      onPasswordResetFormChange((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                    autoComplete="new-password"
                    placeholder={t("Repeat the new password", "Repite la nueva contrasena")}
                    required
                  />
                </Field>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit">{t("Update password", "Actualizar contrasena")}</Button>
                  <Button type="button" variant="secondary" onClick={onPasswordRecoveryCancel}>
                    {t("Back to sign in", "Volver al ingreso")}
                  </Button>
                </div>
              </form>
            ) : isPasswordResetRequestMode ? (
              <form className="grid gap-4" onSubmit={onPasswordResetRequestSubmit}>
                <Field label={t("Email", "Correo")}>
                  <Input
                    type="email"
                    value={passwordResetForm.email}
                    onChange={(event) =>
                      onPasswordResetFormChange((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    autoComplete="email"
                    placeholder="admin@example.com"
                    required
                  />
                </Field>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit">{t("Send recovery link", "Enviar enlace de recuperacion")}</Button>
                  <Button type="button" variant="secondary" onClick={onPasswordRecoveryCancel}>
                    {t("Back to sign in", "Volver al ingreso")}
                  </Button>
                </div>
              </form>
            ) : (
              <form className="grid gap-4" onSubmit={onLoginSubmit}>
                <Field label={t("Email", "Correo")}>
                  <Input
                    type="email"
                    value={loginForm.email}
                    onChange={(event) =>
                      onLoginFormChange((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    autoComplete="email"
                    placeholder="admin@example.com"
                    required
                  />
                </Field>

                <Field label={t("Password", "Contrasena")}>
                  <Input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) =>
                      onLoginFormChange((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    autoComplete="current-password"
                    placeholder={t("password", "contrasena")}
                    required
                  />
                </Field>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit">
                    <LogIn className="mr-2 h-4 w-4" />
                    {t("Sign in", "Iniciar sesion")}
                  </Button>
                  {isSupabaseAuthEnabled ? (
                    <Button type="button" variant="secondary" onClick={onForgotPasswordClick}>
                      {t("Forgot password", "Olvide mi contrasena")}
                    </Button>
                  ) : null}
                </div>

                {!isSupabaseAuthEnabled ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-stone-300">
                    {t("Local fallback credentials", "Credenciales locales por defecto")}: admin@example.com / admin123
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-stone-300">
                    {t(
                      "If you forget your password, request a recovery email from here.",
                      "Si olvidas tu contrasena, pide desde aqui un correo de recuperacion."
                    )}
                  </div>
                )}
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
