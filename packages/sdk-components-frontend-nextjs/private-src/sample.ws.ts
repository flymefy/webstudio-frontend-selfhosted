import type { WsComponentMeta } from "@webstudio-is/sdk";

// If you generated __generated__/sample.props.ts, you can import as:
// import { props } from "./__generated__/sample.props";

export const meta: WsComponentMeta = {
  label: "Sample Button",
  initialProps: ["label", "variant", "id", "class"],
  props: {
    label: { type: "string", control: "text" },
    variant: {
      type: "string",
      control: "radio-group",
      options: ["primary", "secondary"],
    },
  },
};
