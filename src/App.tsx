import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CarFront,
  Clock3,
  LayoutDashboard,
  LogIn,
  LogOut,
  Shield,
  TimerReset,
  Users,
} from "lucide-react";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { Label } from "./components/ui/label";
import { Select } from "./components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { Textarea } from "./components/ui/textarea";

const STORES = [
  "Tienda 1",
  "Tienda 2",
  "Tienda 3",
  "Tienda 4",
  "Tienda 5",
] as const;

const VEHICLE_STORAGE_KEY = "carwash-vehicles-v1";
const ATTENDANCE_STORAGE_KEY = "carwash-attendance-v1";
const EMPLOYEES_STORAGE_KEY = "carwash-employees-v1";
const USERS_STORAGE_KEY = "carwash-users-v1";

type StoreName = (typeof STORES)[number];
type VehicleStatus = "Pendiente" | "Completo";
type AppView = "home" | "vehicles" | "time" | "admin";
type Language = "en" | "es";
type UserRole = "admin" | "operator";
type VehicleHistoryAction = "created" | "status" | "delivery_time";

interface VehicleHistoryEvent {
  id: string;
  action: VehicleHistoryAction;
  timestamp: string;
  by: string;
  note: string;
}

interface VehicleEntry {
  id: string;
  date: string;
  store: StoreName;
  stock: string;
  make: string;
  model: string;
  vin: string;
  salesPerson: string;
  time: string;
  pickupTime: string;
  deliveredTime: string;
  simo: string;
  comments: string;
  price: number;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  history: VehicleHistoryEvent[];
}

interface AttendanceEntry {
  id: string;
  employeeCode: string;
  employeeName: string;
  role: string;
  store: StoreName;
  date: string;
  clockIn: string;
  clockOut: string | null;
  notes: string;
}

interface EmployeeEntry {
  id: string;
  employeeCode: string;
  employeeName: string;
  role: string;
  store: StoreName;
  active: boolean;
  createdAt: string;
}

interface UserEntry {
  id: string;
  fullName: string;
  username: string;
  password: string;
  employeeCode: string;
  store: StoreName;
  jobTitle: string;
  role: UserRole;
  createdAt: string;
}

interface VehicleFormState {
  store: StoreName;
  date: string;
  stock: string;
  make: string;
  model: string;
  vin: string;
  salesPerson: string;
  time: string;
  pickupTime: string;
  simo: string;
  comments: string;
  price: string;
}

interface AttendanceFormState {
  employeeCode: string;
  employeeName: string;
  role: string;
  store: StoreName;
  notes: string;
}

interface EmployeeFormState {
  employeeCode: string;
  employeeName: string;
  role: string;
  store: StoreName;
}

interface LoginFormState {
  username: string;
  password: string;
}

interface UserFormState {
  fullName: string;
  username: string;
  password: string;
  employeeCode: string;
  store: StoreName;
  jobTitle: string;
  role: UserRole;
}

interface VehicleFiltersState {
  search: string;
  date: string;
  status: "all" | VehicleStatus;
  salesPerson: string;
  store: "all" | StoreName;
}

const createVehicleForm = (store: StoreName): VehicleFormState => ({
  store,
  date: getTodayDate(),
  stock: "",
  make: "",
  model: "",
  vin: "",
  salesPerson: "",
  time: getCurrentTime(),
  pickupTime: "",
  simo: "",
  comments: "",
  price: "",
});

const createAttendanceForm = (store: StoreName): AttendanceFormState => ({
  employeeCode: "",
  employeeName: "",
  role: "",
  store,
  notes: "",
});

const createEmployeeForm = (store: StoreName): EmployeeFormState => ({
  employeeCode: "",
  employeeName: "",
  role: "",
  store,
});

const createLoginForm = (): LoginFormState => ({
  username: "",
  password: "",
});

const createUserForm = (): UserFormState => ({
  fullName: "",
  username: "",
  password: "",
  employeeCode: "",
  store: STORES[0],
  jobTitle: "",
  role: "operator",
});

const createVehicleFilters = (): VehicleFiltersState => ({
  search: "",
  date: "",
  status: "all",
  salesPerson: "",
  store: "all",
});

const DEFAULT_ADMIN_USER: UserEntry = {
  id: "default-admin",
  fullName: "System Administrator",
  username: "admin",
  password: "admin123",
  employeeCode: "ADMIN-001",
  store: STORES[0],
  jobTitle: "Administrator",
  role: "admin",
  createdAt: new Date().toISOString(),
};

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

const formatDuration = (clockIn: string, clockOut: string | null, language: Language) => {
  if (!clockOut) return language === "es" ? "Turno abierto" : "Open shift";

  const start = parseTime(clockIn);
  const end = parseTime(clockOut);

  if (!start || !end || end < start) return language === "es" ? "Sin calcular" : "Not calculated";

  const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

function App() {
  const [language, setLanguage] = useState<Language>("en");
  const [currentView, setCurrentView] = useState<AppView>("home");
  const [activeStore, setActiveStore] = useState<StoreName>(STORES[0]);
  const [reportStore, setReportStore] = useState<StoreName>(STORES[0]);
  const [makeFilter, setMakeFilter] = useState("Todas");
  const [vehicleFilters, setVehicleFilters] = useState<VehicleFiltersState>(() =>
    createVehicleFilters()
  );
  const [areVehicleFiltersVisible, setAreVehicleFiltersVisible] = useState(false);
  const [vehicleForm, setVehicleForm] = useState<VehicleFormState>(() =>
    createVehicleForm(STORES[0])
  );
  const [attendanceForm, setAttendanceForm] = useState<AttendanceFormState>(() =>
    createAttendanceForm(STORES[0])
  );
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormState>(() =>
    createEmployeeForm(STORES[0])
  );
  const [loginForm, setLoginForm] = useState<LoginFormState>(() => createLoginForm());
  const [userForm, setUserForm] = useState<UserFormState>(() => createUserForm());
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [clockOutTarget, setClockOutTarget] = useState<AttendanceEntry | null>(null);
  const [clockOutCodeInput, setClockOutCodeInput] = useState("");
  const [vehicles, setVehicles] = useState<VehicleEntry[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [employees, setEmployees] = useState<EmployeeEntry[]>([]);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<UserEntry | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const t = (en: string, es: string) => (language === "es" ? es : en);

  useEffect(() => {
    const storedVehicles = localStorage.getItem(VEHICLE_STORAGE_KEY);
    const storedAttendance = localStorage.getItem(ATTENDANCE_STORAGE_KEY);

    if (storedVehicles) {
      const parsedVehicles = JSON.parse(storedVehicles) as VehicleEntry[];
      setVehicles(
        parsedVehicles.map((entry) => {
          const createdAt = entry.createdAt ?? new Date().toISOString();
          const updatedAt = entry.updatedAt ?? createdAt;
          const updatedBy = entry.updatedBy ?? "System";
          const deliveredTime = entry.deliveredTime ?? "";
          const history =
            entry.history?.length
              ? entry.history
              : [
                  {
                    id: crypto.randomUUID(),
                    action: "created" as VehicleHistoryAction,
                    timestamp: createdAt,
                    by: updatedBy,
                    note: "Vehicle record created.",
                  },
                ];

          return {
            ...entry,
            pickupTime: entry.pickupTime ?? "",
            deliveredTime,
            updatedAt,
            updatedBy,
            history,
          };
        })
      );
    }

    if (storedAttendance) {
      const parsedAttendance = JSON.parse(storedAttendance) as AttendanceEntry[];
      setAttendance(
        parsedAttendance.map((entry) => ({
          ...entry,
          employeeCode: normalizeEmployeeCode(entry.employeeCode),
        }))
      );
    }

    const storedEmployees = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (storedEmployees) {
      const parsedEmployees = JSON.parse(storedEmployees) as EmployeeEntry[];
      setEmployees(
        parsedEmployees.map((entry) => ({
          ...entry,
          employeeCode: normalizeEmployeeCode(entry.employeeCode),
          active: entry.active ?? true,
        }))
      );
    }

    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
      const parsedUsers = JSON.parse(storedUsers) as UserEntry[];
      setUsers(
        parsedUsers.map((entry) => ({
          ...entry,
          employeeCode: normalizeEmployeeCode(entry.employeeCode),
          store: entry.store ?? STORES[0],
          jobTitle: entry.jobTitle ?? (entry.role === "admin" ? "Administrator" : "Operator"),
        }))
      );
    } else {
      setUsers([DEFAULT_ADMIN_USER]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    if (!users.length) return;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    setVehicleForm((current) => ({ ...current, store: activeStore }));
    setAttendanceForm((current) => ({ ...current, store: activeStore }));
    setEmployeeForm((current) => ({ ...current, store: activeStore }));
    setReportStore(activeStore);
  }, [activeStore]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (currentUser?.role === "admin") return;
    if (currentView !== "admin") return;
    setCurrentView("home");
  }, [currentUser, currentView]);

  const vehiclesByStore = useMemo(
    () => vehicles.filter((entry) => entry.store === activeStore),
    [vehicles, activeStore]
  );

  const scopedVehicleRecords = useMemo(() => {
    if (currentUser?.role !== "admin") {
      return vehicles.filter((entry) => entry.store === currentUser?.store);
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

    if (makeFilter !== "Todas") {
      result = result.filter((entry) => entry.make === makeFilter);
    }

    if (vehicleFilters.date) {
      result = result.filter((entry) => entry.date === vehicleFilters.date);
    }

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

  const usersByStore = useMemo(
    () => users.filter((entry) => entry.store === activeStore),
    [users, activeStore]
  );

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
      vehiclesByStore.filter((entry) => entry.status === "Completo").length,
    [vehiclesByStore]
  );

  const totalVehicles = vehicles.length;
  const totalCompletedVehicles = vehicles.filter(
    (entry) => entry.status === "Completo"
  ).length;
  const totalOpenShifts = attendance.filter((entry) => !entry.clockOut).length;
  const totalEmployees = users.length;

  const adminStoreStats = useMemo(
    () =>
      STORES.map((store) => {
        const storeVehicles = vehicles.filter((entry) => entry.store === store);
        const storeAttendance = attendance.filter((entry) => entry.store === store);
        const storeEmployees = users.filter((entry) => entry.store === store);
        const openShifts = storeAttendance.filter((entry) => !entry.clockOut).length;
        const pending = storeVehicles.filter((entry) => entry.status === "Pendiente").length;
        const salesToday = storeVehicles
          .filter((entry) => entry.date === getTodayDate())
          .reduce((total, entry) => total + entry.price, 0);

        return {
          store,
          vehicles: storeVehicles.length,
          employees: storeEmployees.length,
          openShifts,
          pending,
          salesToday,
        };
      }),
    [attendance, users, vehicles]
  );

  const reportVehicles = useMemo(
    () =>
      vehicles
        .filter((entry) => entry.store === reportStore && entry.date === getTodayDate())
        .sort((a, b) => a.time.localeCompare(b.time)),
    [reportStore, vehicles]
  );

  const reportTotal = useMemo(
    () => reportVehicles.reduce((sum, entry) => sum + entry.price, 0),
    [reportVehicles]
  );

  const reportCompleted = useMemo(
    () => reportVehicles.filter((entry) => entry.status === "Completo").length,
    [reportVehicles]
  );

  const handleVehicleSubmit = (event: FormEvent<HTMLFormElement>) => {
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
  };

  const handleEmployeeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const employeeCode = normalizeEmployeeCode(employeeForm.employeeCode);
    const employeeName = employeeForm.employeeName.trim();
    const role = employeeForm.role.trim();

    const duplicateEmployee = employees.some(
      (entry) =>
        normalizeEmployeeCode(entry.employeeCode) === employeeCode &&
        entry.store === employeeForm.store
    );

    if (duplicateEmployee) {
      setFeedback(t("That code already exists in this store.", "Ese codigo ya existe en esta tienda."));
      return;
    }

    const newEmployee: EmployeeEntry = {
      id: crypto.randomUUID(),
      employeeCode,
      employeeName,
      role,
      store: employeeForm.store,
      active: true,
      createdAt: new Date().toISOString(),
    };

    setEmployees((current) => [newEmployee, ...current]);
    setEmployeeForm(createEmployeeForm(activeStore));
    setIsEmployeeModalOpen(false);
    setFeedback(t("Employee registered successfully.", "Empleado registrado correctamente."));
  };

  const handleLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const username = loginForm.username.trim().toLowerCase();
    const password = loginForm.password;
    const user = users.find(
      (entry) => entry.username.toLowerCase() === username && entry.password === password
    );

    if (!user) {
      setFeedback(t("Invalid username or password.", "Usuario o contrasena invalidos."));
      return;
    }

    setCurrentUser(user);
    setActiveStore(user.store);
    setReportStore(user.store);
    setLoginForm(createLoginForm());
    setCurrentView("home");
    setFeedback(
      t(`Welcome back, ${user.fullName}.`, `Bienvenido de nuevo, ${user.fullName}.`)
    );
  };

  const handleUserSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const username = userForm.username.trim().toLowerCase();
    const duplicateUser = users.some(
      (entry) => entry.username.toLowerCase() === username
    );
    const duplicateClockInCode = users.some(
      (entry) =>
        normalizeEmployeeCode(entry.employeeCode) ===
          normalizeEmployeeCode(userForm.employeeCode) &&
        entry.store === userForm.store
    );

    if (duplicateUser) {
      setFeedback(t("That username already exists.", "Ese usuario ya existe."));
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

    const newUser: UserEntry = {
      id: crypto.randomUUID(),
      fullName: userForm.fullName.trim(),
      username,
      password: userForm.password,
      employeeCode: normalizeEmployeeCode(userForm.employeeCode),
      store: userForm.store,
      jobTitle: userForm.jobTitle.trim(),
      role: userForm.role,
      createdAt: new Date().toISOString(),
    };

    setUsers((current) => [newUser, ...current]);
    setUserForm(createUserForm());
    setIsUserModalOpen(false);
    setFeedback(
      t("User registered successfully.", "Usuario registrado correctamente.")
    );
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView("home");
    setFeedback(t("Session closed.", "Sesion cerrada."));
  };

  const handleClockIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const employeeCode = normalizeEmployeeCode(attendanceForm.employeeCode);
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
  };

  const updateVehicleStatus = (id: string, status: VehicleStatus) => {
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
  };

  const updateVehicleDeliveredTime = (id: string, deliveredTime: string) => {
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
  };

  const handleClockOut = (id: string) => {
    setAttendance((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, clockOut: getCurrentTime() } : entry
      )
    );
    setFeedback(t("Employee clock-out registered.", "Salida de empleado registrada."));
  };

  const openClockOutModal = (entry: AttendanceEntry) => {
    setClockOutTarget(entry);
    setClockOutCodeInput("");
  };

  const handleClockOutSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!clockOutTarget) {
      setFeedback(t("Select an employee before clocking out.", "Selecciona un empleado antes de marcar salida."));
      return;
    }

    if (
      normalizeEmployeeCode(clockOutCodeInput) !==
      normalizeEmployeeCode(clockOutTarget.employeeCode)
    ) {
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
  };

  const resetDemoData = () => {
    setVehicles([]);
    setAttendance([]);
    setEmployees([]);
    localStorage.removeItem(VEHICLE_STORAGE_KEY);
    localStorage.removeItem(ATTENDANCE_STORAGE_KEY);
    localStorage.removeItem(EMPLOYEES_STORAGE_KEY);
    setFeedback(t("Demo data reset.", "Datos reiniciados."));
  };

  const handleSendReportPreview = () => {
    setFeedback(
      t(
        `Daily report preview ready for ${reportStore}. Next step: connect email delivery.`,
        `Vista previa del informe diario lista para ${reportStore}. Siguiente paso: conectar el envio por correo.`
      )
    );
  };

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-stone-950 text-stone-100">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="hero-panel">
              <div className="space-y-5">
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

              <form className="grid gap-4" onSubmit={handleLoginSubmit}>
                <Field label={t("Username", "Usuario")}>
                  <Input
                    value={loginForm.username}
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                    placeholder={t("username", "usuario")}
                    required
                  />
                </Field>

                <Field label={t("Password", "Contrasena")}>
                  <Input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder={t("password", "contrasena")}
                    required
                  />
                </Field>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit">
                    <LogIn className="mr-2 h-4 w-4" />
                    {t("Sign in", "Iniciar sesion")}
                  </Button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-stone-300">
                  {t("Default admin credentials", "Credenciales admin por defecto")}: admin / admin123
                </div>
              </form>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <section className="hero-panel">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-stone-200">
                <Building2 className="h-4 w-4" />
                {t("F1 Auto Details Control Center", "Centro de control F1 Auto Details")}
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {currentView === "home"
                    ? t("Main operations panel.", "Panel principal de operaciones.")
                    : currentView === "vehicles"
                      ? t("Vehicle intake and tracking.", "Ingreso y seguimiento de vehiculos.")
                      : currentView === "time"
                        ? t("Time control and attendance.", "Control de tiempo y asistencia.")
                        : t("Multi-store admin view.", "Vista administrativa multisucursal.")}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-stone-300 sm:text-base">
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
                        : t(
                            "Review all stores at once with operating metrics, active staff, and today sales.",
                            "Consulta todas las tiendas al mismo tiempo con indicadores operativos, personal activo y ventas del dia."
                          )}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<CarFront className="h-5 w-5" />}
                label={t("Pending vehicles", "Vehiculos pendientes")}
                value={String(currentView === "admin" ? totalVehicles - totalCompletedVehicles : pendingVehicles)}
                detail={
                  currentView === "admin"
                    ? t(
                        `${STORES.length} stores monitored`,
                        `${STORES.length} tiendas monitoreadas`
                      )
                    : t("Vehicles still in progress today", "Vehiculos aun en proceso hoy")
                }
              />
              <StatCard
                icon={<LayoutDashboard className="h-5 w-5" />}
                label={t("Completed vehicles", "Vehiculos terminados")}
                value={String(currentView === "admin" ? totalCompletedVehicles : completedVehicles)}
                detail={
                  currentView === "admin"
                    ? t("Completed across all stores", "Terminados en todas las tiendas")
                    : t("Vehicles marked complete", "Vehiculos marcados como completos")
                }
              />
              <StatCard
                icon={<Users className="h-5 w-5" />}
                label={
                  currentView === "admin"
                    ? t("Active staff", "Personal activo")
                    : t("Active employees", "Empleados activos")
                }
                value={String(currentView === "admin" ? totalOpenShifts : activeShifts.length)}
                detail={
                  currentView === "admin"
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
                label={t("Sales today", "Ventas hoy")}
                value={formatCurrency(
                  currentView === "admin"
                    ? adminStoreStats.reduce((sum, item) => sum + item.salesToday, 0)
                    : todaySales
                )}
                detail={
                  currentView === "admin"
                    ? t("Combined across all stores", "Consolidado de todas las tiendas")
                    : t("Revenue captured for today", "Facturacion registrada para hoy")
                }
              />
            </div>
          </div>
        </section>

        <section className="flex justify-end">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-stone-300">
              {currentUser.fullName} · {currentUser.role === "admin" ? t("Administrator", "Administrador") : t("Operator", "Operador")}
            </div>
            <Button type="button" variant="secondary" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("Sign out", "Cerrar sesion")}
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
        </section>

        {currentView === "home" ? (
          <section className="grid gap-4 lg:grid-cols-3">
            <HomeCard
              icon={<CarFront className="h-6 w-6" />}
              title={t("Vehicle intake", "Ingreso de vehiculos")}
              description={t(
                "Intake form, status tracking, and brand filters.",
                "Formulario de captura, estado operativo y filtros por marca."
              )}
              buttonLabel={t("Open vehicles", "Abrir vehiculos")}
              onClick={() => setCurrentView("vehicles")}
            />
            <HomeCard
              icon={<Clock3 className="h-6 w-6" />}
              title={t("Time control", "Control de tiempo")}
              description={t(
                "Clock-in, clock-out, and employee registration by code.",
                "Entrada, salida y registro de empleados por codigo."
              )}
              buttonLabel={t("Open time control", "Abrir tiempo")}
              onClick={() => setCurrentView("time")}
            />
            <HomeCard
              icon={<Shield className="h-6 w-6" />}
              title={t("Administrator", "Administrador")}
              description={t(
                "Global view with access to all stores and operating summary.",
                "Vista global con acceso a todas las tiendas y resumen operativo."
              )}
              buttonLabel={t("Open admin", "Abrir administrador")}
              onClick={() => setCurrentView("admin")}
              disabled={currentUser.role !== "admin"}
            />
            {currentUser.role === "admin" ? (
              <article className="rounded-3xl border border-white/10 bg-white/5 p-6 lg:col-span-3">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
                      {t("User management", "Gestion de usuarios")}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      {t("Register system users", "Registrar usuarios del sistema")}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-stone-300">
                      {t(
                        "Create administrator or user accounts, assign a store, and define the clock-in code.",
                        "Crea cuentas de administrador o usuario, asigna una tienda y define el codigo de clock-in."
                      )}
                    </p>
                  </div>

                  <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
                    <DialogTrigger asChild>
                      <Button type="button">
                        {t("Register user", "Registrar usuario")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl rounded-3xl border-white/10 bg-stone-950 p-6 text-stone-100">
                      <DialogHeader>
                        <DialogTitle className="text-white">
                          {t("User registration", "Registro de usuarios")}
                        </DialogTitle>
                        <DialogDescription className="text-stone-400">
                          {t(
                            "Create operator or admin accounts and assign store access plus clock-in code.",
                            "Crea cuentas de operador o administrador y asigna tienda mas codigo de clock-in."
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

                        <Field label={t("Username", "Usuario")}>
                          <Input
                            value={userForm.username}
                            onChange={(event) =>
                              setUserForm((current) => ({
                                ...current,
                                username: event.target.value,
                              }))
                            }
                            required
                          />
                        </Field>

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

                        <Field label={t("Clock-in code", "Codigo de clock-in")}>
                          <Input
                            value={userForm.employeeCode}
                            onChange={(event) =>
                              setUserForm((current) => ({
                                ...current,
                                employeeCode: event.target.value.toUpperCase(),
                              }))
                            }
                            placeholder="EMP-001"
                            required
                          />
                        </Field>

                        <Field label={t("Store", "Tienda")}>
                          <Select
                            value={userForm.store}
                            onChange={(event) =>
                              setUserForm((current) => ({
                                ...current,
                                store: event.target.value as StoreName,
                              }))
                            }
                          >
                            {STORES.map((store) => (
                              <option key={store} value={store}>
                                {store}
                              </option>
                            ))}
                          </Select>
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
                          <Button type="submit">{t("Save user", "Guardar usuario")}</Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setUserForm(createUserForm())}
                          >
                            {t("Clear", "Limpiar")}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="mt-5 space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="rounded-2xl border border-white/10 bg-stone-900/70 px-4 py-3 text-sm text-stone-300"
                    >
                      {user.fullName} · {user.jobTitle} · {user.store} ·{" "}
                      {user.role === "admin"
                        ? t("Administrator", "Administrador")
                        : t("User", "Usuario")}
                    </div>
                  ))}
                </div>
              </article>
            ) : null}
          </section>
        ) : (
          <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-white/20 bg-white text-stone-950 hover:bg-stone-200"
                onClick={() => setCurrentView("home")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("Back to dashboard", "Volver al panel")}
              </Button>
              <Button
                type="button"
                variant={currentView === "vehicles" ? "default" : "secondary"}
                onClick={() => setCurrentView("vehicles")}
              >
                <CarFront className="mr-2 h-4 w-4" />
                {t("Vehicles", "Vehiculos")}
              </Button>
              <Button
                type="button"
                variant={currentView === "time" ? "default" : "secondary"}
                onClick={() => setCurrentView("time")}
              >
                <Clock3 className="mr-2 h-4 w-4" />
                {t("Time", "Tiempo")}
              </Button>
              {currentUser.role === "admin" ? (
                <Button
                  type="button"
                  variant={currentView === "admin" ? "default" : "secondary"}
                  onClick={() => setCurrentView("admin")}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {t("Admin", "Administrador")}
                </Button>
              ) : null}
            </div>

            {currentView !== "admin" ? (
              <Badge variant="secondary">
                {t("Active store", "Tienda activa")}: {activeStore}
              </Badge>
            ) : (
              <Badge variant="secondary">{t("Global access", "Acceso global")}</Badge>
            )}
          </section>
        )}

        {currentView !== "home" && currentView !== "admin" ? (
          currentUser.role === "admin" ? (
            <section className="grid gap-3 md:grid-cols-5">
              {STORES.map((store) => (
                <button
                  key={store}
                  type="button"
                  onClick={() => setActiveStore(store)}
                  className={`store-tile ${activeStore === store ? "store-tile-active" : ""}`}
                >
                  <span className="text-xs uppercase tracking-[0.2em] text-stone-400">
                    {t("Store", "Sucursal")}
                  </span>
                  <strong className="text-lg font-semibold text-white">{store}</strong>
                </button>
              ))}
            </section>
          ) : (
            <section className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
                {t("Assigned store", "Tienda asignada")}
              </p>
              <p className="mt-2 text-xl font-semibold text-white">{currentUser.store}</p>
            </section>
          )
        ) : null}

        {feedback ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {feedback}
          </div>
        ) : null}

        {currentView === "vehicles" ? (
          <section className="space-y-6">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">{t("Vehicle intake", "Ingreso de vehiculos")}</p>
                  <h2 className="panel-title">
                    {t("Digital daily intake form", "Captura digital de la hoja diaria")}
                  </h2>
                </div>
                <Badge variant="secondary">{activeStore}</Badge>
              </div>

              <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={handleVehicleSubmit}>
                <Field label={t("Date", "Fecha")}>
                  <Input
                    type="date"
                    value={vehicleForm.date}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                    required
                  />
                  <p className="text-xs text-stone-400">
                    {formatDateWithWeekday(vehicleForm.date, language)}
                  </p>
                </Field>

                <Field label={t("Drop-off time", "Hora de entrada")}>
                  <Input
                    type="time"
                    value={vehicleForm.time}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        time: event.target.value,
                      }))
                    }
                    required
                  />
                </Field>

                <Field label={t("Pickup time", "Hora de recogida")}>
                  <Input
                    type="time"
                    value={vehicleForm.pickupTime}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        pickupTime: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label={t("Stock / Plate", "Stock / Placa")}>
                  <Input
                    value={vehicleForm.stock}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        stock: event.target.value,
                      }))
                    }
                    placeholder={t("Internal number or plate", "Numero interno o placa")}
                    required
                  />
                </Field>

                <Field label={t("Sales person", "Sales Person")}>
                  <Input
                    value={vehicleForm.salesPerson}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        salesPerson: event.target.value,
                      }))
                    }
                    placeholder={t("Receiving employee", "Empleado que recibe")}
                    required
                  />
                </Field>

                <Field label={t("Make", "Marca")}>
                  <Input
                    value={vehicleForm.make}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        make: event.target.value,
                      }))
                    }
                    placeholder={t("Brand", "Marca")}
                    required
                  />
                </Field>

                <Field label={t("Model", "Modelo")}>
                  <Input
                    value={vehicleForm.model}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        model: event.target.value,
                      }))
                    }
                    placeholder={t("Model", "Modelo")}
                    required
                  />
                </Field>

                <Field label="VIN">
                  <Input
                    value={vehicleForm.vin}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        vin: event.target.value,
                      }))
                    }
                    placeholder={t("VIN or identifier", "VIN o identificador")}
                  />
                </Field>

                <Field label={t("Price", "Precio")}>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={vehicleForm.price}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    placeholder="0.00"
                  />
                </Field>

                <Field
                  label={t("Service / SIMO", "SIMO / Servicio")}
                  className="md:col-span-2 xl:col-span-3"
                >
                  <Input
                    value={vehicleForm.simo}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        simo: event.target.value,
                      }))
                    }
                    placeholder={t("Service type, package, or SIMO", "Tipo de servicio, paquete o SIMO")}
                  />
                </Field>

                <Field
                  label={t("Comments", "Comentarios")}
                  className="md:col-span-2 xl:col-span-3"
                >
                  <Textarea
                    value={vehicleForm.comments}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        comments: event.target.value,
                      }))
                    }
                    placeholder={t(
                      "Vehicle notes or instructions",
                      "Observaciones del vehiculo o instrucciones"
                    )}
                  />
                </Field>

                <div className="md:col-span-2 xl:col-span-3 flex flex-wrap gap-3">
                  <Button type="submit">{t("Save vehicle", "Guardar ingreso")}</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setVehicleForm(createVehicleForm(activeStore))}
                  >
                    {t("Clear form", "Limpiar formulario")}
                  </Button>
                </div>
              </form>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">{t("Daily operations", "Operacion diaria")}</p>
                  <h2 className="panel-title">{t("Vehicle operations board", "Panel operativo de vehiculos")}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setAreVehicleFiltersVisible((current) => !current)}
                  >
                    {areVehicleFiltersVisible
                      ? t("Hide filters", "Ocultar filtros")
                      : t("Filters", "Filtros")}
                  </Button>
                  <Badge variant="secondary">{filteredVehicles.length} {t("results", "resultados")}</Badge>
                  <Badge variant="success">{formatCurrency(todaySales)}</Badge>
                </div>
              </div>

              {areVehicleFiltersVisible ? (
                <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-stone-200">
                      {t("Advanced filters", "Filtros avanzados")}
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setVehicleFilters(createVehicleFilters());
                        setMakeFilter("Todas");
                      }}
                    >
                      {t("Reset filters", "Reiniciar filtros")}
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field label={t("Search", "Busqueda")}>
                      <Input
                        value={vehicleFilters.search}
                        onChange={(event) =>
                          setVehicleFilters((current) => ({
                            ...current,
                            search: event.target.value,
                          }))
                        }
                        placeholder={t(
                          "Stock, make, VIN, service...",
                          "Stock, marca, VIN, servicio..."
                        )}
                      />
                    </Field>

                    <Field label={t("Date", "Fecha")}>
                      <Input
                        type="date"
                        value={vehicleFilters.date}
                        onChange={(event) =>
                          setVehicleFilters((current) => ({
                            ...current,
                            date: event.target.value,
                          }))
                        }
                      />
                    </Field>

                    <Field label={t("Status", "Estado")}>
                      <Select
                        value={vehicleFilters.status}
                        onChange={(event) =>
                          setVehicleFilters((current) => ({
                            ...current,
                            status: event.target.value as VehicleFiltersState["status"],
                          }))
                        }
                      >
                        <option value="all">{t("All statuses", "Todos los estados")}</option>
                        <option value="Pendiente">{t("Pending", "Pendiente")}</option>
                        <option value="Completo">{t("Complete", "Completo")}</option>
                      </Select>
                    </Field>

                    <Field label={t("Make", "Marca")}>
                      <Select
                        value={makeFilter}
                        onChange={(event) => setMakeFilter(event.target.value)}
                      >
                        <option value="Todas">{t("All makes", "Todas las marcas")}</option>
                        {availableMakes.map((make) => (
                          <option key={make} value={make}>
                            {make}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <Field label={t("Sales person", "Vendedor")}>
                      <Select
                        value={vehicleFilters.salesPerson || "all"}
                        onChange={(event) =>
                          setVehicleFilters((current) => ({
                            ...current,
                            salesPerson: event.target.value === "all" ? "" : event.target.value,
                          }))
                        }
                      >
                        <option value="all">{t("All sales people", "Todos los vendedores")}</option>
                        {availableSalesPeople.map((person) => (
                          <option key={person} value={person}>
                            {person}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    {currentUser.role === "admin" ? (
                      <Field label={t("Store", "Tienda")}>
                        <Select
                          value={vehicleFilters.store}
                          onChange={(event) =>
                            setVehicleFilters((current) => ({
                              ...current,
                              store: event.target.value as VehicleFiltersState["store"],
                            }))
                          }
                        >
                          <option value="all">{t("All stores", "Todas las tiendas")}</option>
                          {STORES.map((store) => (
                            <option key={store} value={store}>
                              {store}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{t("Date", "Fecha")}</TableHead>
                    <TableHead>{t("Stock", "Stock")}</TableHead>
                    <TableHead>{t("Store", "Tienda")}</TableHead>
                    <TableHead>{t("Make / Model", "Make / Model")}</TableHead>
                    <TableHead>VIN</TableHead>
                    <TableHead>{t("Sales person", "Sales Person")}</TableHead>
                    <TableHead>{t("Drop-off", "Entrada")}</TableHead>
                    <TableHead>{t("Pickup", "Recogida")}</TableHead>
                    <TableHead>{t("Delivered", "Entrega real")}</TableHead>
                    <TableHead>{t("Service", "SIMO")}</TableHead>
                    <TableHead>{t("Comments", "Comentarios")}</TableHead>
                    <TableHead>{t("Price", "Precio")}</TableHead>
                    <TableHead>{t("Status", "Estado")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.length ? (
                    filteredVehicles.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDateWithWeekday(entry.date, language)}</TableCell>
                        <TableCell className="font-medium">{entry.stock}</TableCell>
                        <TableCell>{entry.store}</TableCell>
                        <TableCell>{`${entry.make} ${entry.model}`}</TableCell>
                        <TableCell>{entry.vin || "-"}</TableCell>
                        <TableCell>{entry.salesPerson}</TableCell>
                        <TableCell>{entry.time}</TableCell>
                        <TableCell>{entry.pickupTime || "-"}</TableCell>
                        <TableCell>
                          <Input
                            type="time"
                            value={entry.deliveredTime}
                            onChange={(event) =>
                              updateVehicleDeliveredTime(entry.id, event.target.value)
                            }
                            className="min-w-[120px]"
                          />
                        </TableCell>
                        <TableCell>{entry.simo || "-"}</TableCell>
                        <TableCell className="max-w-[220px]">
                          {entry.comments || "-"}
                        </TableCell>
                        <TableCell>{formatCurrency(entry.price)}</TableCell>
                        <TableCell>
                          <Select
                            value={entry.status}
                            onChange={(event) =>
                              updateVehicleStatus(
                                entry.id,
                                event.target.value as VehicleStatus
                              )
                            }
                            className="min-w-[130px]"
                          >
                            <option value="Pendiente">{t("Pending", "Pendiente")}</option>
                            <option value="Completo">{t("Complete", "Completo")}</option>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={13} className="py-8 text-center text-stone-400">
                        {t(
                          "No vehicles match the selected filters.",
                          "No hay vehiculos que coincidan con los filtros seleccionados."
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="mt-6 border-t border-white/10 pt-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow">{t("Vehicle history", "Historial de vehiculos")}</p>
                    <h3 className="text-xl font-semibold text-white">
                      {t("Recent activity timeline", "Linea de tiempo reciente")}
                    </h3>
                  </div>
                  <Badge variant="secondary">{filteredVehicles.length}</Badge>
                </div>

                <div className="space-y-4">
                  {filteredVehicles.length ? (
                    filteredVehicles.slice(0, 8).map((entry) => (
                      <article
                        key={`history-${entry.id}`}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-lg font-semibold text-white">
                              {entry.make} {entry.model}
                            </p>
                            <p className="text-sm text-stone-300">
                              {entry.store} · {entry.stock} · {entry.salesPerson}
                            </p>
                          </div>
                          <div className="text-sm text-stone-300">
                            {t("Last update", "Ultima actualizacion")}:{" "}
                            {formatTimestamp(entry.updatedAt, language)}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2 text-sm text-stone-300 md:grid-cols-2 xl:grid-cols-4">
                          <span>{t("Status", "Estado")}: {entry.status === "Completo" ? t("Complete", "Completo") : t("Pending", "Pendiente")}</span>
                          <span>{t("Pickup target", "Recogida estimada")}: {entry.pickupTime || "-"}</span>
                          <span>{t("Actual delivery", "Entrega real")}: {entry.deliveredTime || "-"}</span>
                          <span>{t("Updated by", "Actualizado por")}: {entry.updatedBy}</span>
                        </div>

                        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                          {entry.history.slice(0, 4).map((eventItem) => (
                            <div
                              key={eventItem.id}
                              className="rounded-xl border border-white/10 bg-stone-900/60 px-3 py-2 text-sm text-stone-300"
                            >
                              <span className="font-medium text-white">{eventItem.note}</span>
                              <span className="ml-2 text-stone-400">
                                {formatTimestamp(eventItem.timestamp, language)} · {eventItem.by}
                              </span>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-stone-400">
                      {t(
                        "No recent vehicle history is available for these filters.",
                        "No hay historial reciente de vehiculos para estos filtros."
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {currentView === "time" ? (
          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">{t("Time control", "Control de tiempo")}</p>
                  <h2 className="panel-title">
                    {t("Employee clock-in and clock-out", "Entrada y salida de empleados")}
                  </h2>
                </div>
                <Badge variant="secondary">{activeStore}</Badge>
              </div>

              <form className="grid gap-4" onSubmit={handleClockIn}>
                <Field label={t("Employee code", "Codigo de empleado")}>
                  <Input
                    value={attendanceForm.employeeCode}
                    onChange={(event) =>
                      setAttendanceForm((current) => ({
                        ...current,
                        employeeCode: event.target.value.toUpperCase(),
                      }))
                    }
                    placeholder={t("EMP-001", "EMP-001")}
                    required
                  />
                  <p className="text-xs text-stone-400">
                    {selectedEmployee
                      ? `${selectedEmployee.fullName} · ${selectedEmployee.jobTitle}`
                      : t(
                          "Enter a registered code to complete the clock-in.",
                          "Ingresa un codigo registrado para completar la entrada."
                        )}
                  </p>
                </Field>

                <Field label={t("Employee", "Empleado")}>
                  <Input
                    value={attendanceForm.employeeName}
                    readOnly
                    placeholder={t("Employee name", "Nombre del empleado")}
                    required
                  />
                </Field>

                <Field label={t("Role", "Cargo")}>
                  <Input
                    value={attendanceForm.role}
                    readOnly
                    placeholder={t("Washer, supervisor, cashier...", "Lavador, supervisor, caja...")}
                    required
                  />
                </Field>

                <Field label={t("Notes", "Notas")}>
                  <Textarea
                    value={attendanceForm.notes}
                    onChange={(event) =>
                      setAttendanceForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder={t("Shift notes", "Observaciones del turno")}
                  />
                </Field>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit">
                    <LogIn className="mr-2 h-4 w-4" />
                    {t("Clock in", "Marcar entrada")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setAttendanceForm(createAttendanceForm(activeStore))}
                  >
                    {t("Clear", "Limpiar")}
                  </Button>
                </div>
              </form>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">{t("Shifts and attendance", "Turnos y asistencia")}</p>
                  <h2 className="panel-title">{t("Team summary", "Resumen del personal")}</h2>
                </div>
                <Badge variant="secondary">
                  {activeShifts.length} {t("active", "activos")}
                </Badge>
              </div>

              <div className="space-y-3">
                {activeShifts.length ? (
                  activeShifts.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-white">
                            {entry.employeeName}
                          </p>
                          <p className="text-sm text-stone-300">
                            {entry.role} · {t("Clock in", "Entrada")} {entry.clockIn}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-white/20 bg-white text-stone-950 hover:bg-stone-200"
                          onClick={() => openClockOutModal(entry)}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          {t("Clock out", "Marcar salida")}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-stone-400">
                    {t(
                      "There are no employees with an open shift in this store.",
                      "No hay empleados con turno abierto en esta tienda."
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-white/10 pt-6">
                <div className="space-y-3">
                  {attendanceByStore.length ? (
                    attendanceByStore.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{entry.employeeName}</p>
                            <p className="text-sm text-stone-300">
                              {entry.role} · {formatDateWithWeekday(entry.date, language)}
                            </p>
                          </div>
                          <Badge variant={entry.clockOut ? "success" : "warning"}>
                            {entry.clockOut
                              ? t("Closed", "Cerrado")
                              : t("Open", "Abierto")}
                          </Badge>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-stone-300">
                          <span>{t("Clock in", "Entrada")}: {entry.clockIn}</span>
                          <span>
                            {t("Clock out", "Salida")}: {entry.clockOut ?? t("Pending", "Pendiente")}
                          </span>
                          <span>
                            {t("Time", "Tiempo")}: {formatDuration(entry.clockIn, entry.clockOut, language)}
                          </span>
                          {entry.notes ? <span>{t("Notes", "Notas")}: {entry.notes}</span> : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-stone-400">
                      {t(
                        "There are no attendance records in this store.",
                        "No hay movimientos de asistencia registrados en esta tienda."
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {currentView === "admin" ? (
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<LayoutDashboard className="h-5 w-5" />}
                label={t("Stores", "Tiendas")}
                value={String(STORES.length)}
                detail={t("Full operating coverage", "Cobertura operativa total")}
              />
              <StatCard
                icon={<CarFront className="h-5 w-5" />}
                label={t("Vehicles", "Vehiculos")}
                value={String(totalVehicles)}
                detail={t(
                  `Global pending ${adminStoreStats.reduce((sum, item) => sum + item.pending, 0)}`,
                  `Pendientes globales ${adminStoreStats.reduce((sum, item) => sum + item.pending, 0)}`
                )}
              />
              <StatCard
                icon={<Users className="h-5 w-5" />}
                label={t("Employees", "Empleados")}
                value={String(totalEmployees)}
                detail={t(
                  `${totalOpenShifts} open shifts now`,
                  `${totalOpenShifts} turnos abiertos ahora`
                )}
              />
              <StatCard
                icon={<Clock3 className="h-5 w-5" />}
                label={t("Sales today", "Ventas hoy")}
                value={formatCurrency(
                  adminStoreStats.reduce((sum, item) => sum + item.salesToday, 0)
                )}
                detail={t("Combined across all stores", "Consolidado de todas las tiendas")}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {adminStoreStats.map((item) => (
                <article
                  key={item.store}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                        {t("Store", "Sucursal")}
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold text-white">
                        {item.store}
                      </h3>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setActiveStore(item.store);
                        setCurrentView("vehicles");
                      }}
                    >
                      {t("View details", "Ver detalle")}
                    </Button>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <MiniStat label={t("Vehicles", "Vehiculos")} value={String(item.vehicles)} />
                    <MiniStat label={t("Pending", "Pendientes")} value={String(item.pending)} />
                    <MiniStat label={t("Employees", "Empleados")} value={String(item.employees)} />
                    <MiniStat label={t("Open shifts", "Turnos abiertos")} value={String(item.openShifts)} />
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-stone-900/80 px-4 py-3 text-sm text-stone-300">
                    {t("Today's sales", "Ventas del dia")}: {formatCurrency(item.salesToday)}
                  </div>
                </article>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="panel xl:col-span-2">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">{t("Daily report", "Informe diario")}</p>
                    <h2 className="panel-title">
                      {t("End-of-day email preview", "Vista previa del correo de cierre")}
                    </h2>
                  </div>
                  <Badge variant="secondary">{reportStore}</Badge>
                </div>

                <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                    <Field label={t("Store for report", "Tienda del informe")}>
                      <Select
                        value={reportStore}
                        onChange={(event) => setReportStore(event.target.value as StoreName)}
                      >
                        {STORES.map((store) => (
                          <option key={store} value={store}>
                            {store}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <MiniStat
                        label={t("Vehicles today", "Vehiculos de hoy")}
                        value={String(reportVehicles.length)}
                      />
                      <MiniStat
                        label={t("Completed", "Terminados")}
                        value={String(reportCompleted)}
                      />
                      <MiniStat
                        label={t("Pending", "Pendientes")}
                        value={String(reportVehicles.length - reportCompleted)}
                      />
                      <MiniStat
                        label={t("Total sales", "Total vendido")}
                        value={formatCurrency(reportTotal)}
                      />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-stone-900/80 px-4 py-3 text-sm text-stone-300">
                      {t("Report date", "Fecha del informe")}:{" "}
                      {formatDateWithWeekday(getTodayDate(), language)}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button type="button" onClick={handleSendReportPreview}>
                        {t("Send report", "Enviar informe")}
                      </Button>
                      <Button type="button" variant="secondary">
                        {t("Preview email", "Previsualizar correo")}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="mb-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
                        {t("Email content", "Contenido del correo")}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-white">
                        {t("Daily sales summary", "Resumen diario de ventas")} · {reportStore}
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {reportVehicles.length ? (
                        reportVehicles.map((entry) => (
                          <div
                            key={entry.id}
                            className="rounded-2xl border border-white/10 bg-stone-900/70 p-4"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="font-semibold text-white">
                                  {entry.make} {entry.model}
                                </p>
                                <p className="text-sm text-stone-300">
                                  {entry.stock} · {entry.salesPerson}
                                </p>
                              </div>
                              <Badge
                                variant={entry.status === "Completo" ? "success" : "warning"}
                              >
                                {entry.status === "Completo"
                                  ? t("Complete", "Completo")
                                  : t("Pending", "Pendiente")}
                              </Badge>
                            </div>

                            <div className="mt-3 grid gap-2 text-sm text-stone-300 sm:grid-cols-2">
                              <span>{t("Drop-off", "Entrada")}: {entry.time}</span>
                              <span>{t("Pickup", "Recogida")}: {entry.pickupTime || "-"}</span>
                              <span>{t("Service", "Servicio")}: {entry.simo || "-"}</span>
                              <span>{t("Price", "Precio")}: {formatCurrency(entry.price)}</span>
                              <span>{t("VIN", "VIN")}: {entry.vin || "-"}</span>
                              <span>{t("Date", "Fecha")}: {formatDateWithWeekday(entry.date, language)}</span>
                            </div>

                            {entry.comments ? (
                              <p className="mt-3 text-sm text-stone-400">
                                {t("Comments", "Comentarios")}: {entry.comments}
                              </p>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
                          {t(
                            "There are no vehicles registered today for this store.",
                            "No hay vehiculos registrados hoy para esta tienda."
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">{t("Global summary", "Resumen global")}</p>
                    <h2 className="panel-title">
                      {t("Registered makes across all stores", "Marcas registradas en todas las tiendas")}
                    </h2>
                  </div>
                  <Badge variant="secondary">
                    {totalVehicles} {t("vehicles", "vehiculos")}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  {Array.from(
                    new Set(
                      vehicles
                        .map((entry) => entry.make.trim())
                        .filter(Boolean)
                        .sort((a, b) => a.localeCompare(b))
                    )
                  ).map((make) => (
                    <div
                      key={make}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-stone-300"
                    >
                      {make} · {vehicles.filter((entry) => entry.make === make).length}
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">{t("Control", "Control")}</p>
                    <h2 className="panel-title">{t("System maintenance", "Mantenimiento del sistema")}</h2>
                  </div>
                  <TimerReset className="h-5 w-5 text-stone-400" />
                </div>

                <p className="text-sm text-stone-300">
                  {t(
                    "From this view you can review the whole business and jump into a specific store when needed.",
                    "Desde esta vista puedes revisar todo el negocio y saltar a una tienda puntual cuando necesites operar."
                  )}
                </p>

                <div className="mt-6 border-t border-white/10 pt-6">
                  <Button type="button" variant="destructive" onClick={resetDemoData}>
                    <TimerReset className="mr-2 h-4 w-4" />
                    {t("Reset demo data", "Reiniciar datos de prueba")}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <Dialog
        open={Boolean(clockOutTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setClockOutTarget(null);
            setClockOutCodeInput("");
          }
        }}
      >
        <DialogContent className="max-w-md rounded-3xl border-white/10 bg-stone-950 p-6 text-stone-100">
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("Confirm clock-out", "Confirmar salida")}
            </DialogTitle>
            <DialogDescription className="text-stone-400">
              {clockOutTarget
                ? t(
                    `Enter ${clockOutTarget.employeeName}'s code to register the clock-out.`,
                    `Escribe el codigo de ${clockOutTarget.employeeName} para registrar la salida.`
                  )
                : t(
                    "Enter the employee code to register the clock-out.",
                    "Escribe el codigo del empleado para registrar la salida."
                  )}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleClockOutSubmit}>
            <Field label={t("Employee code", "Codigo de empleado")}>
              <Input
                value={clockOutCodeInput}
                onChange={(event) => setClockOutCodeInput(event.target.value.toUpperCase())}
                placeholder={t("Enter your code", "Ingresa tu codigo")}
                required
              />
            </Field>

            {clockOutTarget ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-300">
                {clockOutTarget.employeeName} · {clockOutTarget.role} · {t("Clock in", "Entrada")}{" "}
                {clockOutTarget.clockIn}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit">{t("Confirm clock-out", "Confirmar salida")}</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setClockOutTarget(null);
                  setClockOutCodeInput("");
                }}
              >
                {t("Cancel", "Cancelar")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function HomeCard({
  icon,
  title,
  description,
  buttonLabel,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/15 text-amber-100">
        {icon}
      </div>
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-300">{description}</p>
      <div className="mt-6">
        <Button type="button" onClick={onClick} disabled={disabled}>
          {buttonLabel}
        </Button>
      </div>
    </article>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-300/20 text-amber-200">
        {icon}
      </div>
      <p className="text-sm text-stone-300">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-stone-400">{detail}</p>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentTime() {
  const now = new Date();
  const hours = `${now.getHours()}`.padStart(2, "0");
  const minutes = `${now.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

function parseTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatDateWithWeekday(value: string, language: Language) {
  if (!value) return "-";

  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  const locale = language === "es" ? "es-US" : "en-US";
  const weekday = date.toLocaleDateString(locale, { weekday: "long" });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${value}`;
}

function formatTimestamp(value: string, language: Language) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(language === "es" ? "es-US" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeEmployeeCode(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase();
}

export default App;
