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
  route("/dashboard/profile", "./pages/dashboard/profile/page.tsx"),

  route("/company/cv/list", "./pages/company/cv/list/page.tsx"),
  route("/company/cv/detail/:id", "./pages/company/cv/detail/page.tsx"),
  route("/company/detail", "./pages/company/detail/page.tsx"),
  route("/company/job/create", "./pages/company/job/create/page.tsx"),
  route("/company/job/list", "./pages/company/job/list/page.tsx"),
  route("/company/login", "./pages/company/login/page.tsx"),
  route("/company/register", "./pages/company/register/page.tsx"),

  route("/user/cv/list", "./pages/user/cv/list/page.tsx"),
  route("/user/login", "./pages/user/login/page.tsx"),
  route("/user/register", "./pages/user/register/page.tsx"),
  route("/user/profile", "./pages/user/profile/page.tsx"),

  // route("/dashboard/job", "./pages/dashboard/job/page.tsx"),
  // route("/dashboard/job/create", "./pages/dashboard/job/create/page.tsx"),
  route("/dashboard/list", "./pages/dashboard/list/page.tsx"),
  // route("/dashboard/detail/:id", "./pages/dashboard/detail/page.tsx"),

  route("*", "./pages/catchall.tsx"),
] satisfies RouteConfig;
