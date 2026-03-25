import type {
  AccountPasswordFormState,
  AttendanceFormState,
  EmployeeFormState,
  LoginFormState,
  PasswordResetFormState,
  StoreName,
  UserEntry,
  UserFormState,
  VehicleFiltersState,
  VehicleFormState,
} from "./types";
import { getCurrentTime, getTodayDate } from "./utils";

export const STORES = [
  "Tienda 1",
  "Tienda 2",
  "Tienda 3",
  "Tienda 4",
  "Tienda 5",
] as const;

export const VEHICLE_STORAGE_KEY = "carwash-vehicles-v1";
export const ATTENDANCE_STORAGE_KEY = "carwash-attendance-v1";
export const EMPLOYEES_STORAGE_KEY = "carwash-employees-v1";
export const USERS_STORAGE_KEY = "carwash-users-v1";

export const createVehicleForm = (store: StoreName): VehicleFormState => ({
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

export const createAttendanceForm = (store: StoreName): AttendanceFormState => ({
  employeeCode: "",
  employeeName: "",
  role: "",
  store,
  notes: "",
});

export const createEmployeeForm = (store: StoreName): EmployeeFormState => ({
  employeeCode: "",
  employeeName: "",
  role: "",
  store,
});

export const createLoginForm = (): LoginFormState => ({
  email: "",
  password: "",
});

export const createPasswordResetForm = (): PasswordResetFormState => ({
  email: "",
  password: "",
  confirmPassword: "",
});

export const createAccountPasswordForm = (): AccountPasswordFormState => ({
  password: "",
  confirmPassword: "",
});

export const createUserForm = (): UserFormState => ({
  fullName: "",
  email: "",
  password: "",
  employeeCode: "",
  store: STORES[0],
  jobTitle: "",
  role: "operator",
});

export const createVehicleFilters = (): VehicleFiltersState => ({
  search: "",
  date: "",
  status: "all",
  salesPerson: "",
  store: "all",
});

export const DEFAULT_ADMIN_USER: UserEntry = {
  id: "default-admin",
  authUserId: null,
  fullName: "System Administrator",
  email: "admin@example.com",
  employeeCode: "ADMIN-001",
  store: STORES[0],
  jobTitle: "Administrator",
  role: "admin",
  isBlocked: false,
  blockedAt: null,
  createdAt: new Date().toISOString(),
};
