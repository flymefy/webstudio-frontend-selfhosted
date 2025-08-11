import type { PropMeta } from "@webstudio-is/sdk";

export const props: Record<string, PropMeta> = {
  length: { required: true, control: "number", type: "number" },
  name: {
    description:
      "Returns the name of the function. Function names are read-only and can not be changed.",
    required: true,
    control: "text",
    type: "string",
  },
};
