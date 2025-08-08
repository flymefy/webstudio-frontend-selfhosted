import type { ComponentProps } from "react";

export type SampleProps = {
  label?: string;
  variant?: "primary" | "secondary";
} & ComponentProps<"button">;

export const Sample = ({
  label = "Sample",
  variant = "primary",
  ...rest
}: SampleProps) => {
  return (
    <button data-variant={variant} {...rest}>
      {label}
    </button>
  );
};
