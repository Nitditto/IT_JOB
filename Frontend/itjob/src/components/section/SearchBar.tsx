import { useEffect, useState } from 'react' 
import { IoMdSearch } from 'react-icons/io'
import type { Location } from '../../types'
import { Calendar as CalendarIcon, X, Funnel, Plus, Check } from 'lucide-react' 
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
import type { JobFilterParams } from '../../types'
import { useNavigate, useSearchParams } from 'react-router';
// const defaultFilters: JobFilterParams = {
//   query: "",
//   region: "",
//   levels: [],
//   workStyles: [],
//   minSalary: 100,
//   maxSalary: 10000,
//   skills: []
// };
const FilterDialogContent = ({
  setDialogOpen,
  onApplyFilters,
  currentFilters
}: {
  setDialogOpen: (open: boolean) =>void,
  onApplyFilters: (newFilters: Partial<JobFilterParams>) => void,
  currentFilters: Partial<JobFilterParams>
}) =>{
  // State này chỉ dùng bên trong Modal
  const [tempSalaryRange, setTempSalaryRange] = useState([currentFilters.minSalary || 100, currentFilters.maxSalary || 10000]);
  const [tempLevels, setTempLevels] = useState<string[]>(currentFilters.levels || []);
  const [tempWorkStyles, setTempWorkStyles] = useState<string[]>(currentFilters.workStyles || []);
  const [tempSkills, setTempSkills] = useState<string[]>(currentFilters.skills || []);

  // const [salaryRange,setSalaryRange]=useState([10,10000])

  const handleApplyFilter=()=>{
    onApplyFilters({
      levels: tempLevels,
      workStyles: tempWorkStyles,
      minSalary: tempSalaryRange[0],
      maxSalary: tempSalaryRange[1],
      skills: tempSkills
    });
    // console.log(salaryRange);
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
              <Badge 
                variant={tempLevels.includes("intern") ? "default" : "outline"}
                onClick={() => {
                  const newLevels = tempLevels.includes("intern")
                    ? tempLevels.filter(l => l !== "intern")
                    : [...tempLevels, "intern"];
                  setTempLevels(newLevels);
                }}
                className={`p-2 px-3 rounded-md text-base cursor-pointer transition-colors
                  ${tempLevels.includes("intern") 
                    ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                    : "border border-indigo-400 text-indigo-500 hover:bg-indigo-100"}`}
              >
                Intern {tempLevels.includes("intern") 
                  ? <Check className="ml-2 h-4 w-4" /> 
                  : <Plus className="ml-2 h-4 w-4" />}
              </Badge>
              <Badge 
                variant={tempLevels.includes("fresher") ? "default" : "outline"}
                onClick={() => {
                  const newLevels = tempLevels.includes("fresher")
                    ? tempLevels.filter(l => l !== "fresher")
                    : [...tempLevels, "fresher"];
                  setTempLevels(newLevels);
                }}
                className={`p-2 px-3 rounded-md text-base cursor-pointer transition-colors
                  ${tempLevels.includes("fresher") 
                    ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                    : "border border-indigo-400 text-indigo-500 hover:bg-indigo-100"}`}
              >
                Fresher {tempLevels.includes("fresher") 
                  ? <Check className="ml-2 h-4 w-4" /> 
                  : <Plus className="ml-2 h-4 w-4" />}
              </Badge>
              <Badge 
                variant={tempLevels.includes("middle") ? "default" : "outline"}
                onClick={() => {
                  const newLevels = tempLevels.includes("middle")
                    ? tempLevels.filter(l => l !== "middle")
                    : [...tempLevels, "middle"];
                  setTempLevels(newLevels);
                }}
                className={`p-2 px-3 rounded-md text-base cursor-pointer transition-colors
                  ${tempLevels.includes("middle") 
                    ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                    : "border border-indigo-400 text-indigo-500 hover:bg-indigo-100"}`}
              >
                Middle {tempLevels.includes("middle") 
                  ? <Check className="ml-2 h-4 w-4" /> 
                  : <Plus className="ml-2 h-4 w-4" />}
              </Badge>
              <Badge 
                variant={tempLevels.includes("junior") ? "default" : "outline"}
                onClick={() => {
                  const newLevels = tempLevels.includes("junior")
                    ? tempLevels.filter(l => l !== "junior")
                    : [...tempLevels, "junior"];
                  setTempLevels(newLevels);
                }}
                className={`p-2 px-3 rounded-md text-base cursor-pointer transition-colors
                  ${tempLevels.includes("junior") 
                    ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                    : "border border-indigo-400 text-indigo-500 hover:bg-indigo-100"}`}
              >
                Junior {tempLevels.includes("junior") 
                  ? <Check className="ml-2 h-4 w-4" /> 
                  : <Plus className="ml-2 h-4 w-4" />}
              </Badge>
              <Badge 
                variant={tempLevels.includes("senior") ? "default" : "outline"}
                onClick={() => {
                  const newLevels = tempLevels.includes("senior")
                    ? tempLevels.filter(l => l !== "senior")
                    : [...tempLevels, "senior"];
                  setTempLevels(newLevels);
                }}
                className={`p-2 px-3 rounded-md text-base cursor-pointer transition-colors
                  ${tempLevels.includes("senior") 
                    ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                    : "border border-indigo-400 text-indigo-500 hover:bg-indigo-100"}`}
              >
                Senior {tempLevels.includes("senior") 
                  ? <Check className="ml-2 h-4 w-4" /> 
                  : <Plus className="ml-2 h-4 w-4" />}
              </Badge>
            </div>
          </div>
          
          {/* Hình thức làm việc */}
          <div>
            <label className="font-semibold text-lg mb-3 block">Hình thức làm việc</label>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={tempWorkStyles.includes("onsite") ? "default" : "outline"}
                onClick={() => {
                  const newStyles = tempWorkStyles.includes("onsite")
                    ? tempWorkStyles.filter(s => s !== "onsite")
                    : [...tempWorkStyles, "onsite"];
                  setTempWorkStyles(newStyles);
                }}
                className={`p-2 px-3 rounded-md text-base cursor-pointer transition-colors
                  ${tempWorkStyles.includes("onsite") 
                    ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                    : "border border-indigo-400 text-indigo-500 hover:bg-indigo-100"}`}
              >
                Tại văn phòng 
                {tempWorkStyles.includes("onsite")
                  ? <Check className='ml-2 h-4 w-4' />
                  : <Plus className='ml-2 h-4 w-4' />
                }
              </Badge>
              <Badge 
                variant={tempWorkStyles.includes("remote") ? "default" : "outline"}
                onClick={() => {
                  const newStyles = tempWorkStyles.includes("remote")
                    ? tempWorkStyles.filter(s => s !== "remote")
                    : [...tempWorkStyles, "remote"];
                  setTempWorkStyles(newStyles);
                }}
                className={`p-2 px-3 rounded-md text-base cursor-pointer transition-colors
                  ${tempWorkStyles.includes("remote") 
                    ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                    : "border border-indigo-400 text-indigo-500 hover:bg-indigo-100"}`}
              >
                Làm từ xa
                {tempWorkStyles.includes("remote")
                  ? <Check className='ml-2 h-4 w-4' />
                  : <Plus className='ml-2 h-4 w-4' />
                }
              </Badge>
              <Badge 
                variant={tempWorkStyles.includes("hybrid") ? "default" : "outline"}
                onClick={() => {
                  const newStyles = tempWorkStyles.includes("hybrid")
                    ? tempWorkStyles.filter(s => s !== "hybrid")
                    : [...tempWorkStyles, "hybrid"];
                  setTempWorkStyles(newStyles);
                }}
                className={`p-2 px-3 rounded-md text-base cursor-pointer transition-colors
                  ${tempWorkStyles.includes("hybrid") 
                    ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                    : "border border-indigo-400 text-indigo-500 hover:bg-indigo-100"}`}
              >
                Linh hoạt
                {tempWorkStyles.includes("hybrid")
                  ? <Check className='ml-2 h-4 w-4' />
                  : <Plus className='ml-2 h-4 w-4' />
                }
              </Badge>
            </div>
          </div>
          
          {/* Mức lương */}
          <div>
            <div className="font-semibold text-lg mb-3 block">Mức lương</div>
            <div className="flex gap-5 items-center">
              <div className="flex gap-1 text-sm  mt-2">
              <span>{tempSalaryRange[0]}$</span> - <span>{tempSalaryRange[1]}$</span>
            </div>
            <Slider 
              className="border border-gray-400 p-3 rounded-full w-[70%]"
              value={tempSalaryRange}
              onValueChange={setTempSalaryRange} 
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
                  <Checkbox id="skill-nextjs" 
                    checked={tempSkills.includes("NextJS")}
                    onCheckedChange={(checked) => {
                      const newSkills = checked
                        ? [...tempSkills, "NextJS"]
                        : tempSkills.filter(s => s !== "NextJS"); 
                      setTempSkills(newSkills);
                    }} />
                  <label htmlFor="skill-nextjs" className="text-sm">NextJS</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="skill-nodejs" 
                    checked={tempSkills.includes("NodeJS")}
                    onCheckedChange={(checked) => {
                      const newSkills = checked
                        ? [...tempSkills, "NodeJS"] // Thêm "NodeJS"
                        : tempSkills.filter(s => s !== "NodeJS"); // Bỏ "NodeJS"
                      setTempSkills(newSkills);
                    }} />
                  <label htmlFor="skill-nodejs" className="text-sm">NodeJS</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="skill-fullstackJava" 
                    checked={tempSkills.includes("Fullstack Java")}
                    onCheckedChange={(checked) => {
                      const newSkills = checked
                        ? [...tempSkills, "Fullstack Java"]
                        : tempSkills.filter(s => s !== "Fullstack Java"); 
                      setTempSkills(newSkills);
                    }} />
                  <label htmlFor="skill-fullstackJava" className="text-sm">Fullstack Java</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="skill-backendJava" 
                    checked={tempSkills.includes("Backend Java")}
                    onCheckedChange={(checked) => {
                      const newSkills = checked
                        ? [...tempSkills, "Backend Java"]
                        : tempSkills.filter(s => s !== "Backend Java"); 
                      setTempSkills(newSkills);
                    }} />
                  <label htmlFor="skill-backendJava" className="text-sm">Backend Java</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="skill-react" 
                    checked={tempSkills.includes("React")}
                    onCheckedChange={(checked) => {
                      const newSkills = checked
                        ? [...tempSkills, "React"]
                        : tempSkills.filter(s => s !== "React"); 
                      setTempSkills(newSkills);
                    }}
                  />
                  <label htmlFor="skill-react" className="text-sm">React</label>
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

const SearchBar = ({ 
  locations
}: { 
  locations: Array<Location>}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();  
  
  const [isFilterDialogOpen,setIsFilterDialogOpen] = useState(false)

  const [query, setQuery] = useState(searchParams.get('query') || "");
  const [region, setRegion] = useState(searchParams.get('region') || "");
  const [filters, setFilters] = useState<Partial<JobFilterParams>>({
    levels: searchParams.getAll('levels') || [],
    workStyles: searchParams.getAll('workStyles') || [],
    minSalary: Number(searchParams.get('minSalary')) || 10,
    maxSalary: Number(searchParams.get('maxSalary')) || 10000,
    skills: searchParams.getAll('skills') || [],
  });
  useEffect(() => {
    setQuery(searchParams.get('query') || "");
    setRegion(searchParams.get('region') || "");
    setFilters({
      levels: searchParams.getAll('levels') || [],
      workStyles: searchParams.getAll('workStyles') || [],
      minSalary: Number(searchParams.get('minSalary')) || 10,
      maxSalary: Number(searchParams.get('maxSalary')) || 10000,
      skills: searchParams.getAll('skills') || [],
    });
  }, [searchParams]);

  const navigateToSearch = (newFilters: Partial<JobFilterParams> = {}) => {
    
    // Gộp filter từ Dialog (newFilters) với filter từ thanh search (query, region)
    const allFilters = {
      ...filters,
      ...newFilters,
      query: query,
      region: region,
    };

    // Tạo URL Query String
    const params = new URLSearchParams();
    if (allFilters.query) params.set('query', allFilters.query);
    if (allFilters.region) params.set('region', allFilters.region);
    if (allFilters.minSalary && allFilters.minSalary !== 10) params.set('minSalary', allFilters.minSalary.toString());
    if (allFilters.maxSalary && allFilters.maxSalary !== 10000) params.set('maxSalary', allFilters.maxSalary.toString());
    
    allFilters.levels?.forEach(level => params.append('levels', level));
    allFilters.workStyles?.forEach(style => params.append('workStyles', style));
    allFilters.skills?.forEach(skill => params.append('skills', skill));
    
    // ĐIỀU HƯỚNG!
    // Thao tác này sẽ tự động tải lại trang /search
    navigate(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={(e)=>{
        e.preventDefault();
        navigateToSearch();
      }}
      className="flex flex-col gap-x-[15px] gap-y-[12px] mb-[30px] flex-wrap"
    >
      <div className="flex gap-x-[15px] gap-y-[12px] md:flex-nowrap flex-wrap">
        <select
          name="region"
          value={region}
          onChange={(e)=>setRegion(e.target.value)}
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
            className="w-full bg-transparent outline-none"
            placeholder="Nhập từ khóa..."
            name="query"
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
          />
          {/* Nút bật/tắt tìm kiếm nâng cao */}
          <Funnel 
            className="cursor-pointer text-gray-400 hover:text-gray-600"
            onClick={() => setIsFilterDialogOpen(true)}
          />
        </div>

        <button
          type="button"
          onClick={()=>navigateToSearch()}
          className="flex items-center justify-center gap-x-[10px] md:w-[240px] w-full h-[56px] rounded-[4px] bg-[#0088FF] font-[500] text-[16px] text-[#fff] px-[20px] cursor-pointer"
        >
          <IoMdSearch className="text-[26px]" /> Tìm kiếm
        </button>
      </div>

      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className='min-w-[800px] border-0 p-0 bg-white'>
          <FilterDialogContent 
          setDialogOpen={setIsFilterDialogOpen}
          currentFilters={filters}
          onApplyFilters={(newFilters)=>{
            setFilters(prev=>({...prev,...newFilters}))
            navigateToSearch(newFilters)
          }}/>
        </DialogContent>
      </Dialog>
    </form>
  )
}

export default SearchBar