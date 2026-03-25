export type StoreName = (typeof import("./config").STORES)[number];
export type VehicleStatus = "Pendiente" | "Entregado";
export type AppView = "home" | "vehicles" | "time" | "admin";
export type Language = "en" | "es";
export type UserRole = "admin" | "operator";
export type VehicleHistoryAction = "created" | "status" | "delivery_time";
export type Translate = (en: string, es: string) => string;

export interface VehicleHistoryEvent {
  id: string;
  action: VehicleHistoryAction;
  timestamp: string;
  by: string;
  note: string;
}

export interface VehicleEntry {
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

export interface AttendanceEntry {
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

export interface EmployeeEntry {
  id: string;
  employeeCode: string;
  employeeName: string;
  role: string;
  store: StoreName;
  active: boolean;
  createdAt: string;
}

export interface PayrollClosureEntry {
  id: string;
  store: StoreName;
  closedAt: string;
  closedBy: string;
}

export interface UserEntry {
  id: string;
  authUserId?: string | null;
  fullName: string;
  email: string;
  employeeCode: string;
  store: StoreName;
  jobTitle: string;
  role: UserRole;
  isBlocked: boolean;
  blockedAt: string | null;
  createdAt: string;
}

export interface VehicleFormState {
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

export interface AttendanceFormState {
  employeeCode: string;
  employeeName: string;
  role: string;
  store: StoreName;
  notes: string;
}

export interface EmployeeFormState {
  employeeCode: string;
  employeeName: string;
  role: string;
  store: StoreName;
}

export interface LoginFormState {
  email: string;
  password: string;
}

export interface PasswordResetFormState {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AccountPasswordFormState {
  password: string;
  confirmPassword: string;
}

export interface UserFormState {
  fullName: string;
  email: string;
  password: string;
  employeeCode: string;
  store: StoreName;
  jobTitle: string;
  role: UserRole;
}

export interface VehicleFiltersState {
  search: string;
  date: string;
  status: "all" | VehicleStatus;
  salesPerson: string;
  store: "all" | StoreName;
}

export interface AdminStoreStat {
  store: StoreName;
  vehicles: number;
  employees: number;
  openShifts: number;
  pending: number;
  salesToday: number;
}

export interface PayrollEmployeeSummary {
  userId: string;
  employeeCode: string;
  employeeName: string;
  jobTitle: string;
  store: StoreName;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  openShiftCount: number;
  alertCount: number;
}
