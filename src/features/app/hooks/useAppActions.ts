import { useCallback } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import {
  createAccountPasswordForm,
  createAttendanceForm,
  createLoginForm,
  createPasswordResetForm,
  createUserForm,
  createVehicleForm,
} from "../config";
import type { AppRepository } from "../data/repository";
import { isSupabaseAuthEnabled, supabase } from "../data/supabaseClient";
import type {
  AttendanceEntry,
  AccountPasswordFormState,
  AttendanceFormState,
  AppView,
  EmployeeEntry,
  LoginFormState,
  PasswordResetFormState,
  StoreName,
  Translate,
  UserEntry,
  UserFormState,
  VehicleEntry,
  VehicleFormState,
  VehicleHistoryAction,
  VehicleStatus,
} from "../types";
import { getCurrentTime, getTodayDate, normalizeEmployeeCode } from "../utils";

interface UseAuthActionsParams {
  accountPasswordForm: AccountPasswordFormState;
  currentUser: UserEntry | null;
  editingUserId: string | null;
  loginForm: LoginFormState;
  passwordResetForm: PasswordResetFormState;
  setActiveStore: Dispatch<SetStateAction<StoreName>>;
  setAccountPasswordForm: Dispatch<SetStateAction<AccountPasswordFormState>>;
  setCurrentUser: Dispatch<SetStateAction<UserEntry | null>>;
  setCurrentView: Dispatch<SetStateAction<AppView>>;
  setFeedback: Dispatch<SetStateAction<string | null>>;
  setIsAccountPasswordModalOpen: Dispatch<SetStateAction<boolean>>;
  setIsPasswordRecoveryMode: Dispatch<SetStateAction<boolean>>;
  setIsPasswordResetRequestMode: Dispatch<SetStateAction<boolean>>;
  setIsUserModalOpen: Dispatch<SetStateAction<boolean>>;
  setLoginForm: Dispatch<SetStateAction<LoginFormState>>;
  setPasswordResetForm: Dispatch<SetStateAction<PasswordResetFormState>>;
  setReportStore: Dispatch<SetStateAction<StoreName>>;
  setEditingUserId: Dispatch<SetStateAction<string | null>>;
  setUserForm: Dispatch<SetStateAction<UserFormState>>;
  setUsers: Dispatch<SetStateAction<UserEntry[]>>;
  t: Translate;
  userForm: UserFormState;
  users: UserEntry[];
}

export function useAuthActions({
  accountPasswordForm,
  currentUser,
  editingUserId,
  loginForm,
  passwordResetForm,
  setActiveStore,
  setAccountPasswordForm,
  setCurrentUser,
  setCurrentView,
  setFeedback,
  setIsAccountPasswordModalOpen,
  setIsPasswordRecoveryMode,
  setIsPasswordResetRequestMode,
  setIsUserModalOpen,
  setLoginForm,
  setPasswordResetForm,
  setReportStore,
  setEditingUserId,
  setUserForm,
  setUsers,
  t,
  userForm,
  users,
}: UseAuthActionsParams) {
  const callAdminEndpoint = useCallback(
    async (path: string, body: Record<string, unknown>) => {
      if (!isSupabaseAuthEnabled || !supabase) {
        throw new Error("This action requires Supabase auth.");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You must be signed in as an administrator to manage users.");
      }

      const response = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      const rawResponse = await response.text();
      let payload: Record<string, any> = {};

      if (rawResponse) {
        try {
          payload = JSON.parse(rawResponse) as Record<string, any>;
        } catch {
          payload = {};
        }
      }

      if (!response.ok) {
        if (payload.error) {
          console.error(`${path} error`, payload);
        }
        throw new Error(payload.error || `Request failed with status ${response.status}.`);
      }

      return payload;
    },
    []
  );

  const handleLoginSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const email = loginForm.email.trim().toLowerCase();
      const password = loginForm.password;

      if (isSupabaseAuthEnabled && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setFeedback(t("Invalid email or password.", "Correo o contrasena invalidos."));
          return;
        }

        const authUser = data.user;
        const user = users.find(
          (entry) =>
            entry.authUserId === authUser?.id || entry.email.toLowerCase() === email
        );

        if (!user) {
          setFeedback(
            t(
              "The account exists in auth but has no app profile yet.",
              "La cuenta existe en auth pero aun no tiene perfil de aplicacion."
            )
          );
          return;
        }

        if (user.isBlocked) {
          await supabase.auth.signOut();
          setFeedback(
            t(
              "This account is blocked. Contact an administrator.",
              "Esta cuenta esta bloqueada. Contacta a un administrador."
            )
          );
          return;
        }

        setCurrentUser(user);
        setActiveStore(user.store);
        setReportStore(user.store);
        setLoginForm(createLoginForm());
        setCurrentView("home");
        setFeedback(t(`Welcome back, ${user.fullName}.`, `Bienvenido de nuevo, ${user.fullName}.`));
        return;
      }

      const user = users.find((entry) => entry.email.toLowerCase() === email);

      if (!user) {
        setFeedback(t("Invalid email or password.", "Correo o contrasena invalidos."));
        return;
      }

      if (user.isBlocked) {
        setFeedback(
          t(
            "This account is blocked. Contact an administrator.",
            "Esta cuenta esta bloqueada. Contacta a un administrador."
          )
        );
        return;
      }

      setCurrentUser(user);
      setActiveStore(user.store);
      setReportStore(user.store);
      setLoginForm(createLoginForm());
      setCurrentView("home");
      setFeedback(t(`Welcome back, ${user.fullName}.`, `Bienvenido de nuevo, ${user.fullName}.`));
    },
    [
      loginForm.email,
      loginForm.password,
      setActiveStore,
      setCurrentUser,
      setCurrentView,
      setFeedback,
      setLoginForm,
      setReportStore,
      t,
      users,
    ]
  );

  const handlePasswordResetRequest = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const email = passwordResetForm.email.trim().toLowerCase();

      if (!isSupabaseAuthEnabled || !supabase) {
        setFeedback(
          t(
            "Password recovery is only available with Supabase auth.",
            "La recuperacion de contrasena solo esta disponible con Supabase auth."
          )
        );
        return;
      }

      if (!email) {
        setFeedback(t("Enter an email first.", "Ingresa primero un correo."));
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) {
        setFeedback(
          t(error.message, error.message)
        );
        return;
      }

      setLoginForm((current) => ({ ...current, email }));
      setPasswordResetForm((current) => ({
        ...current,
        email,
        password: "",
        confirmPassword: "",
      }));
      setIsPasswordResetRequestMode(false);
      setFeedback(
        t(
          "We sent a password reset link to your email.",
          "Enviamos un enlace de recuperacion a tu correo."
        )
      );
    },
    [
      passwordResetForm.email,
      setFeedback,
      setIsPasswordResetRequestMode,
      setLoginForm,
      setPasswordResetForm,
      t,
    ]
  );

  const handlePasswordUpdate = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!isSupabaseAuthEnabled || !supabase) {
        setFeedback(
          t(
            "Password recovery is only available with Supabase auth.",
            "La recuperacion de contrasena solo esta disponible con Supabase auth."
          )
        );
        return;
      }

      if (!passwordResetForm.password || !passwordResetForm.confirmPassword) {
        setFeedback(
          t("Enter and confirm the new password.", "Ingresa y confirma la nueva contrasena.")
        );
        return;
      }

      if (passwordResetForm.password.length < 8) {
        setFeedback(
          t(
            "The new password must be at least 8 characters.",
            "La nueva contrasena debe tener al menos 8 caracteres."
          )
        );
        return;
      }

      if (passwordResetForm.password !== passwordResetForm.confirmPassword) {
        setFeedback(
          t("The passwords do not match.", "Las contrasenas no coinciden.")
        );
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordResetForm.password,
      });

      if (error) {
        setFeedback(t(error.message, error.message));
        return;
      }

      await supabase.auth.signOut();

      setCurrentUser(null);
      setCurrentView("home");
      setIsPasswordRecoveryMode(false);
      setIsPasswordResetRequestMode(false);
      setPasswordResetForm(createPasswordResetForm());
      setLoginForm((current) => ({
        ...current,
        password: "",
      }));
      setFeedback(
        t(
          "Password updated. Sign in with the new password.",
          "Contrasena actualizada. Inicia sesion con la nueva contrasena."
        )
      );
    },
    [
      passwordResetForm.confirmPassword,
      passwordResetForm.password,
      setCurrentUser,
      setCurrentView,
      setFeedback,
      setIsPasswordRecoveryMode,
      setIsPasswordResetRequestMode,
      setLoginForm,
      setPasswordResetForm,
      t,
    ]
  );

  const handleAccountPasswordUpdate = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!isSupabaseAuthEnabled || !supabase) {
        setFeedback(
          t(
            "Password changes from the app require Supabase auth.",
            "El cambio de contrasena desde la app requiere Supabase auth."
          )
        );
        return;
      }

      if (!accountPasswordForm.password || !accountPasswordForm.confirmPassword) {
        setFeedback(
          t("Enter and confirm the new password.", "Ingresa y confirma la nueva contrasena.")
        );
        return;
      }

      if (accountPasswordForm.password.length < 8) {
        setFeedback(
          t(
            "The new password must be at least 8 characters.",
            "La nueva contrasena debe tener al menos 8 caracteres."
          )
        );
        return;
      }

      if (accountPasswordForm.password !== accountPasswordForm.confirmPassword) {
        setFeedback(t("The passwords do not match.", "Las contrasenas no coinciden."));
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: accountPasswordForm.password,
      });

      if (error) {
        setFeedback(t(error.message, error.message));
        return;
      }

      setIsAccountPasswordModalOpen(false);
      setAccountPasswordForm(createAccountPasswordForm());
      setFeedback(
        t(
          "Password updated successfully.",
          "Contrasena actualizada correctamente."
        )
      );
    },
    [
      accountPasswordForm.confirmPassword,
      accountPasswordForm.password,
      setAccountPasswordForm,
      setFeedback,
      setIsAccountPasswordModalOpen,
      t,
    ]
  );

  const handleUserSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const email = userForm.email.trim().toLowerCase();
      const duplicateUser = users.some(
        (entry) => entry.email.toLowerCase() === email && entry.id !== editingUserId
      );
      const duplicateClockInCode = users.some(
        (entry) =>
          entry.id !== editingUserId &&
          normalizeEmployeeCode(entry.employeeCode) ===
            normalizeEmployeeCode(userForm.employeeCode) && entry.store === userForm.store
      );

      if (duplicateUser) {
        setFeedback(t("That email already exists.", "Ese correo ya existe."));
        return;
      }

      if (duplicateClockInCode) {
        setFeedback(
          t(
            "That clock-in code already exists in this store.",
            "Ese codigo de entrada ya existe en esta tienda."
          )
        );
        return;
      }

      if (!/^\d{4}$/.test(userForm.employeeCode.trim())) {
        setFeedback(
          t(
            "The clock-in code must contain exactly 4 numbers.",
            "El codigo de clock-in debe tener exactamente 4 numeros."
          )
        );
        return;
      }

      if (editingUserId && userForm.password && userForm.password.length < 8) {
        setFeedback(
          t(
            "The new password must be at least 8 characters.",
            "La nueva contrasena debe tener al menos 8 caracteres."
          )
        );
        return;
      }

      let authUserId: string | null = null;

      if (isSupabaseAuthEnabled && supabase) {
        if (!editingUserId && !userForm.password) {
          setFeedback(
            t("Password is required for new users.", "La contrasena es obligatoria para usuarios nuevos.")
          );
          return;
        }

        try {
          const payload = await callAdminEndpoint(
            editingUserId ? "/api/admin/update-user" : "/api/admin/create-user",
            {
              id: editingUserId,
              email,
              employeeCode: userForm.employeeCode,
              fullName: userForm.fullName,
              jobTitle: userForm.jobTitle,
              password: userForm.password,
              role: userForm.role,
              store: userForm.store,
            }
          );

          authUserId = payload.user?.authUserId ?? null;

          const savedUser: UserEntry = {
            id: payload.user?.id ?? editingUserId ?? crypto.randomUUID(),
            authUserId,
            fullName: payload.user?.fullName ?? userForm.fullName.trim(),
            email,
            employeeCode: normalizeEmployeeCode(payload.user?.employeeCode ?? userForm.employeeCode),
            store: payload.user?.store ?? userForm.store,
            jobTitle: payload.user?.jobTitle ?? userForm.jobTitle.trim(),
            role: payload.user?.role ?? userForm.role,
            isBlocked: payload.user?.isBlocked ?? false,
            blockedAt: payload.user?.blockedAt ?? null,
            createdAt: payload.user?.createdAt ?? new Date().toISOString(),
          };

          setUsers((current) =>
            editingUserId
              ? current.map((entry) => (entry.id === editingUserId ? savedUser : entry))
              : [savedUser, ...current]
          );
          if (currentUser?.id === savedUser.id) {
            setCurrentUser(savedUser);
            setActiveStore(savedUser.store);
            setReportStore(savedUser.store);
          }
        } catch (error) {
          setFeedback(
            t(
              error instanceof Error ? error.message : "Could not save user.",
              error instanceof Error ? error.message : "No se pudo guardar el usuario."
            )
          );
          return;
        }

        setEditingUserId(null);
        setUserForm(createUserForm());
        setIsUserModalOpen(false);
        setFeedback(
          t(
            editingUserId ? "User updated successfully." : "User registered successfully.",
            editingUserId ? "Usuario actualizado correctamente." : "Usuario registrado correctamente."
          )
        );
        return;
      }

      const newUser: UserEntry = {
        id: editingUserId ?? crypto.randomUUID(),
        authUserId,
        fullName: userForm.fullName.trim(),
        email,
        employeeCode: normalizeEmployeeCode(userForm.employeeCode),
        store: userForm.store,
        jobTitle: userForm.jobTitle.trim(),
        role: userForm.role,
        isBlocked: false,
        blockedAt: null,
        createdAt: new Date().toISOString(),
      };

      setUsers((current) =>
        editingUserId
          ? current.map((entry) => (entry.id === editingUserId ? newUser : entry))
          : [newUser, ...current]
      );
      if (currentUser?.id === newUser.id) {
        setCurrentUser(newUser);
        setActiveStore(newUser.store);
        setReportStore(newUser.store);
      }
      setEditingUserId(null);
      setUserForm(createUserForm());
      setIsUserModalOpen(false);
      setFeedback(
        t(
          editingUserId ? "User updated successfully." : "User registered successfully.",
          editingUserId ? "Usuario actualizado correctamente." : "Usuario registrado correctamente."
        )
      );
    },
    [
      callAdminEndpoint,
      currentUser,
      editingUserId,
      setActiveStore,
      setCurrentUser,
      setEditingUserId,
      setFeedback,
      setIsUserModalOpen,
      setReportStore,
      setUserForm,
      setUsers,
      t,
      userForm,
      users,
    ]
  );

  const handleUserDelete = useCallback(
    async (user: UserEntry, adminPin: string) => {
      if (currentUser?.id === user.id) {
        setFeedback(
          t("You cannot delete your own account.", "No puedes eliminar tu propia cuenta.")
        );
        return false;
      }

      if (isSupabaseAuthEnabled && supabase) {
        try {
          await callAdminEndpoint("/api/admin/delete-user", {
            id: user.id,
            adminPin: adminPin.trim(),
          });
        } catch (error) {
          setFeedback(
            t(
              error instanceof Error ? error.message : "Could not delete user.",
              error instanceof Error ? error.message : "No se pudo eliminar el usuario."
            )
          );
          return false;
        }
      }

      setUsers((current) => current.filter((entry) => entry.id !== user.id));
      setFeedback(t("User deleted successfully.", "Usuario eliminado correctamente."));
      return true;
    },
    [callAdminEndpoint, currentUser?.id, setFeedback, setUsers, t]
  );

  const handleUserBlockToggle = useCallback(
    async (user: UserEntry) => {
      if (currentUser?.id === user.id) {
        setFeedback(
          t("You cannot block your own account.", "No puedes bloquear tu propia cuenta.")
        );
        return;
      }

      const nextBlockedState = !user.isBlocked;

      if (isSupabaseAuthEnabled && supabase) {
        try {
          const payload = await callAdminEndpoint("/api/admin/toggle-user-block", {
            id: user.id,
            block: nextBlockedState,
          });

          setUsers((current) =>
            current.map((entry) =>
              entry.id === user.id
                ? {
                    ...entry,
                    isBlocked: payload.user?.isBlocked ?? nextBlockedState,
                    blockedAt: payload.user?.blockedAt ?? (nextBlockedState ? new Date().toISOString() : null),
                  }
                : entry
            )
          );
        } catch (error) {
          setFeedback(
            t(
              error instanceof Error ? error.message : "Could not update user status.",
              error instanceof Error ? error.message : "No se pudo actualizar el estado del usuario."
            )
          );
          return;
        }
      } else {
        setUsers((current) =>
          current.map((entry) =>
            entry.id === user.id
              ? {
                  ...entry,
                  isBlocked: nextBlockedState,
                  blockedAt: nextBlockedState ? new Date().toISOString() : null,
                }
              : entry
          )
        );
      }

      setFeedback(
        t(
          nextBlockedState ? "User blocked successfully." : "User unblocked successfully.",
          nextBlockedState ? "Usuario bloqueado correctamente." : "Usuario desbloqueado correctamente."
        )
      );
    },
    [callAdminEndpoint, currentUser?.id, setFeedback, setUsers, t]
  );

  const handleLogout = useCallback(() => {
    if (isSupabaseAuthEnabled && supabase) {
      void supabase.auth.signOut();
    }
    setCurrentUser(null);
    setCurrentView("home");
    setFeedback(t("Session closed.", "Sesion cerrada."));
  }, [setCurrentUser, setCurrentView, setFeedback, t]);

  return {
    handleUserBlockToggle,
    handleUserDelete,
    handleAccountPasswordUpdate,
    handleLoginSubmit,
    handleLogout,
    handlePasswordResetRequest,
    handlePasswordUpdate,
    handleUserSubmit,
  };
}

interface UseVehicleActionsParams {
  activeStore: StoreName;
  currentUser: UserEntry | null;
  setFeedback: Dispatch<SetStateAction<string | null>>;
  setVehicleForm: Dispatch<SetStateAction<VehicleFormState>>;
  setVehicles: Dispatch<SetStateAction<VehicleEntry[]>>;
  t: Translate;
  vehicleForm: VehicleFormState;
}

export function useVehicleActions({
  activeStore,
  currentUser,
  setFeedback,
  setVehicleForm,
  setVehicles,
  t,
  vehicleForm,
}: UseVehicleActionsParams) {
  const handleVehicleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const nowIso = new Date().toISOString();
      const actor = currentUser?.fullName ?? "System";

      const newEntry: VehicleEntry = {
        id: crypto.randomUUID(),
        date: vehicleForm.date,
        store: vehicleForm.store,
        stock: vehicleForm.stock.trim(),
        make: vehicleForm.make.trim(),
        model: vehicleForm.model.trim(),
        vin: vehicleForm.vin.trim(),
        salesPerson: vehicleForm.salesPerson.trim(),
        time: vehicleForm.time,
        pickupTime: vehicleForm.pickupTime,
        deliveredTime: "",
        simo: vehicleForm.simo.trim(),
        comments: vehicleForm.comments.trim(),
        price: Number(vehicleForm.price || 0),
        status: "Pendiente",
        createdAt: nowIso,
        updatedAt: nowIso,
        updatedBy: actor,
        history: [
          {
            id: crypto.randomUUID(),
            action: "created",
            timestamp: nowIso,
            by: actor,
            note: `Vehicle created for ${vehicleForm.store}.`,
          },
        ],
      };

      setVehicles((current) => [newEntry, ...current]);
      setVehicleForm(createVehicleForm(activeStore));
      setFeedback(t("Vehicle saved successfully.", "Vehiculo registrado correctamente."));
    },
    [activeStore, currentUser?.fullName, setFeedback, setVehicleForm, setVehicles, t, vehicleForm]
  );

  const updateVehicleStatus = useCallback(
    (id: string, status: VehicleStatus) => {
      const actor = currentUser?.fullName ?? "System";
      const nowIso = new Date().toISOString();

      setVehicles((current) =>
        current.map((entry) => {
          if (entry.id !== id || entry.status === status) return entry;

          const autoDeliveredTime =
            status === "Completo" && !entry.deliveredTime ? getCurrentTime() : entry.deliveredTime;

          return {
            ...entry,
            status,
            deliveredTime: autoDeliveredTime,
            updatedAt: nowIso,
            updatedBy: actor,
            history: [
              {
                id: crypto.randomUUID(),
                action: "status",
                timestamp: nowIso,
                by: actor,
                note: `Status changed to ${status}.`,
              },
              ...(autoDeliveredTime && !entry.deliveredTime
                ? [
                    {
                      id: crypto.randomUUID(),
                      action: "delivery_time" as VehicleHistoryAction,
                      timestamp: nowIso,
                      by: actor,
                      note: `Actual delivery time set to ${autoDeliveredTime}.`,
                    },
                  ]
                : []),
              ...entry.history,
            ],
          };
        })
      );
    },
    [currentUser?.fullName, setVehicles]
  );

  const updateVehicleDeliveredTime = useCallback(
    (id: string, deliveredTime: string) => {
      const actor = currentUser?.fullName ?? "System";
      const nowIso = new Date().toISOString();

      setVehicles((current) =>
        current.map((entry) => {
          if (entry.id !== id || entry.deliveredTime === deliveredTime) return entry;

          return {
            ...entry,
            deliveredTime,
            updatedAt: nowIso,
            updatedBy: actor,
            history: [
              {
                id: crypto.randomUUID(),
                action: "delivery_time",
                timestamp: nowIso,
                by: actor,
                note: deliveredTime
                  ? `Actual delivery time updated to ${deliveredTime}.`
                  : "Actual delivery time cleared.",
              },
              ...entry.history,
            ],
          };
        })
      );
    },
    [currentUser?.fullName, setVehicles]
  );

  return {
    handleVehicleSubmit,
    updateVehicleDeliveredTime,
    updateVehicleStatus,
  };
}

interface UseAttendanceActionsParams {
  activeStore: StoreName;
  attendance: AttendanceEntry[];
  attendanceForm: AttendanceFormState;
  clockOutCodeInput: string;
  clockOutTarget: AttendanceEntry | null;
  setAttendance: Dispatch<SetStateAction<AttendanceEntry[]>>;
  setAttendanceForm: Dispatch<SetStateAction<AttendanceFormState>>;
  setClockOutCodeInput: Dispatch<SetStateAction<string>>;
  setClockOutTarget: Dispatch<SetStateAction<AttendanceEntry | null>>;
  setFeedback: Dispatch<SetStateAction<string | null>>;
  t: Translate;
  usersByStore: UserEntry[];
}

export function useAttendanceActions({
  activeStore,
  attendance,
  attendanceForm,
  clockOutCodeInput,
  clockOutTarget,
  setAttendance,
  setAttendanceForm,
  setClockOutCodeInput,
  setClockOutTarget,
  setFeedback,
  t,
  usersByStore,
}: UseAttendanceActionsParams) {
  const handleClockIn = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const employeeCode = normalizeEmployeeCode(attendanceForm.employeeCode);

      if (!/^\d{4}$/.test(employeeCode)) {
        setFeedback(
          t(
            "Enter a valid 4-digit employee code.",
            "Ingresa un codigo valido de 4 digitos."
          )
        );
        return;
      }

      const employee = usersByStore.find(
        (entry) => normalizeEmployeeCode(entry.employeeCode) === employeeCode
      );

      if (!employee) {
        setFeedback(t("Register that code in users first.", "Primero registra ese codigo en usuarios."));
        return;
      }

      const duplicateOpenShift = attendance.some(
        (entry) =>
          normalizeEmployeeCode(entry.employeeCode) === employeeCode &&
          entry.store === attendanceForm.store &&
          entry.date === getTodayDate() &&
          !entry.clockOut
      );

      if (duplicateOpenShift) {
        setFeedback(
          t(
            "That code already has an open shift in this store.",
            "Ese codigo ya tiene una entrada abierta en esta tienda."
          )
        );
        return;
      }

      const newEntry: AttendanceEntry = {
        id: crypto.randomUUID(),
        employeeCode,
        employeeName: employee.fullName,
        role: employee.jobTitle,
        store: attendanceForm.store,
        date: getTodayDate(),
        clockIn: getCurrentTime(),
        clockOut: null,
        notes: attendanceForm.notes.trim(),
      };

      setAttendance((current) => [newEntry, ...current]);
      setAttendanceForm(createAttendanceForm(activeStore));
      setFeedback(t("Employee clock-in registered.", "Entrada de empleado registrada."));
    },
    [
      activeStore,
      attendance,
      attendanceForm,
      setAttendance,
      setAttendanceForm,
      setFeedback,
      t,
      usersByStore,
    ]
  );

  const openClockOutModal = useCallback(
    (entry: AttendanceEntry) => {
      setClockOutTarget(entry);
      setClockOutCodeInput("");
    },
    [setClockOutCodeInput, setClockOutTarget]
  );

  const handleClockOut = useCallback(
    (id: string) => {
      setAttendance((current) =>
        current.map((entry) => (entry.id === id ? { ...entry, clockOut: getCurrentTime() } : entry))
      );
      setFeedback(t("Employee clock-out registered.", "Salida de empleado registrada."));
    },
    [setAttendance, setFeedback, t]
  );

  const handleClockOutSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!clockOutTarget) {
        setFeedback(
          t("Select an employee before clocking out.", "Selecciona un empleado antes de marcar salida.")
        );
        return;
      }

      if (normalizeEmployeeCode(clockOutCodeInput) !== normalizeEmployeeCode(clockOutTarget.employeeCode)) {
        setFeedback(
          t(
            "The code does not match the selected employee.",
            "El codigo no coincide con el empleado seleccionado."
          )
        );
        return;
      }

      handleClockOut(clockOutTarget.id);
      setClockOutTarget(null);
      setClockOutCodeInput("");
    },
    [
      clockOutCodeInput,
      clockOutTarget,
      handleClockOut,
      setClockOutCodeInput,
      setClockOutTarget,
      setFeedback,
      t,
    ]
  );

  return {
    handleClockIn,
    handleClockOutSubmit,
    openClockOutModal,
  };
}

interface UseAdminActionsParams {
  repository: AppRepository;
  reportStore: StoreName;
  setAttendance: Dispatch<SetStateAction<AttendanceEntry[]>>;
  setEmployees: Dispatch<SetStateAction<EmployeeEntry[]>>;
  setFeedback: Dispatch<SetStateAction<string | null>>;
  setVehicles: Dispatch<SetStateAction<VehicleEntry[]>>;
  t: Translate;
}

export function useAdminActions({
  repository,
  reportStore,
  setAttendance,
  setEmployees,
  setFeedback,
  setVehicles,
  t,
}: UseAdminActionsParams) {
  const resetDemoData = useCallback(() => {
    void repository.clearOperationalData();
    setVehicles([]);
    setAttendance([]);
    setEmployees([]);
    setFeedback(t("Demo data reset.", "Datos reiniciados."));
  }, [repository, setAttendance, setEmployees, setFeedback, setVehicles, t]);

  const handleSendReportPreview = useCallback(() => {
    setFeedback(
      t(
        `Daily report preview ready for ${reportStore}. Next step: connect email delivery.`,
        `Vista previa del informe diario lista para ${reportStore}. Siguiente paso: conectar el envio por correo.`
      )
    );
  }, [reportStore, setFeedback, t]);

  return {
    handleSendReportPreview,
    resetDemoData,
  };
}
