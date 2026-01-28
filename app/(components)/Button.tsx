import { ReactNode } from "react";
import clsx from "clsx";

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "outline";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {

  const base =
    "px-5 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center";

  const variants = {
    primary:
      "bg-lightText text-white dark:bg-darkText dark:text-black " +
      "hover:shadow-glowBlue dark:hover:shadow-glowGreen",
    outline:
      "border border-current hover:bg-lightText/10 dark:hover:bg-darkText/10",
  };

  return (
    <button
      className={clsx(base, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
