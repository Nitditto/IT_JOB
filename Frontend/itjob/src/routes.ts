import {
  type RouteConfig,
  route, layout
} from "@react-router/dev/routes";

export default [
  // * matches all URLs, the ? makes it optional so it will match / as well
  route("/", "./pages/Home.tsx"),
  route("/search/", "./pages/search/page.tsx"), // trang kết quả tìm kiếm
  

  route("/company/cv/detail/:id", "./pages/company/cv/detail/page.tsx"),
  route("/company/:id", "./pages/company/page.tsx"),
  
  route("/job/:id", "./pages/job/page.tsx"),

  route("/job/:id/apply","./pages/job/jobApply/page.tsx"),
  route("job/apply/success","./pages/job/jobApplySuccess/page.tsx"),

  route("/user/cv", "./pages/user/cv/list/page.tsx"),

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
      },
      {
        path: "company/cv/list",
        file: "./pages/company/cv/list/page.tsx",
      },
      {
        path: "setting",
        file: "./pages/dashboard/settings/page.tsx"
      },
      {
        path: "settings/user-profile", 
        file: "./pages/dashboard/settings/profile/UserProfile/page.tsx"
      },
      {
        path: "settings/company-profile", 
        file: "./pages/dashboard/settings/profile/CompanyProfile/page.tsx"
      },
      {
        path: "company/job/create",
        file: "./pages/dashboard/company/job/create/page.tsx"
      },
      {
        path: "admin/register",
        file : "./pages/dashboard/admin/register/page.tsx"
      },
      {
        path: "company/job/:id/edit",
        file: "./pages/dashboard/company/job/edit/page.tsx"
      }
    ]),

  

  route("*", "./pages/catchall.tsx"),
] satisfies RouteConfig;
