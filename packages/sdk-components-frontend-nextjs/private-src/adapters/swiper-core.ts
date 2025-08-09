// Minimal shim for 'swiper' core to satisfy imports
export const Navigation = {} as const;
export const Autoplay = {} as const;
export const Pagination = {} as const;
export const EffectFade = {} as const;

// Some code may call SwiperCore.use([...]) in original libs
const SwiperCore = {
  use: (_modules: unknown[]) => {},
};

export default SwiperCore;
