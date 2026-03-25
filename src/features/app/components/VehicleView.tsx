import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Textarea } from "../../../components/ui/textarea";
import { STORES, createVehicleFilters, createVehicleForm } from "../config";
import type {
  Language,
  StoreName,
  Translate,
  UserEntry,
  VehicleEntry,
  VehicleFiltersState,
  VehicleFormState,
  VehicleStatus,
} from "../types";
import { formatCurrency, formatDateWithWeekday, formatTimestamp } from "../utils";
import { Field } from "./common";

interface VehicleViewProps {
  activeStore: StoreName;
  areVehicleFiltersVisible: boolean;
  availableMakes: string[];
  availableSalesPeople: string[];
  currentUser: UserEntry;
  filteredVehicles: VehicleEntry[];
  language: Language;
  makeFilter: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  setAreVehicleFiltersVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setMakeFilter: React.Dispatch<React.SetStateAction<string>>;
  setVehicleFilters: React.Dispatch<React.SetStateAction<VehicleFiltersState>>;
  setVehicleForm: React.Dispatch<React.SetStateAction<VehicleFormState>>;
  t: Translate;
  todaySales: number;
  updateVehicleDeliveredTime: (id: string, deliveredTime: string) => void;
  updateVehicleStatus: (id: string, status: VehicleStatus) => void;
  vehicleFilters: VehicleFiltersState;
  vehicleForm: VehicleFormState;
}

export function VehicleView({
  activeStore,
  areVehicleFiltersVisible,
  availableMakes,
  availableSalesPeople,
  currentUser,
  filteredVehicles,
  language,
  makeFilter,
  onSubmit,
  setAreVehicleFiltersVisible,
  setMakeFilter,
  setVehicleFilters,
  setVehicleForm,
  t,
  todaySales,
  updateVehicleDeliveredTime,
  updateVehicleStatus,
  vehicleFilters,
  vehicleForm,
}: VehicleViewProps) {
  return (
    <section className="space-y-6">
      <div className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{t("Vehicle intake", "Ingreso de vehiculos")}</p>
            <h2 className="panel-title">
              {t("Digital daily intake form", "Captura digital de la hoja diaria")}
            </h2>
          </div>
          <Badge variant="secondary">{activeStore}</Badge>
        </div>

        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={onSubmit}>
          <Field label={t("Date", "Fecha")}>
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
            <p className="text-xs text-stone-400">{formatDateWithWeekday(vehicleForm.date, language)}</p>
          </Field>

          <Field label={t("Drop-off time", "Hora de entrada")}>
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

          <Field label={t("Pickup time", "Hora de recogida")}>
            <Input
              type="time"
              value={vehicleForm.pickupTime}
              onChange={(event) =>
                setVehicleForm((current) => ({
                  ...current,
                  pickupTime: event.target.value,
                }))
              }
            />
          </Field>

          <Field label={t("Stock / Plate", "Stock / Placa")}>
            <Input
              value={vehicleForm.stock}
              onChange={(event) =>
                setVehicleForm((current) => ({
                  ...current,
                  stock: event.target.value,
                }))
              }
              placeholder={t("Internal number or plate", "Numero interno o placa")}
              required
            />
          </Field>

          <Field label={t("Sales person", "Sales Person")}>
            <Input
              value={vehicleForm.salesPerson}
              onChange={(event) =>
                setVehicleForm((current) => ({
                  ...current,
                  salesPerson: event.target.value,
                }))
              }
              placeholder={t("Receiving employee", "Empleado que recibe")}
              required
            />
          </Field>

          <Field label={t("Make", "Marca")}>
            <Input
              value={vehicleForm.make}
              onChange={(event) =>
                setVehicleForm((current) => ({
                  ...current,
                  make: event.target.value,
                }))
              }
              placeholder={t("Brand", "Marca")}
              required
            />
          </Field>

          <Field label={t("Model", "Modelo")}>
            <Input
              value={vehicleForm.model}
              onChange={(event) =>
                setVehicleForm((current) => ({
                  ...current,
                  model: event.target.value,
                }))
              }
              placeholder={t("Model", "Modelo")}
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
              placeholder={t("VIN or identifier", "VIN o identificador")}
            />
          </Field>

          <Field label={t("Price", "Precio")}>
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

          <Field label={t("Service / SIMO", "SIMO / Servicio")} className="md:col-span-2 xl:col-span-3">
            <Input
              value={vehicleForm.simo}
              onChange={(event) =>
                setVehicleForm((current) => ({
                  ...current,
                  simo: event.target.value,
                }))
              }
              placeholder={t("Service type, package, or SIMO", "Tipo de servicio, paquete o SIMO")}
            />
          </Field>

          <Field label={t("Comments", "Comentarios")} className="md:col-span-2 xl:col-span-3">
            <Textarea
              value={vehicleForm.comments}
              onChange={(event) =>
                setVehicleForm((current) => ({
                  ...current,
                  comments: event.target.value,
                }))
              }
              placeholder={t("Vehicle notes or instructions", "Observaciones del vehiculo o instrucciones")}
            />
          </Field>

          <div className="md:col-span-2 xl:col-span-3 flex flex-wrap gap-3">
            <Button type="submit">{t("Save vehicle", "Guardar ingreso")}</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setVehicleForm(createVehicleForm(activeStore))}
            >
              {t("Clear form", "Limpiar formulario")}
            </Button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{t("Daily operations", "Operacion diaria")}</p>
            <h2 className="panel-title">{t("Vehicle operations board", "Panel operativo de vehiculos")}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAreVehicleFiltersVisible((current) => !current)}
            >
              {areVehicleFiltersVisible ? t("Hide filters", "Ocultar filtros") : t("Filters", "Filtros")}
            </Button>
            <Badge variant="secondary">{filteredVehicles.length} {t("results", "resultados")}</Badge>
            <Badge variant="success">{formatCurrency(todaySales)}</Badge>
          </div>
        </div>

        {areVehicleFiltersVisible ? (
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-stone-200">{t("Advanced filters", "Filtros avanzados")}</p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setVehicleFilters(createVehicleFilters());
                  setMakeFilter("Todas");
                }}
              >
                {t("Reset filters", "Reiniciar filtros")}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label={t("Search", "Busqueda")}>
                <Input
                  value={vehicleFilters.search}
                  onChange={(event) =>
                    setVehicleFilters((current) => ({
                      ...current,
                      search: event.target.value,
                    }))
                  }
                  placeholder={t("Stock, make, VIN, service...", "Stock, marca, VIN, servicio...")}
                />
              </Field>

              <Field label={t("Date", "Fecha")}>
                <Input
                  type="date"
                  value={vehicleFilters.date}
                  onChange={(event) =>
                    setVehicleFilters((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field label={t("Status", "Estado")}>
                <Select
                  value={vehicleFilters.status}
                  onChange={(event) =>
                    setVehicleFilters((current) => ({
                      ...current,
                      status: event.target.value as VehicleFiltersState["status"],
                    }))
                  }
                >
                  <option value="all">{t("All statuses", "Todos los estados")}</option>
                  <option value="Pendiente">{t("Pending", "Pendiente")}</option>
                  <option value="Completo">{t("Complete", "Completo")}</option>
                </Select>
              </Field>

              <Field label={t("Make", "Marca")}>
                <Select value={makeFilter} onChange={(event) => setMakeFilter(event.target.value)}>
                  <option value="Todas">{t("All makes", "Todas las marcas")}</option>
                  {availableMakes.map((make) => (
                    <option key={make} value={make}>
                      {make}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t("Sales person", "Vendedor")}>
                <Select
                  value={vehicleFilters.salesPerson || "all"}
                  onChange={(event) =>
                    setVehicleFilters((current) => ({
                      ...current,
                      salesPerson: event.target.value === "all" ? "" : event.target.value,
                    }))
                  }
                >
                  <option value="all">{t("All sales people", "Todos los vendedores")}</option>
                  {availableSalesPeople.map((person) => (
                    <option key={person} value={person}>
                      {person}
                    </option>
                  ))}
                </Select>
              </Field>

              {currentUser.role === "admin" ? (
                <Field label={t("Store", "Tienda")}>
                  <Select
                    value={vehicleFilters.store}
                    onChange={(event) =>
                      setVehicleFilters((current) => ({
                        ...current,
                        store: event.target.value as VehicleFiltersState["store"],
                      }))
                    }
                  >
                    <option value="all">{t("All stores", "Todas las tiendas")}</option>
                    {STORES.map((store) => (
                      <option key={store} value={store}>
                        {store}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : null}
            </div>
          </div>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t("Date", "Fecha")}</TableHead>
              <TableHead>{t("Stock", "Stock")}</TableHead>
              <TableHead>{t("Store", "Tienda")}</TableHead>
              <TableHead>{t("Make / Model", "Make / Model")}</TableHead>
              <TableHead>VIN</TableHead>
              <TableHead>{t("Sales person", "Sales Person")}</TableHead>
              <TableHead>{t("Drop-off", "Entrada")}</TableHead>
              <TableHead>{t("Pickup", "Recogida")}</TableHead>
              <TableHead>{t("Delivered", "Entrega real")}</TableHead>
              <TableHead>{t("Service", "SIMO")}</TableHead>
              <TableHead>{t("Comments", "Comentarios")}</TableHead>
              <TableHead>{t("Price", "Precio")}</TableHead>
              <TableHead>{t("Status", "Estado")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVehicles.length ? (
              filteredVehicles.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDateWithWeekday(entry.date, language)}</TableCell>
                  <TableCell className="font-medium">{entry.stock}</TableCell>
                  <TableCell>{entry.store}</TableCell>
                  <TableCell>{`${entry.make} ${entry.model}`}</TableCell>
                  <TableCell>{entry.vin || "-"}</TableCell>
                  <TableCell>{entry.salesPerson}</TableCell>
                  <TableCell>{entry.time}</TableCell>
                  <TableCell>{entry.pickupTime || "-"}</TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={entry.deliveredTime}
                      onChange={(event) => updateVehicleDeliveredTime(entry.id, event.target.value)}
                      className="min-w-[120px]"
                    />
                  </TableCell>
                  <TableCell>{entry.simo || "-"}</TableCell>
                  <TableCell className="max-w-[220px]">{entry.comments || "-"}</TableCell>
                  <TableCell>{formatCurrency(entry.price)}</TableCell>
                  <TableCell>
                    <Select
                      value={entry.status}
                      onChange={(event) => updateVehicleStatus(entry.id, event.target.value as VehicleStatus)}
                      className="min-w-[130px]"
                    >
                      <option value="Pendiente">{t("Pending", "Pendiente")}</option>
                      <option value="Completo">{t("Complete", "Completo")}</option>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={13} className="py-8 text-center text-stone-400">
                  {t("No vehicles match the selected filters.", "No hay vehiculos que coincidan con los filtros seleccionados.")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="mt-6 border-t border-white/10 pt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">{t("Vehicle history", "Historial de vehiculos")}</p>
              <h3 className="text-xl font-semibold text-white">{t("Recent activity timeline", "Linea de tiempo reciente")}</h3>
            </div>
            <Badge variant="secondary">{filteredVehicles.length}</Badge>
          </div>

          <div className="space-y-4">
            {filteredVehicles.length ? (
              filteredVehicles.slice(0, 8).map((entry) => (
                <article key={`history-${entry.id}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {entry.make} {entry.model}
                      </p>
                      <p className="text-sm text-stone-300">
                        {entry.store} · {entry.stock} · {entry.salesPerson}
                      </p>
                    </div>
                    <div className="text-sm text-stone-300">
                      {t("Last update", "Ultima actualizacion")}: {formatTimestamp(entry.updatedAt, language)}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-stone-300 md:grid-cols-2 xl:grid-cols-4">
                    <span>{t("Status", "Estado")}: {entry.status === "Completo" ? t("Complete", "Completo") : t("Pending", "Pendiente")}</span>
                    <span>{t("Pickup target", "Recogida estimada")}: {entry.pickupTime || "-"}</span>
                    <span>{t("Actual delivery", "Entrega real")}: {entry.deliveredTime || "-"}</span>
                    <span>{t("Updated by", "Actualizado por")}: {entry.updatedBy}</span>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                    {entry.history.slice(0, 4).map((eventItem) => (
                      <div
                        key={eventItem.id}
                        className="rounded-xl border border-white/10 bg-stone-900/60 px-3 py-2 text-sm text-stone-300"
                      >
                        <span className="font-medium text-white">{eventItem.note}</span>
                        <span className="ml-2 text-stone-400">
                          {formatTimestamp(eventItem.timestamp, language)} · {eventItem.by}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-stone-400">
                {t(
                  "No recent vehicle history is available for these filters.",
                  "No hay historial reciente de vehiculos para estos filtros."
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
