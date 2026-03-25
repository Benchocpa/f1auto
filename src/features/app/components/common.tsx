import type { ReactNode } from "react";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function HomeCard({
  icon,
  title,
  description,
  buttonLabel,
  onClick,
  disabled = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/15 text-amber-100">
        {icon}
      </div>
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-300">{description}</p>
      <div className="mt-6">
        <Button type="button" onClick={onClick} disabled={disabled}>
          {buttonLabel}
        </Button>
      </div>
    </article>
  );
}

export function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-300/20 text-amber-200">
        {icon}
      </div>
      <p className="text-sm text-stone-300">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-stone-400">{detail}</p>
    </article>
  );
}

export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
