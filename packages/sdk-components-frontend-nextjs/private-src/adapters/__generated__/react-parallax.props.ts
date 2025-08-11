import type { PropMeta } from "@webstudio-is/sdk";

export const props: Record<string, PropMeta> = {
  bgImage: { required: false, control: "text", type: "string" },
  className: {
    required: false,
    control: "text",
    type: "string",
    description: "",
  },
  strength: { required: false, control: "number", type: "number" },
};
