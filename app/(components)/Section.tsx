import { ReactNode } from "react";

export default function Section({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <section className="space-y-4 py-6">
      <h2 className="text-3xl font-bold">{title}</h2>
      {subtitle && <p className="opacity-90">{subtitle}</p>}
      {children}
    </section>
  );
}
