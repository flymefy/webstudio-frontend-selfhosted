import React from "react";

type Props = React.PropsWithChildren<Record<string, unknown>>;

export default function Stub(props: Props) {
  return React.createElement("div", { "data-stub": true }, props.children);
}

export const DatePicker = Stub;
export const Tabs = Stub;
export const Tab = Stub;
export const TabList = Stub;
export const TabPanel = Stub;
export const ToastContainer = Stub;
export const Slider = Stub;
export const Range = Stub;
export const Swiper = Stub as unknown as React.FC<Props>;
export const SwiperSlide = Stub as unknown as React.FC<Props>;
export const Parallax = Stub;
export const ModalVideo = Stub;
export const GoogleMapReact = Stub;
export const Map = Stub;
export const Provider = Stub;
export const Container = Stub;
export const Button = Stub;
export const Input = Stub;
export const Select = Stub;
export const Checkbox = Stub;
export const Radio = Stub;
export const TabsList = Stub;
export const TabsTrigger = Stub;
export const TabsContent = Stub;

export const Navigation = {};
export const Pagination = {};
export const Scrollbar = {};
export const Thumbs = {};
export const FreeMode = {};
export const EffectCards = {};