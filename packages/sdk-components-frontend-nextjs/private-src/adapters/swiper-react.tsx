import React from "react";

export const Swiper: React.FC<
  React.PropsWithChildren<{ className?: string }>
> = ({ children, className }) => <div className={className}>{children}</div>;

export const SwiperSlide: React.FC<
  React.PropsWithChildren<{ className?: string }>
> = ({ children, className }) => <div className={className}>{children}</div>;
