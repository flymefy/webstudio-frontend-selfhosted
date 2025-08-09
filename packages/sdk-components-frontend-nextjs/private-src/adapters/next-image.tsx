import type { ImgHTMLAttributes } from "react";

type NextImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
};

export default function Image({
  src,
  alt,
  width,
  height,
  fill,
  style,
  ...rest
}: NextImageProps) {
  const resolvedStyle = fill
    ? {
        ...style,
        width: "100%",
        height: "100%",
        objectFit: (rest as any).objectFit,
      }
    : style;
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      style={resolvedStyle}
      {...rest}
    />
  );
}
