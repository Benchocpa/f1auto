import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import type { AttendanceEntry, Translate } from "../types";
import { Field } from "./common";

interface ClockOutDialogProps {
  clockOutCodeInput: string;
  clockOutTarget: AttendanceEntry | null;
  onCodeInputChange: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  t: Translate;
}

export function ClockOutDialog({
  clockOutCodeInput,
  clockOutTarget,
  onCodeInputChange,
  onClose,
  onOpenChange,
  onSubmit,
  t,
}: ClockOutDialogProps) {
  const codeDigits = clockOutCodeInput.replace(/\D/g, "").slice(0, 4);

  const appendDigit = (digit: string) => {
    if (codeDigits.length >= 4) return;
    onCodeInputChange((current) => `${current.replace(/\D/g, "").slice(0, 4)}${digit}`.slice(0, 4));
  };

  const removeDigit = () => {
    onCodeInputChange((current) => current.replace(/\D/g, "").slice(0, -1));
  };

  const clearCode = () => {
    onCodeInputChange("");
  };

  const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "backspace"] as const;

  return (
    <Dialog open={Boolean(clockOutTarget)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-white/10 bg-stone-950 p-6 text-stone-100">
        <DialogHeader>
          <DialogTitle className="text-white">{t("Confirm clock-out", "Confirmar salida")}</DialogTitle>
          <DialogDescription className="text-stone-400">
            {clockOutTarget
              ? t(
                  `Enter ${clockOutTarget.employeeName}'s code to register the clock-out.`,
                  `Escribe el codigo de ${clockOutTarget.employeeName} para registrar la salida.`
                )
              : t(
                  "Enter the employee code to register the clock-out.",
                  "Escribe el codigo del empleado para registrar la salida."
                )}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label={t("Employee code", "Codigo de empleado")}>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-stone-900 text-2xl font-semibold text-white shadow-sm sm:h-16 sm:text-3xl"
                  >
                    {codeDigits[index] ?? ""}
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {keypad.map((key) => {
                  if (key === "clear") {
                    return (
                      <Button
                        key={key}
                        type="button"
                        variant="secondary"
                        className="h-14 rounded-2xl text-sm sm:h-16 sm:text-base"
                        onClick={clearCode}
                      >
                        {t("Clear", "Limpiar")}
                      </Button>
                    );
                  }

                  if (key === "backspace") {
                    return (
                      <Button
                        key={key}
                        type="button"
                        variant="secondary"
                        className="h-14 rounded-2xl text-sm sm:h-16 sm:text-base"
                        onClick={removeDigit}
                      >
                        {t("Delete", "Borrar")}
                      </Button>
                    );
                  }

                  return (
                    <Button
                      key={key}
                      type="button"
                      variant="outline"
                      className="h-14 rounded-2xl border-white/20 bg-white text-2xl font-semibold text-stone-950 hover:bg-stone-200 sm:h-16 sm:text-3xl"
                      onClick={() => appendDigit(key)}
                    >
                      {key}
                    </Button>
                  );
                })}
              </div>
            </div>
          </Field>

          {clockOutTarget ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-300">
              {clockOutTarget.employeeName} · {clockOutTarget.role} · {t("Clock in", "Entrada")} {clockOutTarget.clockIn}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit">{t("Confirm clock-out", "Confirmar salida")}</Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              {t("Cancel", "Cancelar")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
