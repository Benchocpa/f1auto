import type { AttendanceEntry, EmployeeEntry, UserEntry, VehicleEntry } from "../types";

export interface AppDataSnapshot {
  attendance: AttendanceEntry[];
  employees: EmployeeEntry[];
  users: UserEntry[];
  vehicles: VehicleEntry[];
}

export interface AppRepository {
  clearOperationalData(): Promise<void>;
  load(): Promise<AppDataSnapshot>;
  saveAttendance(attendance: AttendanceEntry[]): Promise<void>;
  saveEmployees(employees: EmployeeEntry[]): Promise<void>;
  saveUsers(users: UserEntry[]): Promise<void>;
  saveVehicles(vehicles: VehicleEntry[]): Promise<void>;
}
