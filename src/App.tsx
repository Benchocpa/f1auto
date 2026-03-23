import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CarFront,
  Clock3,
  LogIn,
  LogOut,
  TimerReset,
  Users,
} from "lucide-react";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
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

type StoreName = (typeof STORES)[number];
type VehicleStatus = "Pendiente" | "En proceso" | "Listo" | "Entregado";

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
  employeeName: string;
  role: string;
  store: StoreName;
  date: string;
  clockIn: string;
  clockOut: string | null;
  notes: string;
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
  employeeName: string;
  role: string;
  store: StoreName;
  notes: string;
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
  employeeName: "",
  role: "",
  store,
  notes: "",
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
  const [activeStore, setActiveStore] = useState<StoreName>(STORES[0]);
  const [vehicleForm, setVehicleForm] = useState<VehicleFormState>(() =>
    createVehicleForm(STORES[0])
  );
  const [attendanceForm, setAttendanceForm] = useState<AttendanceFormState>(() =>
    createAttendanceForm(STORES[0])
  );
  const [vehicles, setVehicles] = useState<VehicleEntry[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const storedVehicles = localStorage.getItem(VEHICLE_STORAGE_KEY);
    const storedAttendance = localStorage.getItem(ATTENDANCE_STORAGE_KEY);

    if (storedVehicles) {
      setVehicles(JSON.parse(storedVehicles));
    }

    if (storedAttendance) {
      setAttendance(JSON.parse(storedAttendance));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    setVehicleForm((current) => ({ ...current, store: activeStore }));
    setAttendanceForm((current) => ({ ...current, store: activeStore }));
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

  const attendanceByStore = useMemo(
    () => attendance.filter((entry) => entry.store === activeStore),
    [attendance, activeStore]
  );

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

  const handleClockIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const duplicateOpenShift = attendance.some(
      (entry) =>
        entry.employeeName.toLowerCase() ===
          attendanceForm.employeeName.trim().toLowerCase() &&
        entry.store === attendanceForm.store &&
        entry.date === getTodayDate() &&
        !entry.clockOut
    );

    if (duplicateOpenShift) {
      setFeedback("Ese empleado ya tiene una entrada abierta en esta tienda.");
      return;
    }

    const newEntry: AttendanceEntry = {
      id: crypto.randomUUID(),
      employeeName: attendanceForm.employeeName.trim(),
      role: attendanceForm.role.trim(),
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

  const resetDemoData = () => {
    setVehicles([]);
    setAttendance([]);
    localStorage.removeItem(VEHICLE_STORAGE_KEY);
    localStorage.removeItem(ATTENDANCE_STORAGE_KEY);
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
                  Registro digital para vehiculos y control de tiempo por tienda.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-stone-300 sm:text-base">
                  La hoja en papel se convierte en un flujo operativo: se registra
                  cada vehiculo, se marca su estado y cada empleado deja entrada y
                  salida desde la misma pantalla.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard
                icon={<CarFront className="h-5 w-5" />}
                label="Vehiculos hoy"
                value={String(todayVehicles.length)}
                detail={`Ventas del dia ${formatCurrency(todaySales)}`}
              />
              <StatCard
                icon={<Users className="h-5 w-5" />}
                label="Empleados activos"
                value={String(activeShifts.length)}
                detail={`${pendingVehicles} vehiculos aun pendientes`}
              />
            </div>
          </div>
        </section>

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

        {feedback ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {feedback}
          </div>
        ) : null}

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
                <p className="eyebrow">Control de tiempo</p>
                <h2 className="panel-title">Entrada y salida de empleados</h2>
              </div>
              <Badge variant="secondary">{activeStore}</Badge>
            </div>

            <form className="grid gap-4" onSubmit={handleClockIn}>
              <Field label="Empleado">
                <Input
                  value={attendanceForm.employeeName}
                  onChange={(event) =>
                    setAttendanceForm((current) => ({
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
                  value={attendanceForm.role}
                  onChange={(event) =>
                    setAttendanceForm((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
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
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAttendanceForm(createAttendanceForm(activeStore))}
                >
                  Limpiar
                </Button>
              </div>
            </form>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-stone-200">Turnos abiertos</p>
                <Badge variant={activeShifts.length ? "warning" : "secondary"}>
                  {activeShifts.length}
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
                            {entry.role} · Entrada {entry.clockIn}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleClockOut(entry.id)}
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
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
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
                {vehiclesByStore.length ? (
                  vehiclesByStore.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell className="font-medium">{entry.stock}</TableCell>
                      <TableCell>{`${entry.make} ${entry.model}`}</TableCell>
                      <TableCell>{entry.vin || "-"}</TableCell>
                      <TableCell>{entry.salesPerson}</TableCell>
                      <TableCell>{entry.time}</TableCell>
                      <TableCell>{entry.simo || "-"}</TableCell>
                      <TableCell className="max-w-[220px]">{entry.comments || "-"}</TableCell>
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
                      Todavia no hay vehiculos registrados en {activeStore}.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Resumen de personal</p>
                <h2 className="panel-title">Historial de asistencia</h2>
              </div>
              <Clock3 className="h-5 w-5 text-stone-400" />
            </div>

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
                          {entry.role} · {entry.date}
                        </p>
                      </div>
                      <Badge variant={entry.clockOut ? "success" : "warning"}>
                        {entry.clockOut ? "Cerrado" : "Abierto"}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-stone-300">
                      <span>Entrada: {entry.clockIn}</span>
                      <span>Salida: {entry.clockOut ?? "Pendiente"}</span>
                      <span>Tiempo: {formatDuration(entry.clockIn, entry.clockOut)}</span>
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

            <div className="mt-6 border-t border-white/10 pt-6">
              <Button type="button" variant="destructive" onClick={resetDemoData}>
                <TimerReset className="mr-2 h-4 w-4" />
                Reiniciar datos de prueba
              </Button>
            </div>
          </div>
        </section>
      </div>
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

export default App;
