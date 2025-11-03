import { useState } from 'react' 
import { IoMdSearch } from 'react-icons/io'
import type { Location } from '../../types'
import { Calendar as CalendarIcon, X, Funnel, Plus } from 'lucide-react' 
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker' 
import { Button } from '../ui/button'
import { Calendar } from '../ui/calendar' 
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Slider } from '../ui/slider'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Checkbox } from '../ui/checkbox'
import { ScrollArea } from '../ui/scroll-area'
import { Fa0 } from 'react-icons/fa6'

const FilterDialogContent = ({ setDialogOpen }: { setDialogOpen: (open: boolean) => void }) =>{
  const [salaryRange,setSalaryRange]=useState([10,10000])
  const handleApplyFilter=()=>{
    console.log(salaryRange);
    setDialogOpen(false)
  }

  return (
    <>
      <DialogHeader className="p-6 rounded-tr-3xl rounded-tl-3xl pb-4 bg-gray-50 border-b">
        <DialogTitle className="text-2xl font-bold">Bộ lọc</DialogTitle>
      </DialogHeader>
      {/* Thêm ScrollArea để nội dung dài có thể cuộn */}
      <ScrollArea className="max-h-[60vh]">
        <div className="px-6 pb-6 space-y-6">
          {/* Cấp bậc */}
          <div>
            <label className="font-semibold text-lg mb-3 block">Cấp bậc</label>
            <div className="flex flex-wrap gap-2">
              {/* Đây là các Badge. Tốt hơn nên dùng component ToggleGroup của shadcn
                để làm các nút bấm chọn. Nhưng để cho giống ảnh, ta dùng Badge.
              */}
              <Badge variant="outline" className="p-2 px-3 rounded-md text-base cursor-pointer hover:bg-gray-100">
                Intern <Plus className="ml-2 h-4 w-4" />
              </Badge>
              <Badge variant="outline" className="p-2 px-3 rounded-md text-base cursor-pointer hover:bg-gray-100">
                Fresher <Plus className="ml-2 h-4 w-4" />
              </Badge>
              <Badge variant="outline" className="p-2 px-3 rounded-md text-base cursor-pointer hover:bg-gray-100">
                Middle <Plus className="ml-2 h-4 w-4" />
              </Badge>
              <Badge variant="outline" className="p-2 px-3 rounded-md text-base cursor-pointer hover:bg-gray-100">
                Junior <Plus className="ml-2 h-4 w-4" />
              </Badge>
              <Badge variant="outline" className="p-2 px-3 rounded-md text-base cursor-pointer hover:bg-gray-100">
                Senior <Plus className="ml-2 h-4 w-4" />
              </Badge>
            </div>
          </div>
          
          {/* Hình thức làm việc */}
          <div>
            <label className="font-semibold text-lg mb-3 block">Hình thức làm việc</label>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="p-2 px-3 rounded-md text-base cursor-pointer hover:bg-gray-100">
                Tại văn phòng <Plus className="ml-2 h-4 w-4" />
              </Badge>
              <Badge variant="outline" className="p-2 px-3 rounded-md text-base cursor-pointer hover:bg-gray-100">
                Làm từ xa <Plus className="ml-2 h-4 w-4" />
              </Badge>
              <Badge variant="outline" className="p-2 px-3 rounded-md text-base cursor-pointer hover:bg-gray-100">
                Linh hoạt <Plus className="ml-2 h-4 w-4" />
              </Badge>
            </div>
          </div>
          
          {/* Mức lương */}
          <div>
            <div className="font-semibold text-lg mb-3 block">Mức lương</div>
            <div className="flex gap-5 items-center">
              <div className="flex gap-1 text-sm  mt-2">
              <span>{salaryRange[0]}$</span> - <span>{salaryRange[1]}$</span>
            </div>
            <Slider 
              className="border border-gray-400 p-3 rounded-full w-[70%]"
              value={salaryRange}
              onValueChange={setSalaryRange} 
              min={100}
              max={10000}
              step={10}
            />
            </div>
          </div>
          
          {/* Lĩnh vực công việc */}
          <div>
            <label className="font-semibold text-lg mb-3 block">Lĩnh vực công việc</label>
            <Input placeholder="Tìm kiếm lĩnh vực..." className="h-[46px]" />
            {/* ScrollArea cho danh sách checkbox */}
            <ScrollArea className="h-[200px] mt-3 border rounded-md p-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="field-1" />
                  <label htmlFor="field-1" className="text-sm">NodeJS</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="field-2" />
                  <label htmlFor="field-2" className="text-sm">NextJS</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="field-2" />
                  <label htmlFor="field-2" className="text-sm">Fullstack Java</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="field-2" />
                  <label htmlFor="field-2" className="text-sm">Backend Java</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="field-2" />
                  <label htmlFor="field-2" className="text-sm">React</label>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </ScrollArea>
      
      {/* Nút bấm ở chân Dialog */}
      <DialogFooter className="p-6 rounded-br-3xl rounded-bl-3xl bg-gray-50 border-t flex justify-between">
          <Button className='cursor-pointer text-indigo-600' variant="ghost" onClick={() => console.log("Xóa bộ lọc")}>Xoá bộ lọc</Button>
          <Button type="button" onClick={handleApplyFilter} className="bg-[#FF0000] hover:bg-[#FF0000]/90 cursor-pointer text-white">
            Áp dụng
          </Button>
      </DialogFooter>
    </>
  )
}

const SearchBar = ({ locations }: { locations: Array<Location> }) => {
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)
  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  })
  const [isFilterDialogOpen,setIsFilterDialogOpen] = useState(false)
  // ĐỔI SANG DÙNG onSubmit ĐỂ LẤY ĐƯỢC CẢ STATE VÀ FORMDATA
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() 
    const formData = new FormData(e.currentTarget)
    console.log(`region: ${formData.get('region')}`)
    console.log(`query: ${formData.get('query')}`)
    console.log(`Date from: ${date?.from}`)
    console.log(`Date to: ${date?.to}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-x-[15px] gap-y-[12px] mb-[30px] flex-wrap"
    >
      <div className="flex gap-x-[15px] gap-y-[12px] md:flex-nowrap flex-wrap">
        <select
          name="region"
          className="md:w-[240px] w-full h-[56px] rounded-[4px] bg-white font-[500] text-[16px] text-[#121212] px-[20px]"
        >
          <option value="">Tất cả thành phố</option>
          {locations.map((obj) => (
            <option key={obj.abbreviation} value={obj.abbreviation}>{obj.name}</option>
          ))}
        </select>
        
        <div className="md:flex-1 w-full h-[56px] rounded-[4px] bg-white font-[500] flex justify-between items-center text-[16px] text-[#121212] px-[20px]">
          <input
            type="text"
            className="w-full bg-transparent outline-none" // <-- Thêm bg-transparent và outline-none
            placeholder="Nhập từ khóa..."
            name="query"
          />
          {/* Nút bật/tắt tìm kiếm nâng cao */}
          <Funnel 
            className="cursor-pointer text-gray-400 hover:text-gray-600"
            onClick={() => setIsFilterDialogOpen(true)}
          />
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-x-[10px] md:w-[240px] w-full h-[56px] rounded-[4px] bg-[#0088FF] font-[500] text-[16px] text-[#fff] px-[20px] cursor-pointer"
        >
          <IoMdSearch className="text-[26px]" /> Tìm kiếm
        </button>
      </div>

      {/* {isAdvancedSearchOpen && (
        <div className="w-full bg-white p-4 rounded-[4px] shadow-md">
          <label className="font-[500] text-[14px] text-black mb-2 block">
            Bộ lọc
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={'outline'}
                className={`
                  w-full h-[56px] justify-start text-left font-normal
                  ${!date && 'text-muted-foreground'}
                `}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, 'LLL dd, y')} -{' '}
                      {format(date.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(date.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Chọn một khoảng ngày</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white">
              
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2} 
              />
            </PopoverContent>
          </Popover>
        </div>
      )} */}

      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className='min-w-[800px] border-0 p-0 bg-white'>
          <FilterDialogContent setDialogOpen={setIsFilterDialogOpen}/>
        </DialogContent>
      </Dialog>
    </form>
  )
}

export default SearchBar