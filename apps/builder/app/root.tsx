// Our root outlet doesn't contain a layout because we have 2 types of documents: canvas and builder and we need to decide down the line which one to render, thre is no single root document.
import {
  Outlet,
  json,
  useLoaderData,
  type ShouldRevalidateFunction,
} from "@remix-run/react";
import { setEnv } from "@webstudio-is/feature-flags";
import env from "./env/env.server";
import { useSetFeatures } from "./shared/use-set-features";

// Global vendor styles used by vendor pages/components
import "react-toastify/dist/ReactToastify.css";
import "aos/dist/aos.css";
import "/workspace/node_modules/.pnpm/rc-slider@11.1.8_react-dom@18.3.0-canary-14898b6a9-20240318_react@18.3.0-canary-14898b6a9-202_n4whn22pmofkpza4etaucjwzb4/node_modules/rc-slider/assets/index.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "photoswipe/dist/photoswipe.css";
import "antd/dist/reset.css";

export const loader = () => {
  return json({
    features: env.FEATURES,
  });
};

export default function App() {
  const { features } = useLoaderData<typeof loader>();
  setEnv(features);
  useSetFeatures();

  return <Outlet />;
}

export const shouldRevalidate: ShouldRevalidateFunction = () => {
  return false;
};
