import {
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  // * matches all URLs, the ? makes it optional so it will match / as well
  route("/", "./pages/Home.tsx"),
  route("*", "./pages/catchall.tsx"),
] satisfies RouteConfig;
