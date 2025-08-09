import React from "react";

type ParallaxProps = React.PropsWithChildren<{
  strength?: number;
  bgImage?: string;
  className?: string;
}>;

export const Parallax: React.FC<ParallaxProps> = ({
  strength: _s,
  bgImage,
  className,
  children,
}) => {
  const style: React.CSSProperties = bgImage
    ? {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {};
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
};
