import React from "react";

type SliderProps = React.PropsWithChildren<{
  className?: string;
  [key: string]: unknown;
}>;

const Slider: React.FC<SliderProps> = ({ className, children }) => {
  return <div className={className}>{children}</div>;
};

export default Slider;
