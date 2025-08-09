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
  if (typeof window === "undefined") return "/";
  return window.location.pathname || "/";
}

export function useSearchParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

export function useParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params: Record<string, string> = {};
  const sp = new URLSearchParams(window.location.search);
  for (const [k, v] of sp.entries()) params[k] = v;
  if (params.id == null) {
    const parts = (window.location.pathname || "/").split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && last.includes("-") === false)
      params.id = decodeURIComponent(last);
  }
  return params;
}
