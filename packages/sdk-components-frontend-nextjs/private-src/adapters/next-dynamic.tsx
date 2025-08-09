import React from "react";

// Minimal shim for next/dynamic: accept a loader and return the loaded component directly
// This ignores SSR and loading options, sufficient for builder static usage

type Loader<T extends React.ComponentType<any>> = () =>
  | Promise<{ default: T }>
  | Promise<T>
  | T;

export default function dynamic<T extends React.ComponentType<any>>(
  loader: Loader<T>
): T {
  // Resolve to component synchronously if possible
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let Comp: any;
  try {
    const res = typeof loader === "function" ? (loader as any)() : loader;
    if (res && typeof (res as Promise<unknown>).then === "function") {
      // Can't await at build time; return a fallback simple component
      // that renders nothing to avoid runtime errors in builder templates
      return (() => null) as unknown as T;
    }
    // If loader returned a module-like with default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Comp = (res as any)?.default ?? res;
  } catch {
    return (() => null) as unknown as T;
  }
  return Comp as T;
}
