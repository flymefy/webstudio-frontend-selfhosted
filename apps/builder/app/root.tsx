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
import "/workspace/node_modules/.pnpm/react-toastify@10.0.6_react-dom@18.3.0-canary-14898b6a9-20240318_react@18.3.0-canary-14898b6a_auynrosdih2mhgn3sl42vogbg4/node_modules/react-toastify/dist/ReactToastify.css";
import "/workspace/node_modules/.pnpm/aos@2.3.4/node_modules/aos/dist/aos.css";
import "/workspace/node_modules/.pnpm/rc-slider@11.1.8_react-dom@18.3.0-canary-14898b6a9-20240318_react@18.3.0-canary-14898b6a9-202_n4whn22pmofkpza4etaucjwzb4/node_modules/rc-slider/assets/index.css";
import "/workspace/node_modules/.pnpm/slick-carousel@1.8.1_jquery@3.7.1/node_modules/slick-carousel/slick/slick.css";
import "/workspace/node_modules/.pnpm/slick-carousel@1.8.1_jquery@3.7.1/node_modules/slick-carousel/slick/slick-theme.css";
import "/workspace/node_modules/.pnpm/photoswipe@5.4.4/node_modules/photoswipe/dist/photoswipe.css";
import "/workspace/node_modules/.pnpm/antd@5.26.7_date-fns@3.6.0_react-dom@18.3.0-canary-14898b6a9-20240318_react@18.3.0-canary-148_t4tmztuegg4nnivdm4l4dzpaxm/node_modules/antd/dist/reset.css";

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
