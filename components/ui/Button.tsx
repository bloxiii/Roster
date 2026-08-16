import { clsx } from "clsx";
import Link from "next/link";

type CommonProps = {
  variant?: "primary" | "secondary";
  className?: string;
  children: React.ReactNode;
};

type LinkButtonProps = CommonProps &
  { href: string } &
  Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">;

type NativeButtonProps = CommonProps &
  { href?: undefined } &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

type ButtonProps = LinkButtonProps | NativeButtonProps;

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium tracking-wide transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none";

const variantStyles = {
  primary: "bg-brass text-on-brass hover:bg-brass-bright",
  secondary:
    "border border-border text-paper hover:border-brass/60 hover:text-brass-bright",
};

/** Extrait les props communes et renvoie le reste propre pour le spread. */
function splitProps(props: ButtonProps) {
  const { variant, className, children, href, ...rest } = props as CommonProps & {
    href?: string;
    [key: string]: unknown;
  };
  return { variant, className, children, href, rest };
}

export function Button(props: ButtonProps) {
  const { variant = "primary", className, children, href, rest } = splitProps(props);
  const classes = clsx(base, variantStyles[variant], className);

  if (href !== undefined) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
