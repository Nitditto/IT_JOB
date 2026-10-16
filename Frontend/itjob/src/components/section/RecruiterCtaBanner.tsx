import { Link } from "react-router";

export const RecruiterCtaBanner = () => (
  <section className="pb-16">
    <div className="container">
      <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-slate-800 bg-slate-900 p-8 md:flex-row md:items-center md:p-10">
        <div className="max-w-xl">
          <h2 className="text-2xl font-bold text-white">Bạn đang tuyển lập trình viên?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Đăng tin tuyển dụng trên IT.JOB, nhận hồ sơ trực tiếp và quản lý trạng thái từng ứng viên trong một nơi.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Link
            to="/company-register"
            className="inline-flex items-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
          >
            Đăng ký nhà tuyển dụng
          </Link>
          <Link
            to="/dashboard/company/job/create"
            className="inline-flex items-center rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Đăng tin ngay
          </Link>
        </div>
      </div>
    </div>
  </section>
);
