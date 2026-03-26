import type {
  AttendanceEntry,
  EmployeeEntry,
  PayrollClosureEntry,
  StoreEntry,
  UserEntry,
  VehicleEntry,
} from "../types";

export interface AppDataSnapshot {
  attendance: AttendanceEntry[];
  employees: EmployeeEntry[];
  payrollClosures: PayrollClosureEntry[];
  stores: StoreEntry[];
  users: UserEntry[];
  vehicles: VehicleEntry[];
}

export interface AppRepository {
  clearOperationalData(): Promise<void>;
  deleteVehicle(id: string): Promise<void>;
  load(): Promise<AppDataSnapshot>;
  saveAttendance(attendance: AttendanceEntry[]): Promise<void>;
  saveEmployees(employees: EmployeeEntry[]): Promise<void>;
  savePayrollClosures(payrollClosures: PayrollClosureEntry[]): Promise<void>;
  saveStores(stores: StoreEntry[]): Promise<void>;
  saveUsers(users: UserEntry[]): Promise<void>;
  saveVehicles(vehicles: VehicleEntry[]): Promise<void>;
  upsertVehicle(vehicle: VehicleEntry): Promise<void>;
}
