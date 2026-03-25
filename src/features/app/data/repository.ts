import type {
  AttendanceEntry,
  EmployeeEntry,
  PayrollClosureEntry,
  UserEntry,
  VehicleEntry,
} from "../types";

export interface AppDataSnapshot {
  attendance: AttendanceEntry[];
  employees: EmployeeEntry[];
  payrollClosures: PayrollClosureEntry[];
  users: UserEntry[];
  vehicles: VehicleEntry[];
}

export interface AppRepository {
  clearOperationalData(): Promise<void>;
  load(): Promise<AppDataSnapshot>;
  saveAttendance(attendance: AttendanceEntry[]): Promise<void>;
  saveEmployees(employees: EmployeeEntry[]): Promise<void>;
  savePayrollClosures(payrollClosures: PayrollClosureEntry[]): Promise<void>;
  saveUsers(users: UserEntry[]): Promise<void>;
  saveVehicles(vehicles: VehicleEntry[]): Promise<void>;
}
