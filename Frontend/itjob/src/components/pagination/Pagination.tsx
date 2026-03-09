export const Pagination = ({ list, page, setPage, searchParams, setSearchParams }: any) => {
  return (
    <>
      {list.length > 6 && (
        <div className="mt-8 flex justify-center">
          <select
            value={page}
            onChange={(e) => { setPage(parseInt(e.target.value)); setSearchParams({ ...searchParams, ["page"]: e.target.value }) }}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm cursor-pointer transition-all hover:border-indigo-300 dark:hover:border-indigo-700"
          >
            {Array(Math.ceil(list.length / 6))
              .fill(0)
              .map((_, index) => (
                <option key={index} value={index + 1} className="dark:bg-slate-900">{`Trang ${index + 1}`}</option>
              ))}
          </select>
        </div>
      )}
    </>
  )
}