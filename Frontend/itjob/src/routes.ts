import {
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  // * matches all URLs, the ? makes it optional so it will match / as well
  route("/", "./pages/Home.tsx"),
  route("/search", "./pages/SearchHome.tsx"), // trang chưa tìm kiếm
  route("/search/:keyword", "./pages/search/page.tsx"), // trang kết quả tìm kiếm
  route("/job/detail/:id", "./pages/job/detail/page.tsx"),
  route("/company/profile", "./pages/company/profile/page.tsx"),
  route("/company/cv/list", "./pages/company/cv/list/page.tsx"),
  route("/company/cv/detail/:id", "./pages/company/cv/detail/page.tsx"),

  route("/company/job/list", "./pages/company/job/list/page.tsx"),
  route("/company/job/create", "./pages/company/job/create/page.tsx"),
  route("/company/list", "./pages/company/list/page.tsx"),
  route("/company/detail/:id", "./pages/company/detail/page.tsx"),

  route("*", "./pages/catchall.tsx"),
] satisfies RouteConfig;
