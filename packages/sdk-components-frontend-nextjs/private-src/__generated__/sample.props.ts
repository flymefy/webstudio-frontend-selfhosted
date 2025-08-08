import type { PropMeta } from "@webstudio-is/sdk";

export const props: Record<string, PropMeta> = {
  label: {
    required: false,
    control: "text",
    type: "string",
    defaultValue: "Sample",
    description: "User-visible label",
  },
  variant: {
    required: false,
    control: "radio",
    type: "string",
    defaultValue: "primary",
    options: ["primary", "secondary"],
  },
};
