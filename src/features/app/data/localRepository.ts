import {
  ATTENDANCE_STORAGE_KEY,
  DEFAULT_ADMIN_USER,
  EMPLOYEES_STORAGE_KEY,
  PAYROLL_CLOSURES_STORAGE_KEY,
  STORES,
  USERS_STORAGE_KEY,
  VEHICLE_STORAGE_KEY,
} from "../config";
import type {
  AttendanceEntry,
  EmployeeEntry,
  PayrollClosureEntry,
  UserEntry,
  VehicleEntry,
  VehicleHistoryAction,
} from "../types";
import type { AppDataSnapshot, AppRepository } from "./repository";
import { normalizeEmployeeCode } from "../utils";

function readJson<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadVehicles(): VehicleEntry[] {
  const parsedVehicles = readJson<VehicleEntry[]>(VEHICLE_STORAGE_KEY);
  if (!parsedVehicles) return [];

  return parsedVehicles.map((entry) => {
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
  });
}

async function saveVehicles(vehicles: VehicleEntry[]) {
  writeJson(VEHICLE_STORAGE_KEY, vehicles);
}

function clearVehicles() {
  localStorage.removeItem(VEHICLE_STORAGE_KEY);
}

function loadAttendance(): AttendanceEntry[] {
  const parsedAttendance = readJson<AttendanceEntry[]>(ATTENDANCE_STORAGE_KEY);
  if (!parsedAttendance) return [];

  return parsedAttendance.map((entry) => ({
    ...entry,
    employeeCode: normalizeEmployeeCode(entry.employeeCode),
  }));
}

async function saveAttendance(attendance: AttendanceEntry[]) {
  writeJson(ATTENDANCE_STORAGE_KEY, attendance);
}

function clearAttendance() {
  localStorage.removeItem(ATTENDANCE_STORAGE_KEY);
}

function loadEmployees(): EmployeeEntry[] {
  const parsedEmployees = readJson<EmployeeEntry[]>(EMPLOYEES_STORAGE_KEY);
  if (!parsedEmployees) return [];

  return parsedEmployees.map((entry) => ({
    ...entry,
    employeeCode: normalizeEmployeeCode(entry.employeeCode),
    active: entry.active ?? true,
  }));
}

async function saveEmployees(employees: EmployeeEntry[]) {
  writeJson(EMPLOYEES_STORAGE_KEY, employees);
}

function clearEmployees() {
  localStorage.removeItem(EMPLOYEES_STORAGE_KEY);
}

function loadPayrollClosures(): PayrollClosureEntry[] {
  const parsedClosures = readJson<PayrollClosureEntry[]>(PAYROLL_CLOSURES_STORAGE_KEY);
  if (!parsedClosures) return [];

  return parsedClosures;
}

async function savePayrollClosures(payrollClosures: PayrollClosureEntry[]) {
  writeJson(PAYROLL_CLOSURES_STORAGE_KEY, payrollClosures);
}

function loadUsers(): UserEntry[] {
  const parsedUsers = readJson<Array<UserEntry & { username?: string }>>(USERS_STORAGE_KEY);
  if (!parsedUsers) return [DEFAULT_ADMIN_USER];

  return parsedUsers.map((entry) => ({
    ...entry,
    authUserId: entry.authUserId ?? null,
    email: entry.email ?? entry.username ?? "",
    employeeCode: normalizeEmployeeCode(entry.employeeCode),
    store: entry.store ?? STORES[0],
    jobTitle: entry.jobTitle ?? (entry.role === "admin" ? "Administrator" : "Operator"),
    isBlocked: entry.isBlocked ?? false,
    blockedAt: entry.blockedAt ?? null,
  }));
}

async function saveUsers(users: UserEntry[]) {
  if (!users.length) return;
  writeJson(USERS_STORAGE_KEY, users);
}

function clearUsers() {
  localStorage.removeItem(USERS_STORAGE_KEY);
}

async function load(): Promise<AppDataSnapshot> {
  return {
    attendance: loadAttendance(),
    employees: loadEmployees(),
    payrollClosures: loadPayrollClosures(),
    users: loadUsers(),
    vehicles: loadVehicles(),
  };
}

async function clearOperationalData() {
  clearVehicles();
  clearAttendance();
  clearEmployees();
}

export const localRepository: AppRepository = {
  clearOperationalData,
  load,
  saveAttendance,
  saveEmployees,
  savePayrollClosures,
  saveUsers,
  saveVehicles,
};
