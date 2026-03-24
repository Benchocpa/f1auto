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

type StoreName = (typeof STORES)[number];
type VehicleStatus = "Pendiente" | "En proceso" | "Listo" | "Entregado";
type AppView = "home" | "vehicles" | "time" | "admin";

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
  simo: string;
  comments: string;
  price: number;
  status: VehicleStatus;
  createdAt: string;
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

interface VehicleFormState {
  store: StoreName;
  date: string;
  stock: string;
  make: string;
  model: string;
  vin: string;
  salesPerson: string;
  time: string;
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

const createVehicleForm = (store: StoreName): VehicleFormState => ({
  store,
  date: getTodayDate(),
  stock: "",
  make: "",
  model: "",
  vin: "",
  salesPerson: "",
  time: getCurrentTime(),
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

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

const formatDuration = (clockIn: string, clockOut: string | null) => {
  if (!clockOut) return "Turno abierto";

  const start = parseTime(clockIn);
  const end = parseTime(clockOut);

  if (!start || !end || end < start) return "Sin calcular";

  const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

function App() {
  const [currentView, setCurrentView] = useState<AppView>("home");
  const [activeStore, setActiveStore] = useState<StoreName>(STORES[0]);
  const [makeFilter, setMakeFilter] = useState("Todas");
  const [vehicleForm, setVehicleForm] = useState<VehicleFormState>(() =>
    createVehicleForm(STORES[0])
  );
  const [attendanceForm, setAttendanceForm] = useState<AttendanceFormState>(() =>
    createAttendanceForm(STORES[0])
  );
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormState>(() =>
    createEmployeeForm(STORES[0])
  );
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [clockOutTarget, setClockOutTarget] = useState<AttendanceEntry | null>(null);
  const [clockOutCodeInput, setClockOutCodeInput] = useState("");
  const [vehicles, setVehicles] = useState<VehicleEntry[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [employees, setEmployees] = useState<EmployeeEntry[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const storedVehicles = localStorage.getItem(VEHICLE_STORAGE_KEY);
    const storedAttendance = localStorage.getItem(ATTENDANCE_STORAGE_KEY);

    if (storedVehicles) {
      setVehicles(JSON.parse(storedVehicles));
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
    setVehicleForm((current) => ({ ...current, store: activeStore }));
    setAttendanceForm((current) => ({ ...current, store: activeStore }));
    setEmployeeForm((current) => ({ ...current, store: activeStore }));
  }, [activeStore]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const vehiclesByStore = useMemo(
    () => vehicles.filter((entry) => entry.store === activeStore),
    [vehicles, activeStore]
  );

  const availableMakes = useMemo(
    () =>
      Array.from(
        new Set(
          vehiclesByStore
            .map((entry) => entry.make.trim())
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))
        )
      ),
    [vehiclesByStore]
  );

  const filteredVehicles = useMemo(() => {
    if (makeFilter === "Todas") return vehiclesByStore;
    return vehiclesByStore.filter((entry) => entry.make === makeFilter);
  }, [vehiclesByStore, makeFilter]);

  const vehiclesByMake = useMemo(
    () =>
      availableMakes.map((make) => ({
        make,
        count: vehiclesByStore.filter((entry) => entry.make === make).length,
      })),
    [availableMakes, vehiclesByStore]
  );

  const attendanceByStore = useMemo(
    () => attendance.filter((entry) => entry.store === activeStore),
    [attendance, activeStore]
  );

  const employeesByStore = useMemo(
    () => employees.filter((entry) => entry.store === activeStore),
    [employees, activeStore]
  );

  const activeEmployeesByStore = useMemo(
    () => employeesByStore.filter((entry) => entry.active),
    [employeesByStore]
  );

  const selectedEmployee = useMemo(
    () =>
      activeEmployeesByStore.find(
        (entry) =>
          normalizeEmployeeCode(entry.employeeCode) ===
          normalizeEmployeeCode(attendanceForm.employeeCode)
      ) ?? null,
    [activeEmployeesByStore, attendanceForm.employeeCode]
  );

  useEffect(() => {
    if (makeFilter === "Todas") return;
    if (availableMakes.includes(makeFilter)) return;
    setMakeFilter("Todas");
  }, [availableMakes, makeFilter]);

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
        current.employeeName === selectedEmployee.employeeName &&
        current.role === selectedEmployee.role
      ) {
        return current;
      }

      return {
        ...current,
        employeeName: selectedEmployee.employeeName,
        role: selectedEmployee.role,
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
      vehiclesByStore.filter(
        (entry) => entry.status === "Pendiente" || entry.status === "En proceso"
      ).length,
    [vehiclesByStore]
  );

  const totalVehicles = vehicles.length;
  const totalOpenShifts = attendance.filter((entry) => !entry.clockOut).length;
  const totalEmployees = employees.filter((entry) => entry.active).length;

  const adminStoreStats = useMemo(
    () =>
      STORES.map((store) => {
        const storeVehicles = vehicles.filter((entry) => entry.store === store);
        const storeAttendance = attendance.filter((entry) => entry.store === store);
        const storeEmployees = employees.filter(
          (entry) => entry.store === store && entry.active
        );
        const openShifts = storeAttendance.filter((entry) => !entry.clockOut).length;
        const pending = storeVehicles.filter(
          (entry) => entry.status === "Pendiente" || entry.status === "En proceso"
        ).length;
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
    [attendance, employees, vehicles]
  );

  const handleVehicleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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
      simo: vehicleForm.simo.trim(),
      comments: vehicleForm.comments.trim(),
      price: Number(vehicleForm.price || 0),
      status: "Pendiente",
      createdAt: new Date().toISOString(),
    };

    setVehicles((current) => [newEntry, ...current]);
    setVehicleForm(createVehicleForm(activeStore));
    setFeedback("Vehiculo registrado correctamente.");
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
      setFeedback("Ese codigo ya existe en esta tienda.");
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
    setFeedback("Empleado registrado correctamente.");
  };

  const handleClockIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const employeeCode = normalizeEmployeeCode(attendanceForm.employeeCode);
    const employee = activeEmployeesByStore.find(
      (entry) => normalizeEmployeeCode(entry.employeeCode) === employeeCode
    );

    if (!employee) {
      setFeedback("Primero registra ese codigo en empleados.");
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
      setFeedback("Ese codigo ya tiene una entrada abierta en esta tienda.");
      return;
    }

    const newEntry: AttendanceEntry = {
      id: crypto.randomUUID(),
      employeeCode,
      employeeName: employee.employeeName,
      role: employee.role,
      store: attendanceForm.store,
      date: getTodayDate(),
      clockIn: getCurrentTime(),
      clockOut: null,
      notes: attendanceForm.notes.trim(),
    };

    setAttendance((current) => [newEntry, ...current]);
    setAttendanceForm(createAttendanceForm(activeStore));
    setFeedback("Entrada de empleado registrada.");
  };

  const updateVehicleStatus = (id: string, status: VehicleStatus) => {
    setVehicles((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, status } : entry))
    );
  };

  const handleClockOut = (id: string) => {
    setAttendance((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, clockOut: getCurrentTime() } : entry
      )
    );
    setFeedback("Salida de empleado registrada.");
  };

  const openClockOutModal = (entry: AttendanceEntry) => {
    setClockOutTarget(entry);
    setClockOutCodeInput("");
  };

  const handleClockOutSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!clockOutTarget) {
      setFeedback("Selecciona un empleado antes de marcar salida.");
      return;
    }

    if (
      normalizeEmployeeCode(clockOutCodeInput) !==
      normalizeEmployeeCode(clockOutTarget.employeeCode)
    ) {
      setFeedback("El codigo no coincide con el empleado seleccionado.");
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
    setFeedback("Datos reiniciados.");
  };

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <section className="hero-panel">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-stone-200">
                <Building2 className="h-4 w-4" />
                F1 Auto Details Control Center
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {currentView === "home"
                    ? "Panel principal de operaciones."
                    : currentView === "vehicles"
                      ? "Ingreso y seguimiento de vehiculos."
                      : currentView === "time"
                        ? "Control de tiempo y asistencia."
                        : "Vista administrativa multisucursal."}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-stone-300 sm:text-base">
                  {currentView === "home"
                    ? "Desde aqui puedes entrar al flujo de vehiculos, al control de tiempo o a la vista administrativa con acceso a todas las tiendas."
                    : currentView === "vehicles"
                      ? "Registra vehiculos, controla su estado y revisa el volumen por marca en la tienda activa."
                      : currentView === "time"
                        ? "Gestiona empleados, entradas, salidas y asistencia diaria desde una vista enfocada."
                        : "Consulta todas las tiendas al mismo tiempo con indicadores operativos, personal activo y ventas del dia."}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard
                icon={
                  currentView === "admin" ? (
                    <Building2 className="h-5 w-5" />
                  ) : (
                    <CarFront className="h-5 w-5" />
                  )
                }
                label={currentView === "admin" ? "Vehiculos totales" : "Vehiculos hoy"}
                value={String(currentView === "admin" ? totalVehicles : todayVehicles.length)}
                detail={
                  currentView === "admin"
                    ? `${STORES.length} tiendas monitoreadas`
                    : `Ventas del dia ${formatCurrency(todaySales)}`
                }
              />
              <StatCard
                icon={
                  currentView === "admin" ? (
                    <Shield className="h-5 w-5" />
                  ) : (
                    <Users className="h-5 w-5" />
                  )
                }
                label={currentView === "admin" ? "Personal activo" : "Empleados activos"}
                value={String(currentView === "admin" ? totalOpenShifts : activeShifts.length)}
                detail={
                  currentView === "admin"
                    ? `${totalEmployees} empleados registrados`
                    : `${pendingVehicles} vehiculos aun pendientes`
                }
              />
            </div>
          </div>
        </section>

        {currentView === "home" ? (
          <section className="grid gap-4 lg:grid-cols-3">
            <HomeCard
              icon={<CarFront className="h-6 w-6" />}
              title="Ingreso de vehiculos"
              description="Formulario de captura, estado operativo y filtros por marca."
              buttonLabel="Abrir vehiculos"
              onClick={() => setCurrentView("vehicles")}
            />
            <HomeCard
              icon={<Clock3 className="h-6 w-6" />}
              title="Control de tiempo"
              description="Entrada, salida y registro de empleados por codigo."
              buttonLabel="Abrir tiempo"
              onClick={() => setCurrentView("time")}
            />
            <HomeCard
              icon={<Shield className="h-6 w-6" />}
              title="Administrador"
              description="Vista global con acceso a todas las tiendas y resumen operativo."
              buttonLabel="Abrir administrador"
              onClick={() => setCurrentView("admin")}
            />
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
                Volver al panel
              </Button>
              <Button
                type="button"
                variant={currentView === "vehicles" ? "default" : "secondary"}
                onClick={() => setCurrentView("vehicles")}
              >
                <CarFront className="mr-2 h-4 w-4" />
                Vehiculos
              </Button>
              <Button
                type="button"
                variant={currentView === "time" ? "default" : "secondary"}
                onClick={() => setCurrentView("time")}
              >
                <Clock3 className="mr-2 h-4 w-4" />
                Tiempo
              </Button>
              <Button
                type="button"
                variant={currentView === "admin" ? "default" : "secondary"}
                onClick={() => setCurrentView("admin")}
              >
                <Shield className="mr-2 h-4 w-4" />
                Administrador
              </Button>
            </div>

            {currentView !== "admin" ? (
              <Badge variant="secondary">Tienda activa: {activeStore}</Badge>
            ) : (
              <Badge variant="secondary">Acceso global</Badge>
            )}
          </section>
        )}

        {currentView !== "home" && currentView !== "admin" ? (
          <section className="grid gap-3 md:grid-cols-5">
            {STORES.map((store) => (
              <button
                key={store}
                type="button"
                onClick={() => setActiveStore(store)}
                className={`store-tile ${activeStore === store ? "store-tile-active" : ""}`}
              >
                <span className="text-xs uppercase tracking-[0.2em] text-stone-400">
                  Sucursal
                </span>
                <strong className="text-lg font-semibold text-white">{store}</strong>
              </button>
            ))}
          </section>
        ) : null}

        {feedback ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {feedback}
          </div>
        ) : null}

        {currentView === "vehicles" ? (
          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Ingreso de vehiculos</p>
                  <h2 className="panel-title">Captura digital de la hoja diaria</h2>
                </div>
                <Badge variant="secondary">{activeStore}</Badge>
              </div>

              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleVehicleSubmit}>
                <Field label="Date">
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
                    {formatDateWithWeekday(vehicleForm.date)}
                  </p>
                </Field>

                <Field label="Time">
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

                <Field label="Stock / Placa">
                  <Input
                    value={vehicleForm.stock}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        stock: event.target.value,
                      }))
                    }
                    placeholder="Numero interno o placa"
                    required
                  />
                </Field>

                <Field label="Sales Person">
                  <Input
                    value={vehicleForm.salesPerson}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        salesPerson: event.target.value,
                      }))
                    }
                    placeholder="Empleado que recibe"
                    required
                  />
                </Field>

                <Field label="Make">
                  <Input
                    value={vehicleForm.make}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        make: event.target.value,
                      }))
                    }
                    placeholder="Marca"
                    required
                  />
                </Field>

                <Field label="Model">
                  <Input
                    value={vehicleForm.model}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        model: event.target.value,
                      }))
                    }
                    placeholder="Modelo"
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
                    placeholder="VIN o identificador"
                  />
                </Field>

                <Field label="Price">
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

                <Field label="SIMO / Servicio" className="md:col-span-2">
                  <Input
                    value={vehicleForm.simo}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        simo: event.target.value,
                      }))
                    }
                    placeholder="Tipo de servicio, paquete o SIMO"
                  />
                </Field>

                <Field label="Comments" className="md:col-span-2">
                  <Textarea
                    value={vehicleForm.comments}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        comments: event.target.value,
                      }))
                    }
                    placeholder="Observaciones del vehiculo o instrucciones"
                  />
                </Field>

                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <Button type="submit">Guardar ingreso</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setVehicleForm(createVehicleForm(activeStore))}
                  >
                    Limpiar formulario
                  </Button>
                </div>
              </form>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Operacion diaria</p>
                  <h2 className="panel-title">Vehiculos registrados</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{vehiclesByStore.length} registros</Badge>
                  <Badge variant="success">{formatCurrency(todaySales)}</Badge>
                </div>
              </div>

              <div className="mb-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-2">
                  <Label>Filtrar por marca</Label>
                  <Select
                    value={makeFilter}
                    onChange={(event) => setMakeFilter(event.target.value)}
                  >
                    <option value="Todas">Todas las marcas</option>
                    {availableMakes.map((make) => (
                      <option key={make} value={make}>
                        {make}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-stone-200">
                      Vehiculos por marca
                    </p>
                    <Badge variant="secondary">{vehiclesByStore.length} total</Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {vehiclesByMake.length ? (
                      vehiclesByMake.map(({ make, count }) => (
                        <button
                          key={make}
                          type="button"
                          onClick={() => setMakeFilter(make)}
                          className={`rounded-full border px-3 py-1 text-sm transition ${
                            makeFilter === make
                              ? "border-amber-300/50 bg-amber-300/15 text-amber-100"
                              : "border-white/10 bg-white/5 text-stone-300 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          {make} · {count}
                        </button>
                      ))
                    ) : (
                      <span className="text-sm text-stone-400">
                        Aun no hay marcas registradas en esta tienda.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Make / Model</TableHead>
                    <TableHead>VIN</TableHead>
                    <TableHead>Sales Person</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>SIMO</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.length ? (
                    filteredVehicles.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDateWithWeekday(entry.date)}</TableCell>
                        <TableCell className="font-medium">{entry.stock}</TableCell>
                        <TableCell>{`${entry.make} ${entry.model}`}</TableCell>
                        <TableCell>{entry.vin || "-"}</TableCell>
                        <TableCell>{entry.salesPerson}</TableCell>
                        <TableCell>{entry.time}</TableCell>
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
                            <option value="Pendiente">Pendiente</option>
                            <option value="En proceso">En proceso</option>
                            <option value="Listo">Listo</option>
                            <option value="Entregado">Entregado</option>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="py-8 text-center text-stone-400">
                        {makeFilter === "Todas"
                          ? `Todavia no hay vehiculos registrados en ${activeStore}.`
                          : `No hay vehiculos de la marca ${makeFilter} en ${activeStore}.`}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        ) : null}

        {currentView === "time" ? (
          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Control de tiempo</p>
                  <h2 className="panel-title">Entrada y salida de empleados</h2>
                </div>
                <Badge variant="secondary">{activeStore}</Badge>
              </div>

              <form className="grid gap-4" onSubmit={handleClockIn}>
                <Field label="Codigo de empleado">
                  <Input
                    value={attendanceForm.employeeCode}
                    onChange={(event) =>
                      setAttendanceForm((current) => ({
                        ...current,
                        employeeCode: event.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="EMP-001"
                    required
                  />
                  <p className="text-xs text-stone-400">
                    {selectedEmployee
                      ? `${selectedEmployee.employeeName} · ${selectedEmployee.role}`
                      : "Ingresa un codigo registrado para completar la entrada."}
                  </p>
                </Field>

                <Field label="Empleado">
                  <Input
                    value={attendanceForm.employeeName}
                    readOnly
                    placeholder="Nombre del empleado"
                    required
                  />
                </Field>

                <Field label="Cargo">
                  <Input
                    value={attendanceForm.role}
                    readOnly
                    placeholder="Lavador, supervisor, caja..."
                    required
                  />
                </Field>

                <Field label="Notas">
                  <Textarea
                    value={attendanceForm.notes}
                    onChange={(event) =>
                      setAttendanceForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Observaciones del turno"
                  />
                </Field>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit">
                    <LogIn className="mr-2 h-4 w-4" />
                    Marcar entrada
                  </Button>
                  <Dialog
                    open={isEmployeeModalOpen}
                    onOpenChange={setIsEmployeeModalOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-white/20 bg-white text-stone-950 hover:bg-stone-200"
                      >
                        Registro de empleado
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl rounded-3xl border-white/10 bg-stone-950 p-6 text-stone-100">
                      <DialogHeader>
                        <DialogTitle className="text-white">
                          Registro de empleados
                        </DialogTitle>
                        <DialogDescription className="text-stone-400">
                          Cada codigo se crea una sola vez por tienda y luego se usa
                          para marcar entrada.
                        </DialogDescription>
                      </DialogHeader>

                      <form
                        className="grid gap-4 md:grid-cols-3"
                        onSubmit={handleEmployeeSubmit}
                      >
                        <Field label="Codigo">
                          <Input
                            value={employeeForm.employeeCode}
                            onChange={(event) =>
                              setEmployeeForm((current) => ({
                                ...current,
                                employeeCode: event.target.value.toUpperCase(),
                              }))
                            }
                            placeholder="EMP-001"
                            required
                          />
                        </Field>

                        <Field label="Nombre">
                          <Input
                            value={employeeForm.employeeName}
                            onChange={(event) =>
                              setEmployeeForm((current) => ({
                                ...current,
                                employeeName: event.target.value,
                              }))
                            }
                            placeholder="Nombre del empleado"
                            required
                          />
                        </Field>

                        <Field label="Cargo">
                          <Input
                            value={employeeForm.role}
                            onChange={(event) =>
                              setEmployeeForm((current) => ({
                                ...current,
                                role: event.target.value,
                              }))
                            }
                            placeholder="Lavador, supervisor..."
                            required
                          />
                        </Field>

                        <div className="md:col-span-3 flex flex-wrap gap-3">
                          <Button type="submit">Guardar empleado</Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setEmployeeForm(createEmployeeForm(activeStore))}
                          >
                            Limpiar
                          </Button>
                          <Badge variant="secondary">
                            {employeesByStore.length} empleados en {activeStore}
                          </Badge>
                        </div>
                      </form>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {employeesByStore.length ? (
                          employeesByStore.map((entry) => (
                            <div
                              key={entry.id}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-stone-300"
                            >
                              {entry.employeeCode} · {entry.employeeName} · {entry.role}
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-stone-400">
                            Aun no hay empleados registrados en esta tienda.
                          </span>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setAttendanceForm(createAttendanceForm(activeStore))}
                  >
                    Limpiar
                  </Button>
                </div>
              </form>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Turnos y asistencia</p>
                  <h2 className="panel-title">Resumen del personal</h2>
                </div>
                <Badge variant="secondary">{activeShifts.length} activos</Badge>
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
                            {entry.role} · Entrada {entry.clockIn}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-white/20 bg-white text-stone-950 hover:bg-stone-200"
                          onClick={() => openClockOutModal(entry)}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Marcar salida
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-stone-400">
                    No hay empleados con turno abierto en esta tienda.
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
                              {entry.role} · {formatDateWithWeekday(entry.date)}
                            </p>
                          </div>
                          <Badge variant={entry.clockOut ? "success" : "warning"}>
                            {entry.clockOut ? "Cerrado" : "Abierto"}
                          </Badge>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-stone-300">
                          <span>Entrada: {entry.clockIn}</span>
                          <span>Salida: {entry.clockOut ?? "Pendiente"}</span>
                          <span>
                            Tiempo: {formatDuration(entry.clockIn, entry.clockOut)}
                          </span>
                          {entry.notes ? <span>Notas: {entry.notes}</span> : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-stone-400">
                      No hay movimientos de asistencia registrados en esta tienda.
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
                label="Tiendas"
                value={String(STORES.length)}
                detail="Cobertura operativa total"
              />
              <StatCard
                icon={<CarFront className="h-5 w-5" />}
                label="Vehiculos"
                value={String(totalVehicles)}
                detail={`Pendientes globales ${adminStoreStats.reduce((sum, item) => sum + item.pending, 0)}`}
              />
              <StatCard
                icon={<Users className="h-5 w-5" />}
                label="Empleados"
                value={String(totalEmployees)}
                detail={`${totalOpenShifts} turnos abiertos ahora`}
              />
              <StatCard
                icon={<Clock3 className="h-5 w-5" />}
                label="Ventas hoy"
                value={formatCurrency(
                  adminStoreStats.reduce((sum, item) => sum + item.salesToday, 0)
                )}
                detail="Consolidado de todas las tiendas"
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
                        Sucursal
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
                      Ver detalle
                    </Button>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <MiniStat label="Vehiculos" value={String(item.vehicles)} />
                    <MiniStat label="Pendientes" value={String(item.pending)} />
                    <MiniStat label="Empleados" value={String(item.employees)} />
                    <MiniStat label="Turnos abiertos" value={String(item.openShifts)} />
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-stone-900/80 px-4 py-3 text-sm text-stone-300">
                    Ventas del dia: {formatCurrency(item.salesToday)}
                  </div>
                </article>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Resumen global</p>
                    <h2 className="panel-title">Marcas registradas en todas las tiendas</h2>
                  </div>
                  <Badge variant="secondary">{totalVehicles} vehiculos</Badge>
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
                    <p className="eyebrow">Control</p>
                    <h2 className="panel-title">Mantenimiento del sistema</h2>
                  </div>
                  <TimerReset className="h-5 w-5 text-stone-400" />
                </div>

                <p className="text-sm text-stone-300">
                  Desde esta vista puedes revisar todo el negocio y saltar a una
                  tienda puntual cuando necesites operar.
                </p>

                <div className="mt-6 border-t border-white/10 pt-6">
                  <Button type="button" variant="destructive" onClick={resetDemoData}>
                    <TimerReset className="mr-2 h-4 w-4" />
                    Reiniciar datos de prueba
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
            <DialogTitle className="text-white">Confirmar salida</DialogTitle>
            <DialogDescription className="text-stone-400">
              {clockOutTarget
                ? `Escribe el codigo de ${clockOutTarget.employeeName} para registrar la salida.`
                : "Escribe el codigo del empleado para registrar la salida."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleClockOutSubmit}>
            <Field label="Codigo de empleado">
              <Input
                value={clockOutCodeInput}
                onChange={(event) => setClockOutCodeInput(event.target.value.toUpperCase())}
                placeholder="Ingresa tu codigo"
                required
              />
            </Field>

            {clockOutTarget ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-300">
                {clockOutTarget.employeeName} · {clockOutTarget.role} · Entrada{" "}
                {clockOutTarget.clockIn}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit">Confirmar salida</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setClockOutTarget(null);
                  setClockOutCodeInput("");
                }}
              >
                Cancelar
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
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/15 text-amber-100">
        {icon}
      </div>
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-300">{description}</p>
      <div className="mt-6">
        <Button type="button" onClick={onClick}>
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

function formatDateWithWeekday(value: string) {
  if (!value) return "-";

  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  const weekday = date.toLocaleDateString("es-US", { weekday: "long" });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${value}`;
}

function normalizeEmployeeCode(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase();
}

export default App;
