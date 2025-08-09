export function useRouter() {
  return {
    push: (_url: string) => {},
    replace: (_url: string) => {},
    back: () => {},
    refresh: () => {},
    prefetch: (_url: string) => {},
  } as const;
}

export function usePathname() {
  return "/";
}

export function useSearchParams() {
  return new URLSearchParams();
}
