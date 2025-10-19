
import { IoMdSearch } from 'react-icons/io'
import type { Location } from '../../types'

const SearchBar = ({locations}: {locations: Array<Location>}) => {

  const formSubmit = (formData: FormData) => {
      // const request = axios.get()
      console.log(`region: ${formData.get("region")}, query: ${formData.get("query")}`)
  }
  return (
    <form
      action={formSubmit}
      className="flex gap-x-[15px] gap-y-[12px] mb-[30px] md:flex-nowrap flex-wrap"
    >
      <select
        name="region"
        className="md:w-[240px] w-full h-[56px] rounded-[4px] bg-white font-[500] text-[16px] text-[#121212] px-[20px]"
      >
        <option value="">Tất cả thành phố</option>
        {locations.map(obj =>
          <option value={obj.abbreviation}>{obj.name}</option>
        )}
      </select>
      <input
        type="text"
        className="md:flex-1 w-full h-[56px] rounded-[4px] bg-white font-[500] text-[16px] text-[#121212] px-[20px]"
        placeholder="Nhập từ khóa..."
        name="query"
      />
      <button type="submit" className="flex items-center justify-center gap-x-[10px] md:w-[240px] w-full h-[56px] rounded-[4px] bg-[#0088FF] font-[500] text-[16px] text-[#fff] px-[20px] cursor-pointer">
        <IoMdSearch className="text-[26px]" /> Tìm kiếm
      </button>
    </form>
  )
}

export default SearchBar