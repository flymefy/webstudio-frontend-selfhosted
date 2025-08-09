import React from "react";

type Props = React.ComponentPropsWithoutRef<"script"> & { strategy?: string };

const NextScript: React.FC<Props> = ({ strategy: _strategy, ...props }) => {
  return <script {...props} />;
};

export default NextScript;
