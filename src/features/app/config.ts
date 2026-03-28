import type {
  AccountPasswordFormState,
  AttendanceFormState,
  DeviceStoreSettings,
  EmployeeFormState,
  LoginFormState,
  PasswordResetFormState,
  StoreName,
  StoreFormState,
  UserEntry,
  UserFormState,
  VehicleFiltersState,
  VehicleFormState,
} from "./types";
import { getCurrentTime, getTodayDate } from "./utils";

export const DEFAULT_LOCATION_NAME = "Main location";

export const VEHICLE_STORAGE_KEY = "carwash-vehicles-v1";
export const ATTENDANCE_STORAGE_KEY = "carwash-attendance-v1";
export const EMPLOYEES_STORAGE_KEY = "carwash-employees-v1";
export const USERS_STORAGE_KEY = "carwash-users-v1";
export const PAYROLL_CLOSURES_STORAGE_KEY = "carwash-payroll-closures-v1";
export const DEVICE_STORE_SETTINGS_KEY = "carwash-device-store-settings-v1";
export const STORES_STORAGE_KEY = "carwash-stores-v1";

export const createVehicleForm = (store: StoreName = DEFAULT_LOCATION_NAME): VehicleFormState => ({
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

export const createAttendanceForm = (store: StoreName = DEFAULT_LOCATION_NAME): AttendanceFormState => ({
  employeeCode: "",
  employeeName: "",
  role: "",
  store,
  notes: "",
});

export const createEmployeeForm = (store: StoreName = DEFAULT_LOCATION_NAME): EmployeeFormState => ({
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

export const createDeviceStoreSettings = (store: StoreName = DEFAULT_LOCATION_NAME): DeviceStoreSettings => ({
  isConfigured: false,
  store,
});

export const createStoreForm = (): StoreFormState => ({
  name: "",
  address: "",
  phone: "",
  logoKey: "",
});

export const createUserForm = (store: StoreName = DEFAULT_LOCATION_NAME): UserFormState => ({
  fullName: "",
  email: "",
  password: "",
  employeeCode: "",
  store,
  jobTitle: "",
  role: "operator",
});

export const createVehicleFilters = (): VehicleFiltersState => ({
  search: "",
  datePreset: "today",
  date: getTodayDate(),
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
  store: DEFAULT_LOCATION_NAME,
  jobTitle: "Administrator",
  role: "admin",
  isBlocked: false,
  blockedAt: null,
  createdAt: new Date().toISOString(),
};
