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
