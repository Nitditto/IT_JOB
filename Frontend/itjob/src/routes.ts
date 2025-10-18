import {
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  // * matches all URLs, the ? makes it optional so it will match / as well
  route("/", "./pages/Home.tsx"),
  route("/search/", "./pages/search/page.tsx"), // trang kết quả tìm kiếm
  route("/job/detail/:id", "./pages/job/detail/page.tsx"),
  route("/dashboard/profile", "./pages/dashboard/profile/page.tsx"),

  route("/company/cv/list", "./pages/company/cv/list/page.tsx"),
  route("/company/cv/detail/:id", "./pages/company/cv/detail/page.tsx"),
  route("/company/detail", "./pages/company/detail/page.tsx"),
  route("/company/job/create", "./pages/company/job/create/page.tsx"),
  route("/company/job/list", "./pages/company/job/list/page.tsx"),
  route("/admin/company/register", "./pages/company/register/page.tsx"),
  
  
  route("/user/cv", "./pages/user/cv/list/page.tsx"),
  route("/user/profile", "./pages/user/profile/page.tsx"),

  route("/login", "./pages/login/page.tsx"),
  route("/register", "./pages/register/page.tsx"),

  route("/dashboard", "./pages/dashboard/page.tsx", [
      {
      path: "list",
      file: "./pages/dashboard/list/page.tsx"
      },
      {
        path: "company/job",
        file: "./pages/dashboard/company/job/page.tsx"
      }
    ]),

  route("*", "./pages/catchall.tsx"),
] satisfies RouteConfig;
