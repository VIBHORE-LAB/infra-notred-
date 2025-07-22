import type { LazyExoticComponent, ComponentType, JSX } from "react";

export type AppRoute = {
  title: string;
  path: string;
  subRoutes: Record<string, AppRoute>;
  kind: "public" | "private" | "independent";
  Skeleton?: ComponentType<any> | (() => JSX.Element);
  Element: LazyExoticComponent<ComponentType<any>> | ComponentType<any>;
};
