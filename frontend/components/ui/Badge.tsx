import { cn } from "@/lib/utils";

type Status = "available" | "reserved" | "collecting" | "collected" | "deleted";

const config: Record<Status, { label: string; className: string }> = {
  available: { label: "Свободен", className: "bg-border text-text-muted" },
  reserved: { label: "Зарезервирован", className: "bg-warning/20 text-warning" },
  collecting: { label: "Идёт сбор", className: "bg-accent/20 text-accent" },
  collected: { label: "Собрано", className: "bg-success/20 text-success" },
  deleted: { label: "Снят", className: "bg-danger/20 text-danger" },
};

export default function Badge({ status }: { status: Status }) {
  const { label, className } = config[status] ?? config.available;
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", className)}>
      {label}
    </span>
  );
}
