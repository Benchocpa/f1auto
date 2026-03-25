import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AttendanceEntry, EmployeeEntry, UserEntry, VehicleEntry } from "../types";
import type { AppRepository } from "../data/repository";

interface UsePersistentAppDataParams {
  attendance: AttendanceEntry[];
  employees: EmployeeEntry[];
  repository: AppRepository;
  setAttendance: Dispatch<SetStateAction<AttendanceEntry[]>>;
  setEmployees: Dispatch<SetStateAction<EmployeeEntry[]>>;
  setUsers: Dispatch<SetStateAction<UserEntry[]>>;
  setVehicles: Dispatch<SetStateAction<VehicleEntry[]>>;
  users: UserEntry[];
  vehicles: VehicleEntry[];
}

export function usePersistentAppData({
  attendance,
  employees,
  repository,
  setAttendance,
  setEmployees,
  setUsers,
  setVehicles,
  users,
  vehicles,
}: UsePersistentAppDataParams) {
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const isSavingEnabledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const snapshot = await repository.load();
        if (cancelled) return;

        setVehicles(snapshot.vehicles);
        setAttendance(snapshot.attendance);
        setEmployees(snapshot.employees);
        setUsers(snapshot.users);
        isSavingEnabledRef.current = true;
        setHydrationError(null);
      } catch (error) {
        if (cancelled) return;

        const message =
          error instanceof Error ? error.message : "Unable to load application data.";
        setHydrationError(message);
        isSavingEnabledRef.current = false;
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [repository, setAttendance, setEmployees, setUsers, setVehicles]);

  useEffect(() => {
    if (!isSavingEnabledRef.current) return;
    void repository.saveVehicles(vehicles);
  }, [repository, vehicles]);

  useEffect(() => {
    if (!isSavingEnabledRef.current) return;
    void repository.saveAttendance(attendance);
  }, [attendance, repository]);

  useEffect(() => {
    if (!isSavingEnabledRef.current) return;
    void repository.saveEmployees(employees);
  }, [employees, repository]);

  useEffect(() => {
    if (!isSavingEnabledRef.current) return;
    void repository.saveUsers(users);
  }, [repository, users]);

  return { hydrationError, isHydrated };
}
