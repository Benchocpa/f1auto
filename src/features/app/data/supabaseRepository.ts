import type { AppDataSnapshot, AppRepository } from "./repository";
import { DEFAULT_ADMIN_USER } from "../config";
import type {
  AttendanceEntry,
  EmployeeEntry,
  PayrollClosureEntry,
  StoreEntry,
  UserEntry,
  VehicleEntry,
  VehicleHistoryEvent,
} from "../types";
import { normalizeEmployeeCode } from "../utils";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

type VehicleRow = {
  id: string;
  date: string;
  store: string;
  stock: string;
  make: string;
  model: string;
  vin: string;
  sales_person: string;
  time: string;
  pickup_time: string;
  delivered_time: string;
  simo: string;
  comments: string;
  price: number;
  status: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
  history: VehicleHistoryEvent[];
};

type AttendanceRow = {
  id: string;
  employee_code: string;
  employee_name: string;
  role: string;
  store: string;
  date: string;
  clock_in: string;
  clock_out: string | null;
  notes: string;
};

type EmployeeRow = {
  id: string;
  employee_code: string;
  employee_name: string;
  role: string;
  store: string;
  active: boolean;
  created_at: string;
};

type UserRow = {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string;
  employee_code: string;
  store: string;
  job_title: string;
  role: string;
  is_blocked: boolean;
  blocked_at: string | null;
  created_at: string;
};

type PayrollClosureRow = {
  id: string;
  store: string;
  closed_at: string;
  closed_by: string;
};

type StoreRow = {
  id: string;
  name: string;
  address: string;
  phone: string;
  logo_key: string;
  created_at: string;
};

const TABLES = {
  attendance: "attendance_entries",
  employees: "employees",
  payrollClosures: "payroll_closures",
  stores: "stores",
  users: "app_users",
  vehicles: "vehicles",
} as const;

const cachedTableIds: Record<string, Set<string>> = {
  [TABLES.attendance]: new Set<string>(),
  [TABLES.employees]: new Set<string>(),
  [TABLES.payrollClosures]: new Set<string>(),
  [TABLES.stores]: new Set<string>(),
  [TABLES.users]: new Set<string>(),
  [TABLES.vehicles]: new Set<string>(),
};

function getClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function mapVehicleRow(row: VehicleRow): VehicleEntry {
  return {
    id: row.id,
    date: row.date,
    store: row.store as VehicleEntry["store"],
    stock: row.stock,
    make: row.make,
    model: row.model,
    vin: row.vin,
    salesPerson: row.sales_person,
    time: row.time,
    pickupTime: row.pickup_time,
    deliveredTime: row.delivered_time,
    simo: row.simo,
    comments: row.comments,
    price: Number(row.price || 0),
    status: row.status as VehicleEntry["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    history: row.history ?? [],
  };
}

function mapVehicleEntry(entry: VehicleEntry): VehicleRow {
  return {
    id: entry.id,
    date: entry.date,
    store: entry.store,
    stock: entry.stock,
    make: entry.make,
    model: entry.model,
    vin: entry.vin,
    sales_person: entry.salesPerson,
    time: entry.time,
    pickup_time: entry.pickupTime,
    delivered_time: entry.deliveredTime,
    simo: entry.simo,
    comments: entry.comments,
    price: entry.price,
    status: entry.status,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
    updated_by: entry.updatedBy,
    history: entry.history,
  };
}

function mapAttendanceRow(row: AttendanceRow): AttendanceEntry {
  return {
    id: row.id,
    employeeCode: normalizeEmployeeCode(row.employee_code),
    employeeName: row.employee_name,
    role: row.role,
    store: row.store as AttendanceEntry["store"],
    date: row.date,
    clockIn: row.clock_in,
    clockOut: row.clock_out,
    notes: row.notes,
  };
}

function mapAttendanceEntry(entry: AttendanceEntry): AttendanceRow {
  return {
    id: entry.id,
    employee_code: entry.employeeCode,
    employee_name: entry.employeeName,
    role: entry.role,
    store: entry.store,
    date: entry.date,
    clock_in: entry.clockIn,
    clock_out: entry.clockOut,
    notes: entry.notes,
  };
}

function mapEmployeeRow(row: EmployeeRow): EmployeeEntry {
  return {
    id: row.id,
    employeeCode: normalizeEmployeeCode(row.employee_code),
    employeeName: row.employee_name,
    role: row.role,
    store: row.store as EmployeeEntry["store"],
    active: row.active,
    createdAt: row.created_at,
  };
}

function mapEmployeeEntry(entry: EmployeeEntry): EmployeeRow {
  return {
    id: entry.id,
    employee_code: entry.employeeCode,
    employee_name: entry.employeeName,
    role: entry.role,
    store: entry.store,
    active: entry.active,
    created_at: entry.createdAt,
  };
}

function mapUserRow(row: UserRow): UserEntry {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    fullName: row.full_name,
    email: row.email,
    employeeCode: normalizeEmployeeCode(row.employee_code),
    store: row.store as UserEntry["store"],
    jobTitle: row.job_title,
    role: row.role as UserEntry["role"],
    isBlocked: row.is_blocked ?? false,
    blockedAt: row.blocked_at ?? null,
    createdAt: row.created_at,
  };
}

function mapUserEntry(entry: UserEntry): UserRow {
  return {
    id: entry.id,
    auth_user_id: entry.authUserId ?? null,
    full_name: entry.fullName,
    email: entry.email,
    employee_code: entry.employeeCode,
    store: entry.store,
    job_title: entry.jobTitle,
    role: entry.role,
    is_blocked: entry.isBlocked,
    blocked_at: entry.blockedAt,
    created_at: entry.createdAt,
  };
}

function mapPayrollClosureRow(row: PayrollClosureRow): PayrollClosureEntry {
  return {
    id: row.id,
    store: row.store as PayrollClosureEntry["store"],
    closedAt: row.closed_at,
    closedBy: row.closed_by,
  };
}

function mapPayrollClosureEntry(entry: PayrollClosureEntry): PayrollClosureRow {
  return {
    id: entry.id,
    store: entry.store,
    closed_at: entry.closedAt,
    closed_by: entry.closedBy,
  };
}

function mapStoreRow(row: StoreRow): StoreEntry {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    phone: row.phone,
    logoKey: row.logo_key,
    createdAt: row.created_at,
  };
}

function mapStoreEntry(entry: StoreEntry): StoreRow {
  return {
    id: entry.id,
    name: entry.name,
    address: entry.address,
    phone: entry.phone,
    logo_key: entry.logoKey,
    created_at: entry.createdAt,
  };
}

function setCachedIds(table: string, ids: string[]) {
  cachedTableIds[table] = new Set(ids);
}

async function syncTable<T extends { id: string }>(table: string, rows: T[]) {
  const client = getClient();
  const nextIds = new Set(rows.map((row) => row.id));
  const cachedIds = cachedTableIds[table] ?? new Set<string>();

  if (rows.length) {
    const { error: upsertError } = await client.from(table).upsert(rows);
    if (upsertError) throw upsertError;
  }

  const idsToDelete = Array.from(cachedIds).filter((id) => !nextIds.has(id));
  if (idsToDelete.length) {
    const { error: deleteError } = await client.from(table).delete().in("id", idsToDelete);
    if (deleteError) throw deleteError;
  }

  setCachedIds(table, Array.from(nextIds));
}

export const supabaseRepository: AppRepository = {
  async clearOperationalData() {
    await Promise.all([
      getClient().from(TABLES.vehicles).delete().not("id", "is", null),
      getClient().from(TABLES.attendance).delete().not("id", "is", null),
      getClient().from(TABLES.employees).delete().not("id", "is", null),
    ]);
    setCachedIds(TABLES.vehicles, []);
    setCachedIds(TABLES.attendance, []);
    setCachedIds(TABLES.employees, []);
  },

  async deleteVehicle(id: string) {
    const client = getClient();
    const { error } = await client.from(TABLES.vehicles).delete().eq("id", id);
    if (error) throw error;
    cachedTableIds[TABLES.vehicles].delete(id);
  },

  async load(): Promise<AppDataSnapshot> {
    const client = getClient();

    const [
      { data: vehiclesData, error: vehiclesError },
      { data: attendanceData, error: attendanceError },
      { data: employeesData, error: employeesError },
      { data: payrollClosuresData, error: payrollClosuresError },
      { data: storesData, error: storesError },
      { data: usersData, error: usersError },
    ] = await Promise.all([
      client.from(TABLES.vehicles).select("*").order("created_at", { ascending: false }),
      client.from(TABLES.attendance).select("*").order("date", { ascending: false }),
      client.from(TABLES.employees).select("*").order("created_at", { ascending: false }),
      client.from(TABLES.payrollClosures).select("*").order("closed_at", { ascending: false }),
      client.from(TABLES.stores).select("*").order("name", { ascending: true }),
      client.from(TABLES.users).select("*").order("created_at", { ascending: false }),
    ]);

    if (vehiclesError) throw vehiclesError;
    if (attendanceError) throw attendanceError;
    if (employeesError) throw employeesError;
    if (payrollClosuresError) throw payrollClosuresError;
    if (storesError) throw storesError;
    if (usersError) throw usersError;

    const users = (usersData as UserRow[] | null)?.map(mapUserRow) ?? [DEFAULT_ADMIN_USER];
    const vehicles = (vehiclesData as VehicleRow[] | null)?.map(mapVehicleRow) ?? [];
    const attendance = (attendanceData as AttendanceRow[] | null)?.map(mapAttendanceRow) ?? [];
    const employees = (employeesData as EmployeeRow[] | null)?.map(mapEmployeeRow) ?? [];
    const payrollClosures =
      (payrollClosuresData as PayrollClosureRow[] | null)?.map(mapPayrollClosureRow) ?? [];
    const stores = (storesData as StoreRow[] | null)?.map(mapStoreRow) ?? [];

    setCachedIds(TABLES.vehicles, vehicles.map((entry) => entry.id));
    setCachedIds(TABLES.attendance, attendance.map((entry) => entry.id));
    setCachedIds(TABLES.employees, employees.map((entry) => entry.id));
    setCachedIds(TABLES.payrollClosures, payrollClosures.map((entry) => entry.id));
    setCachedIds(TABLES.stores, stores.map((entry) => entry.id));
    setCachedIds(TABLES.users, users.map((entry) => entry.id));

    return {
      attendance,
      employees,
      payrollClosures,
      stores,
      users,
      vehicles,
    };
  },

  async saveAttendance(attendance) {
    await syncTable(TABLES.attendance, attendance.map(mapAttendanceEntry));
  },

  async saveEmployees(employees) {
    await syncTable(TABLES.employees, employees.map(mapEmployeeEntry));
  },

  async savePayrollClosures(payrollClosures) {
    await syncTable(TABLES.payrollClosures, payrollClosures.map(mapPayrollClosureEntry));
  },

  async saveStores(stores) {
    await syncTable(TABLES.stores, stores.map(mapStoreEntry));
  },

  async saveUsers(users) {
    void users;
  },

  async saveVehicles(vehicles) {
    await syncTable(TABLES.vehicles, vehicles.map(mapVehicleEntry));
  },

  async upsertVehicle(vehicle) {
    const client = getClient();
    const row = mapVehicleEntry(vehicle);
    const { error } = await client.from(TABLES.vehicles).upsert(row);
    if (error) throw error;
    cachedTableIds[TABLES.vehicles].add(vehicle.id);
  },
};
