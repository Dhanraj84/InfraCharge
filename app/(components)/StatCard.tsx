import { ReactNode } from "react";

export default function StatCard({
  title,
  value,
  icon,
  className = "",
}: {
  title: string;
  value: string | number | ReactNode;
  icon?: string;
  className?: string;
}) {
  return (
    <div className={`card p-5 space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      <p className="text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}
