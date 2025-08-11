import type { AnchorHTMLAttributes, PropsWithChildren } from "react";

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href?: string;
};

export default function Link({
  href,
  children,
  ...rest
}: PropsWithChildren<LinkProps>) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

export { Link };

export function useNavigate() {
  return (to: string) => {
    if (typeof window !== "undefined") {
      window.location.href = to;
    }
  };
}

export function useLocation() {
  if (typeof window !== "undefined") {
    const { pathname, search, hash } = window.location;
    return { pathname, search, hash, state: undefined } as const;
  }
  return { pathname: "/", search: "", hash: "", state: undefined } as const;
}
