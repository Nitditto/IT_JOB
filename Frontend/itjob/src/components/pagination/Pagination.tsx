export const Pagination = ({ list, page, setPage, searchParams, setSearchParams }: any)=>{
  return (
    <>
            {list.length > 6 && (
              <div className="mt-[30px] flex">
                <select
                value={page}
                  onChange={(e) => {setPage(parseInt(e.target.value));setSearchParams({...searchParams, ["page"]: e.target.value})}}
                  className="border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:border-blue-500 bg-white"
                >
                  {Array(Math.ceil(list.length / 6))
                    .fill(0)
                    .map((_, index) => (
                      <option key={index} value={index + 1}>{`Trang ${index + 1}`}</option>
                    ))}
                </select>
              </div>
            )}
    </>
  )
}