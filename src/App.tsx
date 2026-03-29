import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CarFront,
  Clock3,
  LayoutDashboard,
  LogOut,
  Shield,
  Users,
} from "lucide-react";
import {
  DEFAULT_LOCATION_NAME,
  createAttendanceForm,
  createDeviceStoreSettings,
  createLoginForm,
  createPasswordResetForm,
  createStoreForm,
  createUserForm,
  createVehicleFilters,
  createVehicleForm,
  DEVICE_STORE_SETTINGS_KEY,
} from "./features/app/config";
import { AdminView } from "./features/app/components/AdminView";
import { ClockOutDialog } from "./features/app/components/ClockOutDialog";
import { HomeCard, Field, LocationBrand, StatCard } from "./features/app/components/common";
import {
  useAdminActions,
  useAttendanceActions,
  useAuthActions,
  useVehicleActions,
} from "./features/app/hooks/useAppActions";
import { getAppRepository } from "./features/app/data/getAppRepository";
import { isSupabaseAuthEnabled, supabase } from "./features/app/data/supabaseClient";
import { usePersistentAppData } from "./features/app/hooks/usePersistentAppData";
import { LoginScreen } from "./features/app/components/LoginScreen";
import { TimeView } from "./features/app/components/TimeView";
import { UserView } from "./features/app/components/UserView";
import { VehicleView } from "./features/app/components/VehicleView";
import type {
  AdminStoreStat,
  AppView,
  AttendanceEntry,
  AttendanceFormState,
  DeviceStoreSettings,
  EmployeeEntry,
  Language,
  LoginFormState,
  PayrollClosureEntry,
  PayrollEmployeeSummary,
  PasswordResetFormState,
  SalesPeriodPreset,
  StoreFormState,
  StoreEntry,
  StoreName,
  Translate,
  UserEntry,
  UserFormState,
  UserRole,
  VehicleEntry,
  VehicleFiltersState,
  VehicleFormState,
  VehicleStatus,
} from "./features/app/types";
import {
  buildPayrollSummary,
  formatCurrency,
  formatDateWithWeekday,
  buildUserWorkSummaries,
  getSalesPeriodRange,
  getUniqueLocations,
  getTodayDate,
  isDateWithinRange,
  normalizeEmployeeCode,
} from "./features/app/utils";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { Select } from "./components/ui/select";
function App() {
  const initialDeviceStoreSettings = useMemo<DeviceStoreSettings>(() => {
    if (typeof window === "undefined") {
      return createDeviceStoreSettings();
    }

    try {
      const raw = window.localStorage.getItem(DEVICE_STORE_SETTINGS_KEY);
      if (!raw) return createDeviceStoreSettings();
      const parsed = JSON.parse(raw) as Partial<DeviceStoreSettings>;
      return {
        ...createDeviceStoreSettings(),
        ...parsed,
        store: String(parsed.store || DEFAULT_LOCATION_NAME),
      };
    } catch {
      return createDeviceStoreSettings();
    }
  }, []);

  const appRepository = useMemo(() => getAppRepository(), []);
  const [language, setLanguage] = useState<Language>("en");
  const [currentView, setCurrentView] = useState<AppView>("home");
  const [isPublicTimeControlMode, setIsPublicTimeControlMode] = useState(false);
  const [activeStore, setActiveStore] = useState<StoreName>(initialDeviceStoreSettings.store || DEFAULT_LOCATION_NAME);
  const [reportStore, setReportStore] = useState<StoreName>(initialDeviceStoreSettings.store || DEFAULT_LOCATION_NAME);
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriodPreset>("today");
  const [salesCustomStart, setSalesCustomStart] = useState(getTodayDate());
  const [salesCustomEnd, setSalesCustomEnd] = useState(getTodayDate());
  const [storeSettings, setStoreSettings] = useState<DeviceStoreSettings>(initialDeviceStoreSettings);
  const [storeSettingsForm, setStoreSettingsForm] = useState<DeviceStoreSettings>(initialDeviceStoreSettings);
  const [isStoreSettingsOpen, setIsStoreSettingsOpen] = useState(false);
  const [storeForm, setStoreForm] = useState<StoreFormState>(() => createStoreForm());
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [deleteStoreTarget, setDeleteStoreTarget] = useState<StoreEntry | null>(null);
  const [deleteStoreFeedback, setDeleteStoreFeedback] = useState<string | null>(null);
  const [makeFilter, setMakeFilter] = useState("Todas");
  const [vehicleFilters, setVehicleFilters] = useState<VehicleFiltersState>(() =>
    createVehicleFilters()
  );
  const [areVehicleFiltersVisible, setAreVehicleFiltersVisible] = useState(false);
  const [vehicleForm, setVehicleForm] = useState<VehicleFormState>(() =>
    createVehicleForm(initialDeviceStoreSettings.store || DEFAULT_LOCATION_NAME)
  );
  const [attendanceForm, setAttendanceForm] = useState<AttendanceFormState>(() =>
    createAttendanceForm(initialDeviceStoreSettings.store || DEFAULT_LOCATION_NAME)
  );
  const [loginForm, setLoginForm] = useState<LoginFormState>(() => createLoginForm());
  const [passwordResetForm, setPasswordResetForm] = useState<PasswordResetFormState>(() =>
    createPasswordResetForm()
  );
  const [isPasswordRecoveryMode, setIsPasswordRecoveryMode] = useState(false);
  const [isPasswordResetRequestMode, setIsPasswordResetRequestMode] = useState(false);
  const [userForm, setUserForm] = useState<UserFormState>(() => createUserForm());
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState<UserEntry | null>(null);
  const [deleteUserPin, setDeleteUserPin] = useState("");
  const [blockUserTarget, setBlockUserTarget] = useState<UserEntry | null>(null);
  const [blockUserPin, setBlockUserPin] = useState("");
  const [clockOutTarget, setClockOutTarget] = useState<AttendanceEntry | null>(null);
  const [clockOutCodeInput, setClockOutCodeInput] = useState("");
  const [vehicles, setVehicles] = useState<VehicleEntry[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [employees, setEmployees] = useState<EmployeeEntry[]>([]);
  const [payrollClosures, setPayrollClosures] = useState<PayrollClosureEntry[]>([]);
  const [stores, setStores] = useState<StoreEntry[]>([]);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<UserEntry | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const t: Translate = (en: string, es: string) => (language === "es" ? es : en);

  const { hydrationError, isHydrated } = usePersistentAppData({
    attendance,
    employees,
    payrollClosures,
    repository: appRepository,
    setAttendance,
    setEmployees,
    setPayrollClosures,
    setStores,
    setUsers,
    setVehicles,
    stores,
    users,
    vehicles,
  });

  useEffect(() => {
    setVehicleForm((current) => ({
      ...current,
      store: activeStore,
      salesPerson: currentUser?.fullName ?? current.salesPerson,
    }));
    setAttendanceForm((current) => ({ ...current, store: activeStore }));
    setReportStore(activeStore);
  }, [activeStore, currentUser?.fullName]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DEVICE_STORE_SETTINGS_KEY, JSON.stringify(storeSettings));
  }, [storeSettings]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (currentUser?.role === "admin") return;
    if (currentView !== "admin" && currentView !== "users") return;
    setCurrentView("home");
  }, [currentUser, currentView]);

  useEffect(() => {
    if (!isHydrated || !isSupabaseAuthEnabled || !supabase) return;
    const authClient = supabase;

    let mounted = true;

    const syncSession = async () => {
      const {
        data: { session },
      } = await authClient.auth.getSession();

      if (!mounted) return;

      if (!session?.user) {
        setCurrentUser(null);
        return;
      }

      const profile =
        users.find((entry) => entry.authUserId === session.user.id) ??
        users.find((entry) => entry.email.toLowerCase() === session.user.email?.toLowerCase());

      if (profile) {
        if (profile.isBlocked) {
          await authClient.auth.signOut();
          setFeedback(
            t(
              "This account is blocked. Contact an administrator.",
              "Esta cuenta esta bloqueada. Contacta a un administrador."
            )
          );
          return;
        }
        setCurrentUser(profile);
        const nextStore = storeSettings.isConfigured ? storeSettings.store : profile.store || DEFAULT_LOCATION_NAME;
        setActiveStore(nextStore);
        setReportStore(nextStore);
      }
    };

    void syncSession();

    const {
      data: { subscription },
    } = authClient.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (_event === "PASSWORD_RECOVERY") {
        setCurrentUser(null);
        setCurrentView("home");
        setIsPasswordRecoveryMode(true);
        setIsPasswordResetRequestMode(false);
        setPasswordResetForm((current) => ({
          ...current,
          email: session?.user.email?.toLowerCase() ?? current.email,
          password: "",
          confirmPassword: "",
        }));
        return;
      }

      if (!session?.user) {
        setCurrentUser(null);
        return;
      }

      const profile =
        users.find((entry) => entry.authUserId === session.user.id) ??
        users.find((entry) => entry.email.toLowerCase() === session.user.email?.toLowerCase());

      if (profile) {
        if (profile.isBlocked) {
          void authClient.auth.signOut();
          setFeedback(
            t(
              "This account is blocked. Contact an administrator.",
              "Esta cuenta esta bloqueada. Contacta a un administrador."
            )
          );
          return;
        }
        setIsPasswordRecoveryMode(false);
        setIsPasswordResetRequestMode(false);
        setCurrentUser(profile);
        const nextStore = storeSettings.isConfigured ? storeSettings.store : profile.store || DEFAULT_LOCATION_NAME;
        setActiveStore(nextStore);
        setReportStore(nextStore);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isHydrated, storeSettings.isConfigured, storeSettings.store, users]);

  const vehiclesByStore = useMemo(
    () => vehicles.filter((entry) => entry.store === activeStore),
    [vehicles, activeStore]
  );

  const availableLocations = useMemo(
    () =>
      getUniqueLocations([
        activeStore,
        reportStore,
        storeSettings.store,
        ...stores.map((entry) => entry.name),
        ...vehicles.map((entry) => entry.store),
        ...attendance.map((entry) => entry.store),
        ...users.map((entry) => entry.store),
        ...payrollClosures.map((entry) => entry.store),
      ]),
    [activeStore, attendance, payrollClosures, reportStore, storeSettings.store, stores, users, vehicles]
  );

  const scopedVehicleRecords = useMemo(() => {
    if (currentUser?.role !== "admin") {
      return vehicles.filter((entry) => entry.store === activeStore);
    }

    if (vehicleFilters.store === "all") return vehicles;
    return vehicles.filter((entry) => entry.store === vehicleFilters.store);
  }, [currentUser, vehicleFilters.store, vehicles]);

  const availableMakes = useMemo(
    () =>
      Array.from(
        new Set(
          scopedVehicleRecords
            .map((entry) => entry.make.trim())
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))
        )
      ),
    [scopedVehicleRecords]
  );

  const availableSalesPeople = useMemo(
    () =>
      Array.from(
        new Set(
          scopedVehicleRecords
            .map((entry) => entry.salesPerson.trim())
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))
        )
      ),
    [scopedVehicleRecords]
  );

  const filteredVehicles = useMemo(() => {
    let result = scopedVehicleRecords;
    const today = getTodayDate();
    let vehicleDateStart = today;
    let vehicleDateEnd = today;

    switch (vehicleFilters.datePreset) {
      case "today":
        vehicleDateStart = today;
        vehicleDateEnd = today;
        break;
      case "yesterday": {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayValue = yesterday.toISOString().slice(0, 10);
        vehicleDateStart = yesterdayValue;
        vehicleDateEnd = yesterdayValue;
        break;
      }
      case "week": {
        const range = getSalesPeriodRange("week", "", "");
        vehicleDateStart = range.start;
        vehicleDateEnd = range.end;
        break;
      }
      case "month": {
        const range = getSalesPeriodRange("month", "", "");
        vehicleDateStart = range.start;
        vehicleDateEnd = range.end;
        break;
      }
      case "specific":
        vehicleDateStart = vehicleFilters.date || today;
        vehicleDateEnd = vehicleFilters.date || today;
        break;
      case "overdue":
        vehicleDateStart = "0000-01-01";
        vehicleDateEnd = today;
        break;
    }

    if (makeFilter !== "Todas") {
      result = result.filter((entry) => entry.make === makeFilter);
    }

    result = result.filter((entry) =>
      vehicleFilters.datePreset === "overdue"
        ? entry.status === "Pendiente" && entry.date < today
        : isDateWithinRange(entry.date, vehicleDateStart, vehicleDateEnd)
    );

    if (vehicleFilters.status !== "all") {
      result = result.filter((entry) => entry.status === vehicleFilters.status);
    }

    if (vehicleFilters.salesPerson) {
      result = result.filter(
        (entry) =>
          entry.salesPerson.toLowerCase() === vehicleFilters.salesPerson.toLowerCase()
      );
    }

    if (vehicleFilters.search.trim()) {
      const query = vehicleFilters.search.trim().toLowerCase();
      result = result.filter((entry) =>
        [
          entry.stock,
          entry.make,
          entry.model,
          entry.vin,
          entry.salesPerson,
          entry.simo,
          entry.comments,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }

    return result;
  }, [makeFilter, scopedVehicleRecords, vehicleFilters]);

  const vehiclesByMake = useMemo(
    () =>
      availableMakes.map((make) => ({
        make,
        count: scopedVehicleRecords.filter((entry) => entry.make === make).length,
      })),
    [availableMakes, scopedVehicleRecords]
  );

  const attendanceByStore = useMemo(
    () => attendance.filter((entry) => entry.store === activeStore),
    [attendance, activeStore]
  );

  const usersByStore = useMemo(() => users, [users]);

  const selectedEmployee = useMemo(
    () =>
      usersByStore.find(
        (entry) =>
          normalizeEmployeeCode(entry.employeeCode) ===
          normalizeEmployeeCode(attendanceForm.employeeCode)
      ) ?? null,
    [usersByStore, attendanceForm.employeeCode]
  );

  useEffect(() => {
    if (makeFilter === "Todas") return;
    if (availableMakes.includes(makeFilter)) return;
    setMakeFilter("Todas");
  }, [availableMakes, makeFilter]);

  useEffect(() => {
    if (!vehicleFilters.salesPerson) return;
    if (availableSalesPeople.includes(vehicleFilters.salesPerson)) return;
    setVehicleFilters((current) => ({ ...current, salesPerson: "" }));
  }, [availableSalesPeople, vehicleFilters.salesPerson]);

  useEffect(() => {
    if (!attendanceForm.employeeCode.trim()) {
      setAttendanceForm((current) => ({
        ...current,
        employeeName: "",
        role: "",
      }));
      return;
    }

    if (!selectedEmployee) return;

    setAttendanceForm((current) => {
      if (
        current.employeeName === selectedEmployee.fullName &&
        current.role === selectedEmployee.jobTitle
      ) {
        return current;
      }

      return {
        ...current,
        employeeName: selectedEmployee.fullName,
        role: selectedEmployee.jobTitle,
      };
    });
  }, [attendanceForm.employeeCode, selectedEmployee]);

  const activeShifts = useMemo(
    () => attendanceByStore.filter((entry) => !entry.clockOut),
    [attendanceByStore]
  );

  const salesRange = useMemo(
    () => getSalesPeriodRange(salesPeriod, salesCustomStart, salesCustomEnd),
    [salesCustomEnd, salesCustomStart, salesPeriod]
  );

  const salesPeriodLabel = useMemo(() => {
    switch (salesPeriod) {
      case "today":
        return t("Today", "Hoy");
      case "yesterday":
        return t("Yesterday", "Ayer");
      case "week":
        return t("This week", "Esta semana");
      case "month":
        return t("This month", "Este mes");
      case "year":
        return t("This year", "Este ano");
      case "custom":
        return t("Custom range", "Rango personalizado");
    }
  }, [salesPeriod, t]);

  const todayVehicles = useMemo(
    () => vehiclesByStore.filter((entry) => entry.date === getTodayDate()),
    [vehiclesByStore]
  );

  const todaySales = useMemo(
    () => todayVehicles.reduce((total, entry) => total + entry.price, 0),
    [todayVehicles]
  );

  const pendingVehicles = useMemo(
    () =>
      vehiclesByStore.filter((entry) => entry.status === "Pendiente").length,
    [vehiclesByStore]
  );

  const completedVehicles = useMemo(
    () =>
      vehiclesByStore.filter((entry) => entry.status === "Entregado").length,
    [vehiclesByStore]
  );

  const totalVehicles = vehicles.length;
  const totalCompletedVehicles = vehicles.filter(
    (entry) => entry.status === "Entregado"
  ).length;
  const totalOpenShifts = attendance.filter((entry) => !entry.clockOut).length;
  const totalEmployees = users.length;
  const globalPeriodVehicles = useMemo(
    () =>
      vehicles.filter((entry) =>
        isDateWithinRange(entry.date, salesRange.start, salesRange.end)
      ),
    [salesRange.end, salesRange.start, vehicles]
  );
  const globalPeriodCompletedVehicles = useMemo(
    () =>
      globalPeriodVehicles.filter((entry) => entry.status === "Entregado").length,
    [globalPeriodVehicles]
  );
  const globalPeriodPendingVehicles = useMemo(
    () =>
      globalPeriodVehicles.filter((entry) => entry.status === "Pendiente").length,
    [globalPeriodVehicles]
  );
  const globalPeriodSales = useMemo(
    () => globalPeriodVehicles.reduce((sum, entry) => sum + entry.price, 0),
    [globalPeriodVehicles]
  );

  const adminStoreStats = useMemo<AdminStoreStat[]>(
    () =>
      availableLocations.map((store) => {
        const storeVehicles = vehicles.filter(
          (entry) =>
            entry.store === store &&
            isDateWithinRange(entry.date, salesRange.start, salesRange.end)
        );
        const storeAttendance = attendance.filter((entry) => entry.store === store);
        const storeEmployees = users.filter((entry) => entry.store === store);
        const openShifts = storeAttendance.filter((entry) => !entry.clockOut).length;
        const pending = storeVehicles.filter((entry) => entry.status === "Pendiente").length;
        const salesToday = storeVehicles.reduce((total, entry) => total + entry.price, 0);

        return {
          store,
          vehicles: storeVehicles.length,
          employees: storeEmployees.length,
          openShifts,
          pending,
          salesToday,
        };
      }),
    [attendance, availableLocations, salesRange.end, salesRange.start, users, vehicles]
  );

  const reportVehicles = useMemo(
    () =>
      vehicles
        .filter(
          (entry) =>
            entry.store === reportStore &&
            isDateWithinRange(entry.date, salesRange.start, salesRange.end)
        )
        .sort((a, b) => a.time.localeCompare(b.time)),
    [reportStore, salesRange.end, salesRange.start, vehicles]
  );

  const reportTotal = useMemo(
    () => reportVehicles.reduce((sum, entry) => sum + entry.price, 0),
    [reportVehicles]
  );

  const reportCompleted = useMemo(
    () => reportVehicles.filter((entry) => entry.status === "Entregado").length,
    [reportVehicles]
  );

  const storeReportMap = useMemo(
    () =>
      new Map(
        availableLocations.map((store) => [
          store,
          vehicles
            .filter(
              (entry) =>
                entry.store === store &&
                isDateWithinRange(entry.date, salesRange.start, salesRange.end)
            )
            .sort((a, b) => a.time.localeCompare(b.time)),
        ])
      ),
    [availableLocations, salesRange.end, salesRange.start, vehicles]
  );

  const userPayrollData = useMemo(() => {
    const latestClosureByStore = new Map<StoreName, PayrollClosureEntry | null>();

    availableLocations.forEach((store) => {
      const latestClosure =
        payrollClosures
          .filter((entry) => entry.store === store)
          .sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime())[0] ?? null;
      latestClosureByStore.set(store, latestClosure);
    });

    const byUserId = new Map<
      string,
      {
        summary: PayrollEmployeeSummary | null;
        periodLabel: string;
        store: StoreName;
      }
    >();

    users.forEach((user) => {
      const latestClosure = latestClosureByStore.get(user.store) ?? null;
      byUserId.set(user.id, {
        summary: null,
        periodLabel: latestClosure
          ? formatDateWithWeekday(latestClosure.closedAt.slice(0, 10), language)
          : t("Not closed yet", "Aun no se ha cerrado"),
        store: user.store,
      });
    });

    availableLocations.forEach((store) => {
      const latestClosure = latestClosureByStore.get(store) ?? null;
      const summaries = buildPayrollSummary({
        attendance,
        payrollPeriodStart: latestClosure?.closedAt ?? null,
        store,
        users,
      });

      summaries.forEach((summary) => {
        byUserId.set(summary.userId, {
          summary,
          periodLabel: latestClosure
            ? formatDateWithWeekday(latestClosure.closedAt.slice(0, 10), language)
            : t("Not closed yet", "Aun no se ha cerrado"),
          store,
        });
      });
    });

    return byUserId;
  }, [attendance, availableLocations, language, payrollClosures, t, users]);

  const userWorkSummaries = useMemo(
    () =>
      buildUserWorkSummaries({
        attendance,
        users,
      }),
    [attendance, users]
  );

  const {
    handleUserBlockToggle,
    handleUserDelete,
    handleLoginSubmit,
    handleLogout,
    handlePasswordResetRequest,
    handlePasswordUpdate,
    handleUserSubmit,
  } = useAuthActions({
    activeStore,
    currentUser,
    editingUserId,
    loginForm,
    passwordResetForm,
    setActiveStore,
    setCurrentUser,
    setCurrentView,
    setFeedback,
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
  });

  const { deleteVehicleEntry, handleVehicleSubmit, updateVehicleDeliveredTime, updateVehicleEntry, updateVehicleStatus } = useVehicleActions({
    activeStore,
    currentUser,
    repository: appRepository,
    setFeedback,
    setVehicleForm,
    setVehicles,
    t,
    vehicleForm,
  });

  const { handleClockIn, handleClockOutSubmit, openClockOutModal } = useAttendanceActions({
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
  });

  const handleAdminAttendanceCorrection = useMemo(
    () =>
      (payload: {
        user: UserEntry;
        date: string;
        clockIn: string;
        clockOut: string;
        store: StoreName;
        notes: string;
      }) => {
        if (!payload.clockIn) {
          setFeedback(t("Clock-in time is required.", "La hora de entrada es obligatoria."));
          return false;
        }

        if (payload.clockOut && payload.clockOut < payload.clockIn) {
          setFeedback(
            t(
              "Clock-out cannot be earlier than clock-in.",
              "La hora de salida no puede ser anterior a la hora de entrada."
            )
          );
          return false;
        }

        const normalizedCode = normalizeEmployeeCode(payload.user.employeeCode);

        setAttendance((current) => {
          const existingEntry = current.find(
            (entry) =>
              normalizeEmployeeCode(entry.employeeCode) === normalizedCode &&
              entry.date === payload.date
          );

          if (existingEntry) {
            return current.map((entry) =>
              entry.id === existingEntry.id
                ? {
                    ...entry,
                    employeeName: payload.user.fullName,
                    role: payload.user.jobTitle,
                    store: payload.store,
                    clockIn: payload.clockIn,
                    clockOut: payload.clockOut || null,
                    notes: payload.notes.trim(),
                  }
                : entry
            );
          }

          const createdEntry: AttendanceEntry = {
            id: crypto.randomUUID(),
            employeeCode: normalizedCode,
            employeeName: payload.user.fullName,
            role: payload.user.jobTitle,
            store: payload.store,
            date: payload.date,
            clockIn: payload.clockIn,
            clockOut: payload.clockOut || null,
            notes: payload.notes.trim(),
          };

          return [createdEntry, ...current];
        });

        setFeedback(
          t(
            "Attendance updated successfully.",
            "La asistencia se actualizo correctamente."
          )
        );
        return true;
      },
    [setAttendance, setFeedback, t]
  );

  const {
    exportDailyBillingCsv,
    handlePrintDailyBilling,
    handleSendReportPreview,
    resetDemoData,
  } = useAdminActions({
    currentUser,
    payrollClosures,
    payrollSummaries: [],
    repository: appRepository,
    reportStore,
    reportVehicles,
    stores,
    setAttendance,
    setEmployees,
    setFeedback,
    setPayrollClosures,
    setVehicles,
    t,
  });

  const configuredStoreLabel = useMemo(
    () => storeSettings.store,
    [storeSettings.store]
  );
  const configuredStoreRecord = useMemo(
    () =>
      stores.find(
        (entry) => entry.name.trim().toLowerCase() === storeSettings.store.trim().toLowerCase()
      ) ?? null,
    [storeSettings.store, stores]
  );
  const configuredStoreSubtitle = useMemo(
    () => [configuredStoreRecord?.address].filter(Boolean).join(" · "),
    [configuredStoreRecord?.address]
  );
  const isGlobalView = currentView === "admin" || currentView === "users";
  const heroBrandTitle = isGlobalView ? "F1 Auto Details" : configuredStoreLabel;
  const heroBrandSubtitle = isGlobalView
    ? t("Global access", "Acceso global")
    : configuredStoreSubtitle;
  const heroBrandLogoKey = isGlobalView ? "" : configuredStoreRecord?.logoKey ?? "";

  const handleStoreSettingsSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedStoreName = storeSettingsForm.store.trim();

    if (!normalizedStoreName) {
      setFeedback(t("Location name is required.", "El nombre de la ubicacion es obligatorio."));
      return;
    }

    const storeExists = stores.some(
      (entry) => entry.name.trim().toLowerCase() === normalizedStoreName.toLowerCase()
    );

    if (!storeExists) {
      setFeedback(
        t(
          "Select an existing store for this computer.",
          "Selecciona una store existente para esta computadora."
        )
      );
      return;
    }

    const nextSettings: DeviceStoreSettings = {
      isConfigured: true,
      store: normalizedStoreName,
    };

    setStoreSettings(nextSettings);
    setActiveStore(nextSettings.store);
    setReportStore(nextSettings.store);
    setVehicleForm((current) => ({ ...current, store: nextSettings.store }));
    setAttendanceForm((current) => ({ ...current, store: nextSettings.store }));
    setIsStoreSettingsOpen(false);
    setFeedback(
      t(
        "Location configuration saved.",
        "La configuracion de la ubicacion se guardo."
      )
    );
  };

  const setDefaultStore = (store: StoreName) => {
    const normalizedStoreName = store.trim();

    if (!normalizedStoreName) {
      setFeedback(t("Location name is required.", "El nombre de la ubicacion es obligatorio."));
      return;
    }

    const storeExists = stores.some(
      (entry) => entry.name.trim().toLowerCase() === normalizedStoreName.toLowerCase()
    );

    if (!storeExists) {
      setFeedback(
        t(
          "Select an existing store for this computer.",
          "Selecciona una store existente para esta computadora."
        )
      );
      return;
    }

    const nextSettings: DeviceStoreSettings = {
      isConfigured: true,
      store: normalizedStoreName,
    };

    setStoreSettings(nextSettings);
    setStoreSettingsForm(nextSettings);
    setActiveStore(nextSettings.store);
    setReportStore(nextSettings.store);
    setVehicleForm((current) => ({ ...current, store: nextSettings.store }));
    setAttendanceForm((current) => ({ ...current, store: nextSettings.store }));
    setIsStoreSettingsOpen(false);
    setFeedback(
      t(
        `${normalizedStoreName} is now the default store on this computer.`,
        `${normalizedStoreName} ahora es la store predeterminada en esta computadora.`
      )
    );
  };

  const handleStoreSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = storeForm.name.trim();
    if (!normalizedName) {
      setFeedback(t("Store name is required.", "El nombre de la store es obligatorio."));
      return;
    }

    const duplicate = stores.some(
      (entry) =>
        entry.id !== editingStoreId &&
        entry.name.trim().toLowerCase() === normalizedName.toLowerCase()
    );

    if (duplicate) {
      setFeedback(t("That store already exists.", "Esa store ya existe."));
      return;
    }

    const existingStore = stores.find((entry) => entry.id === editingStoreId) ?? null;
    const nextStore: StoreEntry = {
      id: existingStore?.id ?? crypto.randomUUID(),
      name: normalizedName,
      address: storeForm.address.trim(),
      phone: storeForm.phone.trim(),
      logoKey: storeForm.logoKey.trim(),
      createdAt: existingStore?.createdAt ?? new Date().toISOString(),
    };

    setStores((current) => {
      const remaining = current.filter((entry) => entry.id !== nextStore.id);
      return [nextStore, ...remaining].sort((a, b) => a.name.localeCompare(b.name));
    });
    setStoreForm(createStoreForm());
    setEditingStoreId(null);
    setIsStoreModalOpen(false);
    setFeedback(
      t(
        existingStore ? "Store updated successfully." : "Store created successfully.",
        existingStore ? "Store actualizada correctamente." : "Store creada correctamente."
      )
    );
  };

  const handleDeleteStore = (adminPin: string) => {
    if (!deleteStoreTarget) return true;

    if (normalizeEmployeeCode(adminPin) !== normalizeEmployeeCode(currentUser?.employeeCode)) {
      setDeleteStoreFeedback(t("Invalid administrator PIN.", "PIN de administrador invalido."));
      return false;
    }

    const storeName = deleteStoreTarget.name.trim().toLowerCase();
    const isConfiguredStore = storeSettings.store.trim().toLowerCase() === storeName;
    const isInUse =
      users.some((entry) => entry.store.trim().toLowerCase() === storeName) ||
      vehicles.some((entry) => entry.store.trim().toLowerCase() === storeName) ||
      attendance.some((entry) => entry.store.trim().toLowerCase() === storeName) ||
      payrollClosures.some((entry) => entry.store.trim().toLowerCase() === storeName);

    if (isConfiguredStore || isInUse) {
      setDeleteStoreFeedback(
        t(
          "This store cannot be deleted because it is active on this computer or already has operational records.",
          "No puedes eliminar esta store porque esta activa en esta computadora o ya tiene registros operativos."
        )
      );
      return false;
    }

    setStores((current) => current.filter((entry) => entry.id !== deleteStoreTarget.id));
    setDeleteStoreFeedback(null);
    setDeleteStoreTarget(null);
    setFeedback(t("Store deleted successfully.", "Store eliminada correctamente."));
    return true;
  };

  const openCreateUserModal = () => {
    setEditingUserId(null);
    setUserForm(createUserForm(activeStore));
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: UserEntry) => {
    setEditingUserId(user.id);
    setUserForm({
      fullName: user.fullName,
      email: user.email,
      password: "",
      employeeCode: user.employeeCode,
      store: user.store,
      jobTitle: user.jobTitle,
      role: user.role,
    });
    setIsUserModalOpen(true);
  };

  if (!isHydrated) {
    return (
      <main className="min-h-screen bg-stone-950 text-stone-100">
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-10 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
              {t("Loading data", "Cargando datos")}
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-white">
              {t("Preparing workspace...", "Preparando espacio de trabajo...")}
            </h1>
          </div>
        </div>
      </main>
    );
  }

  if (hydrationError) {
    return (
      <main className="min-h-screen bg-stone-950 text-stone-100">
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6">
          <div className="max-w-xl rounded-3xl border border-red-400/30 bg-red-500/10 px-8 py-10 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-red-200">
              {t("Data error", "Error de datos")}
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-white">
              {t("The app could not load Supabase data.", "La app no pudo cargar los datos de Supabase.")}
            </h1>
            <p className="mt-3 text-sm text-red-100">{hydrationError}</p>
            <p className="mt-4 text-sm text-red-100">
              {t(
                "Check your .env values, database tables, and restart the dev server.",
                "Revisa tu .env, las tablas de la base y reinicia el servidor local."
              )}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    if (isPublicTimeControlMode) {
      return (
        <main className="min-h-screen bg-stone-950 text-stone-100">
          <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <section className="hero-panel">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl space-y-4">
                  <LocationBrand
                    title={configuredStoreLabel}
                    subtitle={configuredStoreSubtitle}
                    logoKey={configuredStoreRecord?.logoKey ?? ""}
                  />
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-stone-200">
                    <Clock3 className="h-4 w-4" />
                    {t("Public time control", "Control de tiempo publico")}
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                      {t("Touch the code to clock in.", "Toca el codigo para marcar entrada.")}
                    </h1>
                    <p className="max-w-2xl text-sm leading-6 text-stone-300 sm:text-base">
                      {t(
                        "Employees can clock in and out here without opening an admin session.",
                        "Los empleados pueden marcar entrada y salida aqui sin abrir una sesion administrativa."
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/20 bg-white text-stone-950 hover:bg-stone-200"
                    onClick={() => {
                      setIsPublicTimeControlMode(false);
                      setAttendanceForm(createAttendanceForm(activeStore));
                      setFeedback(null);
                    }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("Back to sign in", "Volver al ingreso")}
                  </Button>
                  <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
                    <button
                      type="button"
                      onClick={() => setLanguage("en")}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        language === "en" ? "bg-white text-stone-950" : "text-stone-300"
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage("es")}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        language === "es" ? "bg-white text-stone-950" : "text-stone-300"
                      }`}
                    >
                      Espanol
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {storeSettings.isConfigured ? (
              <section className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
                  {t("Configured location", "Ubicacion configurada")}
                </p>
                <p className="mt-2 text-xl font-semibold text-white">{configuredStoreLabel}</p>
                <p className="mt-1 text-sm text-stone-300">{storeSettings.store}</p>
              </section>
            ) : (
              <section className="grid gap-3 md:grid-cols-5">
                {availableLocations.map((store) => (
                  <button
                    key={store}
                    type="button"
                    onClick={() => {
                      setActiveStore(store);
                      setAttendanceForm(createAttendanceForm(store));
                    }}
                    className={`store-tile ${activeStore === store ? "store-tile-active" : ""}`}
                  >
                    <span className="text-xs uppercase tracking-[0.2em] text-stone-400">
                      {t("Location", "Ubicacion")}
                    </span>
                    <strong className="text-lg font-semibold text-white">{store}</strong>
                  </button>
                ))}
              </section>
            )}

            {feedback ? (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {feedback}
              </div>
            ) : null}

            <TimeView
              activeShifts={activeShifts}
              activeStore={activeStore}
              attendanceByStore={attendanceByStore}
              attendanceForm={attendanceForm}
              language={language}
              onClockIn={handleClockIn}
              onOpenClockOutModal={openClockOutModal}
              selectedEmployee={selectedEmployee}
              setAttendanceForm={setAttendanceForm}
              t={t}
            />

            <ClockOutDialog
              clockOutCodeInput={clockOutCodeInput}
              clockOutTarget={clockOutTarget}
              onCodeInputChange={setClockOutCodeInput}
              onClose={() => {
                setClockOutTarget(null);
                setClockOutCodeInput("");
              }}
              onOpenChange={(open) => {
                if (!open) {
                  setClockOutTarget(null);
                  setClockOutCodeInput("");
                }
              }}
              onSubmit={handleClockOutSubmit}
              t={t}
            />
          </div>
        </main>
      );
    }

    return (
      <LoginScreen
        configuredLocationLabel={configuredStoreLabel}
        configuredLocationLogoKey={configuredStoreRecord?.logoKey ?? ""}
        configuredLocationSubtitle={configuredStoreSubtitle}
        feedback={feedback}
        isPasswordRecoveryMode={isPasswordRecoveryMode}
        isPasswordResetRequestMode={isPasswordResetRequestMode}
        isSupabaseAuthEnabled={isSupabaseAuthEnabled}
        loginForm={loginForm}
        onForgotPasswordClick={() => {
          setPasswordResetForm((current) => ({
            ...current,
            email: loginForm.email,
            password: "",
            confirmPassword: "",
          }));
          setIsPasswordResetRequestMode(true);
          setIsPasswordRecoveryMode(false);
          setFeedback(null);
        }}
        onLoginFormChange={setLoginForm}
        onLoginSubmit={handleLoginSubmit}
        onOpenTimeControl={() => {
          setIsPublicTimeControlMode(true);
          setCurrentView("time");
          setAttendanceForm(createAttendanceForm(activeStore));
          setFeedback(null);
        }}
        onPasswordRecoveryCancel={() => {
          setIsPasswordRecoveryMode(false);
          setIsPasswordResetRequestMode(false);
          setPasswordResetForm(createPasswordResetForm());
          setFeedback(null);
        }}
        onPasswordRecoverySubmit={handlePasswordUpdate}
        onPasswordResetFormChange={setPasswordResetForm}
        onPasswordResetRequestSubmit={handlePasswordResetRequest}
        passwordResetForm={passwordResetForm}
        t={t}
        totalOpenShifts={totalOpenShifts}
        totalVehicles={totalVehicles}
        users={users}
      />
    );
  }

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(180,147,78,0.16),transparent_28%),linear-gradient(120deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-6 py-4 shadow-[0_30px_100px_rgba(0,0,0,0.32)]">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-3">
              <LocationBrand
                title={heroBrandTitle}
                subtitle={heroBrandSubtitle}
                logoKey={heroBrandLogoKey}
                compact
              />
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-300/8 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-200">
                <Building2 className="h-4 w-4" />
                {t("F1 Auto Details Control Center", "Centro de control F1 Auto Details")}
              </div>
              <div className="space-y-2">
                <h1 className="max-w-3xl text-[1.25rem] font-semibold leading-[1.02] tracking-[-0.025em] text-white sm:text-[1.45rem] xl:text-[1.7rem]">
                  {currentView === "home"
                    ? t("Main operations panel.", "Panel principal de operaciones.")
                    : currentView === "vehicles"
                      ? t("Vehicle intake and tracking.", "Ingreso y seguimiento de vehiculos.")
                      : currentView === "time"
                        ? t("Time control and attendance.", "Control de tiempo y asistencia.")
                        : currentView === "users"
                          ? t("User control and activity.", "Control de usuarios y actividad.")
                        : t("Multi-store admin view.", "Vista administrativa multisucursal.")}
                </h1>
                <p className="max-w-2xl text-[15px] leading-6 text-stone-300">
                  {currentView === "home"
                    ? t(
                        "From here you can open vehicle intake, time control, or the admin view with access to every store.",
                        "Desde aqui puedes entrar al flujo de vehiculos, al control de tiempo o a la vista administrativa con acceso a todas las tiendas."
                      )
                    : currentView === "vehicles"
                      ? t(
                          "Register vehicles, manage status, and review volume by brand in the active store.",
                          "Registra vehiculos, controla su estado y revisa el volumen por marca en la tienda activa."
                        )
                    : currentView === "time"
                        ? t(
                            "Manage employees, clock-ins, clock-outs, and daily attendance from a focused view.",
                            "Gestiona empleados, entradas, salidas y asistencia diaria desde una vista enfocada."
                          )
                        : currentView === "users"
                          ? t(
                              "Review system users, open shifts, worked hours, and access status from a dedicated control page.",
                              "Revisa usuarios del sistema, turnos abiertos, horas trabajadas y estado de acceso desde una pagina dedicada."
                            )
                        : t(
                            "Review all locations at once with operating metrics, active staff, and today sales.",
                            "Consulta todas las ubicaciones al mismo tiempo con indicadores operativos, personal activo y ventas del dia."
                          )}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:self-stretch">
              {(() => {
                const isGlobalOverview = currentView === "admin" || currentView === "users";
                return (
                  <>
              <StatCard
                icon={<CarFront className="h-5 w-5" />}
                label={
                  isGlobalOverview
                    ? t("Pending in period", "Pendientes del periodo")
                    : t("Pending vehicles", "Vehiculos pendientes")
                }
                value={String(isGlobalOverview ? globalPeriodPendingVehicles : pendingVehicles)}
                detail={
                  isGlobalOverview
                    ? t(
                        `${salesPeriodLabel} · ${availableLocations.length} locations`,
                        `${salesPeriodLabel} · ${availableLocations.length} ubicaciones`
                      )
                    : t("Vehicles still in progress today", "Vehiculos aun en proceso hoy")
                }
              />
              <StatCard
                icon={<LayoutDashboard className="h-5 w-5" />}
                label={
                  isGlobalOverview
                    ? t("Completed in period", "Terminados del periodo")
                    : t("Completed vehicles", "Vehiculos terminados")
                }
                value={String(isGlobalOverview ? globalPeriodCompletedVehicles : completedVehicles)}
                detail={
                  isGlobalOverview
                    ? t("Completed across all locations", "Terminados en todas las ubicaciones")
                    : t("Vehicles marked complete", "Vehiculos marcados como completos")
                }
              />
              <StatCard
                icon={<Users className="h-5 w-5" />}
                label={
                  isGlobalOverview
                    ? t("Active staff", "Personal activo")
                    : t("Active employees", "Empleados activos")
                }
                value={String(isGlobalOverview ? totalOpenShifts : activeShifts.length)}
                detail={
                  isGlobalOverview
                    ? t(
                        `${totalEmployees} registered employees`,
                        `${totalEmployees} empleados registrados`
                      )
                    : t(
                        "Employees currently clocked in",
                        "Empleados con turno abierto"
                      )
                }
              />
              <StatCard
                icon={<Clock3 className="h-5 w-5" />}
                label={
                  isGlobalOverview
                    ? t("Sales in period", "Ventas del periodo")
                    : t("Sales today", "Ventas hoy")
                }
                value={formatCurrency(
                  isGlobalOverview
                    ? globalPeriodSales
                    : todaySales
                )}
                detail={
                  isGlobalOverview
                    ? t("Combined across all locations", "Consolidado de todas las ubicaciones")
                    : t("Revenue captured for today", "Facturacion registrada para hoy")
                }
              />
                  </>
                );
              })()}
            </div>
          </div>
        </section>

        <section className="flex justify-end">
          <div className="flex flex-wrap items-center justify-end gap-3 rounded-[26px] border border-white/10 bg-white/[0.03] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-stone-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              {currentUser.fullName} · {currentUser.role === "admin" ? t("Administrator", "Administrador") : t("Operator", "Operador")}
            </div>
            <Button type="button" variant="secondary" className="rounded-full border border-white/10 bg-white/90 text-stone-900 hover:bg-white" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("Sign out", "Cerrar sesion")}
            </Button>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <button
                type="button"
                onClick={() => setLanguage("en")}
              className={`rounded-full px-4 py-2 text-sm transition ${
                language === "en" ? "bg-white text-stone-950 shadow-sm" : "text-stone-300"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage("es")}
              className={`rounded-full px-4 py-2 text-sm transition ${
                language === "es" ? "bg-white text-stone-950 shadow-sm" : "text-stone-300"
              }`}
            >
              Espanol
            </button>
            </div>
          </div>
        </section>

        {currentView === "home" ? (
          <section className={`grid gap-4 ${currentUser.role === "admin" ? "sm:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-3"}`}>
            <HomeCard
              icon={<CarFront className="h-6 w-6" />}
              title={t("Vehicle intake", "Ingreso de vehiculos")}
              description={t(
                "Intake form, status tracking, and brand filters.",
                "Formulario de captura, estado operativo y filtros por marca."
              )}
              onClick={() => setCurrentView("vehicles")}
            />
            <HomeCard
              icon={<Clock3 className="h-6 w-6" />}
              title={t("Time control", "Control de tiempo")}
              description={t(
                "Clock-in, clock-out, and employee registration by code.",
                "Entrada, salida y registro de empleados por codigo."
              )}
              onClick={() => setCurrentView("time")}
            />
            <HomeCard
              icon={<Shield className="h-6 w-6" />}
              title={t("Administrator", "Administrador")}
              description={t(
                "Global view with access to all locations and operating summary.",
                "Vista global con acceso a todas las ubicaciones y resumen operativo."
              )}
              onClick={() => setCurrentView("admin")}
              disabled={currentUser.role !== "admin"}
            />
            {currentUser.role === "admin" ? (
              <HomeCard
                icon={<Users className="h-6 w-6" />}
                title={t("User control", "Control de usuarios")}
                description={t(
                  "Review users, work hours, access status, and account actions from one page.",
                  "Revisa usuarios, horas trabajadas, estado de acceso y acciones de cuenta desde una sola pagina."
                )}
                onClick={() => setCurrentView("users")}
              />
            ) : null}
          </section>
        ) : (
          <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-white/20 bg-white px-4 text-sm text-stone-950 hover:bg-stone-200"
                onClick={() => setCurrentView("home")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("Back to dashboard", "Volver al panel")}
              </Button>
              <Button
                type="button"
                variant={currentView === "vehicles" ? "default" : "secondary"}
                className="h-10 rounded-xl px-4 text-sm"
                onClick={() => setCurrentView("vehicles")}
              >
                <CarFront className="mr-2 h-4 w-4" />
                {t("Vehicles", "Vehiculos")}
              </Button>
              <Button
                type="button"
                variant={currentView === "time" ? "default" : "secondary"}
                className="h-10 rounded-xl px-4 text-sm"
                onClick={() => setCurrentView("time")}
              >
                <Clock3 className="mr-2 h-4 w-4" />
                {t("Time", "Tiempo")}
              </Button>
              {currentUser.role === "admin" ? (
                <Button
                  type="button"
                  variant={currentView === "users" ? "default" : "secondary"}
                  className="h-10 rounded-xl px-4 text-sm"
                  onClick={() => setCurrentView("users")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {t("Users", "Usuarios")}
                </Button>
              ) : null}
              {currentUser.role === "admin" ? (
                <Button
                  type="button"
                  variant={currentView === "admin" ? "default" : "secondary"}
                  className="h-10 rounded-xl px-4 text-sm"
                  onClick={() => setCurrentView("admin")}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {t("Admin", "Administrador")}
                </Button>
              ) : null}
            </div>

            {currentView !== "admin" && currentView !== "users" ? (
              <Badge variant="secondary" className="self-start lg:self-auto">
                {t("Active location", "Ubicacion activa")}: {activeStore}
              </Badge>
            ) : (
              <Badge variant="secondary" className="self-start lg:self-auto">
                {t("Global access", "Acceso global")}
              </Badge>
            )}
          </section>
        )}

        {currentView !== "home" && currentView !== "admin" && currentView !== "users" && currentView !== "vehicles" && currentView !== "time" ? (
          storeSettings.isConfigured ? (
            <section className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
                {t("Configured location", "Ubicacion configurada")}
              </p>
              <p className="mt-2 text-xl font-semibold text-white">{configuredStoreLabel}</p>
              <p className="mt-1 text-sm text-stone-300">{storeSettings.store}</p>
            </section>
          ) : (
          <section className="grid gap-3 md:grid-cols-5">
            {availableLocations.map((store) => (
              <button
                key={store}
                type="button"
                onClick={() => setActiveStore(store)}
                className={`store-tile ${activeStore === store ? "store-tile-active" : ""}`}
              >
                <span className="text-xs uppercase tracking-[0.2em] text-stone-400">
                  {t("Location", "Ubicacion")}
                </span>
                <strong className="text-lg font-semibold text-white">{store}</strong>
              </button>
            ))}
          </section>
          )
        ) : null}

        {feedback ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {feedback}
          </div>
        ) : null}

        {currentView === "vehicles" ? (
        <VehicleView
          activeStore={activeStore}
          areVehicleFiltersVisible={areVehicleFiltersVisible}
          availableMakes={availableMakes}
          availableLocations={availableLocations}
          availableSalesPeople={availableSalesPeople}
            currentUser={currentUser}
            filteredVehicles={filteredVehicles}
            language={language}
            makeFilter={makeFilter}
            onSubmit={handleVehicleSubmit}
            setAreVehicleFiltersVisible={setAreVehicleFiltersVisible}
            setMakeFilter={setMakeFilter}
            setVehicleFilters={setVehicleFilters}
            setVehicleForm={setVehicleForm}
            t={t}
          todaySales={todaySales}
          deleteVehicleEntry={deleteVehicleEntry}
          updateVehicleDeliveredTime={updateVehicleDeliveredTime}
          updateVehicleEntry={updateVehicleEntry}
          updateVehicleStatus={updateVehicleStatus}
          vehicleFilters={vehicleFilters}
          vehicleForm={vehicleForm}
          vehicleRecords={currentUser.role === "admin" ? vehicles : vehiclesByStore}
        />
        ) : null}

        {currentView === "time" ? (
          <TimeView
            activeShifts={activeShifts}
            activeStore={activeStore}
            attendanceByStore={attendanceByStore}
            attendanceForm={attendanceForm}
            language={language}
            onClockIn={handleClockIn}
            onOpenClockOutModal={openClockOutModal}
            selectedEmployee={selectedEmployee}
            setAttendanceForm={setAttendanceForm}
            t={t}
          />
        ) : null}

        {currentView === "users" ? (
          <UserView
            attendance={attendance}
            availableLocations={availableLocations}
            currentUserId={currentUser.id}
            language={language}
            onCreateUser={openCreateUserModal}
            onEditUser={openEditUserModal}
            onSaveAttendanceCorrection={handleAdminAttendanceCorrection}
            onRequestBlockToggle={(user) => {
              setBlockUserTarget(user);
              setBlockUserPin("");
            }}
            onRequestDelete={(user) => {
              setDeleteUserTarget(user);
              setDeleteUserPin("");
            }}
            t={t}
            userPayrollData={userPayrollData}
            userSummaries={userWorkSummaries}
            users={users}
          />
        ) : null}

        {currentView === "admin" ? (
        <AdminView
          adminStoreStats={adminStoreStats}
          deleteStoreFeedback={deleteStoreFeedback}
          deleteStoreTarget={deleteStoreTarget}
          editingStoreId={editingStoreId}
          isStoreModalOpen={isStoreModalOpen}
          isStoreSettingsOpen={isStoreSettingsOpen}
          language={language}
          onDeleteStore={handleDeleteStore}
          onJumpToStore={(store) => {
            setActiveStore(store);
            setCurrentView("vehicles");
          }}
          onResetDemoData={resetDemoData}
          onExportDailyBillingCsv={exportDailyBillingCsv}
          onPrintDailyBilling={handlePrintDailyBilling}
          onSendReportPreview={handleSendReportPreview}
          onSalesCustomEndChange={setSalesCustomEnd}
          onSalesCustomStartChange={setSalesCustomStart}
          onSalesPeriodChange={setSalesPeriod}
          onStoreSettingsOpenChange={(open) => {
            setIsStoreSettingsOpen(open);
            if (open) {
              setStoreSettingsForm(storeSettings);
            }
          }}
          onSetDefaultStore={setDefaultStore}
          onStoreSettingsSubmit={handleStoreSettingsSubmit}
          onStoreSubmit={handleStoreSubmit}
          salesCustomEnd={salesCustomEnd}
          salesCustomStart={salesCustomStart}
          salesPeriod={salesPeriod}
          salesPeriodLabel={salesPeriodLabel}
          storeReportMap={storeReportMap}
          setDeleteStoreFeedback={setDeleteStoreFeedback}
          setDeleteStoreTarget={setDeleteStoreTarget}
          setEditingStoreId={setEditingStoreId}
          setIsStoreModalOpen={setIsStoreModalOpen}
          setStoreSettingsForm={setStoreSettingsForm}
          setStoreForm={setStoreForm}
          storeSettings={storeSettings}
          storeSettingsForm={storeSettingsForm}
          stores={stores}
          storeForm={storeForm}
          t={t}
        />
        ) : null}
      </div>

      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-3xl rounded-3xl border-white/10 bg-stone-950 p-6 text-stone-100">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingUserId ? t("Edit user", "Editar usuario") : t("User registration", "Registro de usuarios")}
            </DialogTitle>
            <DialogDescription className="text-stone-400">
              {editingUserId
                ? t(
                    "Update the selected user's profile, access role, clock-in code, and optionally set a new password.",
                    "Actualiza el perfil, el rol, el codigo de clock-in y, si quieres, una nueva contrasena del usuario seleccionado."
                  )
                : t(
                    "Create operator or admin accounts with their clock-in code.",
                    "Crea cuentas de operador o administrador con su codigo de clock-in."
                  )}
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleUserSubmit}>
            <Field label={t("Full name", "Nombre completo")}>
              <Input
                value={userForm.fullName}
                onChange={(event) =>
                  setUserForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                required
              />
            </Field>

            <Field label={t("Job title", "Cargo")}>
              <Input
                value={userForm.jobTitle}
                onChange={(event) =>
                  setUserForm((current) => ({
                    ...current,
                    jobTitle: event.target.value,
                  }))
                }
                placeholder={t("Washer, supervisor...", "Lavador, supervisor...")}
                required
              />
            </Field>

            <Field label={t("Email", "Correo")}>
              <Input
                type="email"
                value={userForm.email}
                onChange={(event) =>
                  setUserForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="operator@example.com"
                required
              />
            </Field>

            {!editingUserId ? (
              <Field label={t("Password", "Contrasena")}>
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(event) =>
                    setUserForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  required
                />
              </Field>
            ) : (
              <Field label={t("New password (optional)", "Nueva contrasena (opcional)")}>
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(event) =>
                    setUserForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder={t(
                    "Leave blank to keep the current password",
                    "Dejala vacia para mantener la contrasena actual"
                  )}
                />
              </Field>
            )}

            <Field label={t("Clock-in code", "Codigo de clock-in")}>
              <Input
                value={userForm.employeeCode}
                onChange={(event) =>
                  setUserForm((current) => ({
                    ...current,
                    employeeCode: event.target.value.replace(/\D/g, "").slice(0, 4),
                  }))
                }
                inputMode="numeric"
                maxLength={4}
                placeholder="1234"
                required
              />
            </Field>

            <Field label={t("Access role", "Rol de acceso")} className="md:col-span-2">
              <Select
                value={userForm.role}
                onChange={(event) =>
                  setUserForm((current) => ({
                    ...current,
                    role: event.target.value as UserRole,
                  }))
                }
              >
                <option value="operator">{t("Operator", "Usuario")}</option>
                <option value="admin">{t("Administrator", "Administrador")}</option>
              </Select>
            </Field>

            <div className="md:col-span-2 flex flex-wrap gap-3">
              <Button type="submit">
                {editingUserId ? t("Update user", "Actualizar usuario") : t("Save user", "Guardar usuario")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingUserId(null);
                  setUserForm(createUserForm(activeStore));
                }}
              >
                {t("Clear", "Limpiar")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(blockUserTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setBlockUserTarget(null);
            setBlockUserPin("");
          }
        }}
      >
        <DialogContent className="max-w-md rounded-3xl border-white/10 bg-stone-950 p-6 text-stone-100">
          <DialogHeader>
            <DialogTitle className="text-white">
              {blockUserTarget?.isBlocked
                ? t("Confirm user unlock", "Confirmar desbloqueo de usuario")
                : t("Confirm user block", "Confirmar bloqueo de usuario")}
            </DialogTitle>
            <DialogDescription className="text-stone-400">
              {blockUserTarget
                ? blockUserTarget.isBlocked
                  ? t(
                      `Enter the administrator PIN to unblock ${blockUserTarget.fullName}.`,
                      `Ingresa el PIN del administrador para desbloquear a ${blockUserTarget.fullName}.`
                    )
                  : t(
                      `Enter the administrator PIN to block ${blockUserTarget.fullName}.`,
                      `Ingresa el PIN del administrador para bloquear a ${blockUserTarget.fullName}.`
                    )
                : t(
                    "Enter the administrator PIN to continue.",
                    "Ingresa el PIN del administrador para continuar."
                  )}
            </DialogDescription>
          </DialogHeader>

          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!blockUserTarget) return;
              const updated = await handleUserBlockToggle(blockUserTarget, blockUserPin);
              if (!updated) return;
              setBlockUserTarget(null);
              setBlockUserPin("");
            }}
          >
            <Field label={t("Administrator PIN", "PIN del administrador")}>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={blockUserPin}
                onChange={(event) => setBlockUserPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="1234"
                required
              />
            </Field>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setBlockUserTarget(null);
                  setBlockUserPin("");
                }}
              >
                {t("Cancel", "Cancelar")}
              </Button>
              <Button type="submit" variant={blockUserTarget?.isBlocked ? "secondary" : "destructive"}>
                {blockUserTarget?.isBlocked ? t("Unblock user", "Desbloquear usuario") : t("Block user", "Bloquear usuario")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteUserTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteUserTarget(null);
            setDeleteUserPin("");
          }
        }}
      >
        <DialogContent className="max-w-md rounded-3xl border-white/10 bg-stone-950 p-6 text-stone-100">
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("Confirm user deletion", "Confirmar eliminacion de usuario")}
            </DialogTitle>
            <DialogDescription className="text-stone-400">
              {deleteUserTarget
                ? t(
                    `Enter the administrator PIN to delete ${deleteUserTarget.fullName}.`,
                    `Ingresa el PIN del administrador para eliminar a ${deleteUserTarget.fullName}.`
                  )
                : t(
                    "Enter the administrator PIN to continue.",
                    "Ingresa el PIN del administrador para continuar."
                  )}
            </DialogDescription>
          </DialogHeader>

          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!deleteUserTarget) return;
              const deleted = await handleUserDelete(deleteUserTarget, deleteUserPin);
              if (!deleted) return;
              setDeleteUserTarget(null);
              setDeleteUserPin("");
            }}
          >
            <Field label={t("Administrator PIN", "PIN del administrador")}>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={deleteUserPin}
                onChange={(event) => setDeleteUserPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="1234"
                required
              />
            </Field>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDeleteUserTarget(null);
                  setDeleteUserPin("");
                }}
              >
                {t("Cancel", "Cancelar")}
              </Button>
              <Button type="submit" variant="destructive">
                {t("Delete user", "Eliminar usuario")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ClockOutDialog
        clockOutCodeInput={clockOutCodeInput}
        clockOutTarget={clockOutTarget}
        onClose={() => {
          setClockOutTarget(null);
          setClockOutCodeInput("");
        }}
        onCodeInputChange={setClockOutCodeInput}
        onOpenChange={(open) => {
          if (!open) {
            setClockOutTarget(null);
            setClockOutCodeInput("");
          }
        }}
        onSubmit={handleClockOutSubmit}
        t={t}
      />
    </main>
  );
}

export default App;
