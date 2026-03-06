import { useEffect, useState } from 'react' 
import { IoMdSearch } from 'react-icons/io'
import type { Location, Tag } from '../../types'
import { Funnel, Plus, Check, MapPin } from 'lucide-react' 
import { Button } from '../ui/button'
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
import type { JobFilterParams } from '../../types'
import { useNavigate, useSearchParams } from 'react-router';

const FilterDialogContent = ({
  setDialogOpen,
  onApplyFilters,
  currentFilters,
  tags, 
  companyList
}: {
  setDialogOpen: (open: boolean) =>void,
  onApplyFilters: (newFilters: Partial<JobFilterParams>) => void,
  currentFilters: Partial<JobFilterParams>,
  tags: Array<Tag>,
  companyList: Array<any>
}) =>{
  // State này chỉ dùng bên trong Modal
  const [tempSalaryRange, setTempSalaryRange] = useState([currentFilters.minSalary || 100, currentFilters.maxSalary || 10000]);
  const [tempPosition, setTempPosition] = useState<string[]>(currentFilters.position || []);
  const [tempWorkstyle, setTempWorkstyle] = useState<string[]>(currentFilters.workstyle || []);
  const [tempTags, setTempTags] = useState<string[]>(currentFilters.tags || []);
  const [selectedCompany, setSelectedCompany] = useState(0);
  // const [salaryRange,setSalaryRange]=useState([10,10000])

  const handleApplyFilter=()=>{
    onApplyFilters({
      position: tempPosition,
      workstyle: tempWorkstyle,
      minSalary: tempSalaryRange[0],
      maxSalary: tempSalaryRange[1],
      tags: tempTags,
      companyID: selectedCompany
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
                variant={tempPosition.includes("intern") ? "default" : "outline"}
                onClick={() => {
                  const newPosition = tempPosition.includes("intern")
                    ? tempPosition.filter(l => l !== "intern")
                    : [...tempPosition, "intern"];
                  setTempPosition(newPosition);
                }}
                className={`p-2 px-3 rounded-md text-base cursor-pointer transition-colors
                  ${tempPosition.includes("intern") 
                    ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                    : "border border-indigo-400 text-indigo-500 hover:bg-indigo-100"}`}
              >
                Intern {tempPosition.includes("intern") 
                  ? <Check className="ml-2 h-4 w-4" /> 
                  : <Plus className="ml-2 h-4 w-4" />}
              </Badge>
              <Badge 
                variant={tempPosition.includes("fresher") ? "default" : "outline"}
                onClick={() => {
                  const newPosition = tempPosition.includes("fresher")
                    ? tempPosition.filter(l => l !== "fresher")
                    : [...tempPosition, "fresher"];
                  setTempPosition(newPosition);
                }}
                className={`p-2 px-3 rounded-md text-base cursor-pointer transition-colors
                  ${tempPosition.includes("fresher") 
                    ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                    : "border border-indigo-400 text-indigo-500 hover:bg-indigo-100"}`}
              >
                Fresher {tempPosition.includes("fresher") 
                  ? <Check className="ml-2 h-4 w-4" /> 
                  : <Plus className="ml-2 h-4 w-4" />}
              </Badge>
              <Badge 
                variant={tempPosition.includes("middle") ? "default" : "outline"}
                onClick={() => {
                  const newPosition = tempPosition.includes("middle")
                    ? tempPosition.filter(l => l !== "middle")
                    : [...tempPosition, "middle"];
                  setTempPosition(newPosition);
                }}
                className={`p-2 px-3 rounded-md text-base cursor-pointer transition-colors
                  ${tempPosition.includes("middle") 
                    ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                    : "border border-indigo-400 text-indigo-500 hover:bg-indigo-100"}`}
              >
                Middle {tempPosition.includes("middle") 
                  ? <Check className="ml-2 h-4 w-4" /> 
                  : <Plus className="ml-2 h-4 w-4" />}
              </Badge>
              <Badge 
                variant={tempPosition.includes("junior") ? "default" : "outline"}
                onClick={() => {
                  const newPosition = tempPosition.includes("junior")
                    ? tempPosition.filter(l => l !== "junior")
                    : [...tempPosition, "junior"];
                  setTempPosition(newPosition);
                }}
                className={`p-2 px-3 rounded-md text-base cursor-pointer transition-colors
                  ${tempPosition.includes("junior") 
                    ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                    : "border border-indigo-400 text-indigo-500 hover:bg-indigo-100"}`}
              >
                Junior {tempPosition.includes("junior") 
                  ? <Check className="ml-2 h-4 w-4" /> 
                  : <Plus className="ml-2 h-4 w-4" />}
              </Badge>
              <Badge 
                variant={tempPosition.includes("senior") ? "default" : "outline"}
                onClick={() => {
                  const newPosition = tempPosition.includes("senior")
                    ? tempPosition.filter(l => l !== "senior")
                    : [...tempPosition, "senior"];
                  setTempPosition(newPosition);
                }}
                className={`p-2 px-3 rounded-md text-base cursor-pointer transition-colors
                  ${tempPosition.includes("senior") 
                    ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                    : "border border-indigo-400 text-indigo-500 hover:bg-indigo-100"}`}
              >
                Senior {tempPosition.includes("senior") 
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
                variant={tempWorkstyle.includes("onsite") ? "default" : "outline"}
                onClick={() => {
                  const newStyles = tempWorkstyle.includes("onsite")
                    ? tempWorkstyle.filter(s => s !== "onsite")
                    : [...tempWorkstyle, "onsite"];
                  setTempWorkstyle(newStyles);
                }}
                className={`p-2 px-3 rounded-md text-base cursor-pointer transition-colors
                  ${tempWorkstyle.includes("onsite") 
                    ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                    : "border border-indigo-400 text-indigo-500 hover:bg-indigo-100"}`}
              >
                Tại văn phòng 
                {tempWorkstyle.includes("onsite")
                  ? <Check className='ml-2 h-4 w-4' />
                  : <Plus className='ml-2 h-4 w-4' />
                }
              </Badge>
              <Badge 
                variant={tempWorkstyle.includes("remote") ? "default" : "outline"}
                onClick={() => {
                  const newStyles = tempWorkstyle.includes("remote")
                    ? tempWorkstyle.filter(s => s !== "remote")
                    : [...tempWorkstyle, "remote"];
                  setTempWorkstyle(newStyles);
                }}
                className={`p-2 px-3 rounded-md text-base cursor-pointer transition-colors
                  ${tempWorkstyle.includes("remote") 
                    ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                    : "border border-indigo-400 text-indigo-500 hover:bg-indigo-100"}`}
              >
                Làm từ xa
                {tempWorkstyle.includes("remote")
                  ? <Check className='ml-2 h-4 w-4' />
                  : <Plus className='ml-2 h-4 w-4' />
                }
              </Badge>
              <Badge 
                variant={tempWorkstyle.includes("hybrid") ? "default" : "outline"}
                onClick={() => {
                  const newStyles = tempWorkstyle.includes("hybrid")
                    ? tempWorkstyle.filter(s => s !== "hybrid")
                    : [...tempWorkstyle, "hybrid"];
                  setTempWorkstyle(newStyles);
                }}
                className={`p-2 px-3 rounded-md text-base cursor-pointer transition-colors
                  ${tempWorkstyle.includes("hybrid") 
                    ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                    : "border border-indigo-400 text-indigo-500 hover:bg-indigo-100"}`}
              >
                Linh hoạt
                {tempWorkstyle.includes("hybrid")
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
                {
                  tags.map((tag, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox id={tag.tag} 
                    checked={tempTags.includes(tag.tag)}
                    onCheckedChange={(checked) => {
                      const newTags = checked
                        ? [...tempTags, tag.tag]
                        : tempTags.filter(s => s !== tag.tag); 
                      setTempTags(newTags);
                    }} />
                  <label htmlFor={tag.tag} className="text-sm">{tag.tag}</label>
                </div>
                  ))
                }
              </div>
            </ScrollArea>
          </div>

          <div>
            <label className="font-semibold text-lg mb-3 block">Công ty</label>
            <Input placeholder="Tìm kiếm công ty..." className="h-[46px]" />
            <ScrollArea className="h-[200px] mt-3 border rounded-md p-4">
              <div className="space-y-3">
                {
                  companyList.map((company, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox id={company.id} 
                    checked={company.id == selectedCompany}
                    onCheckedChange={(checked) => {
                      checked && setSelectedCompany(company.id);
                    }} />
                  <label htmlFor={company.id} className="text-sm">{company.name}</label>
                </div>
                  ))
                }
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
  locations,
  tags,
  companyList
}: { 
  locations: Array<Location>,
  tags: Array<Tag>,
  companyList: Array<any>
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();  
  
  const [isFilterDialogOpen,setIsFilterDialogOpen] = useState(false)

  const [query, setQuery] = useState(searchParams.get('query') || "");
  const [location, setLocation] = useState(searchParams.get('location') || "");
  const [filters, setFilters] = useState<Partial<JobFilterParams>>({
    position: searchParams.getAll('position') || [],
    workstyle: searchParams.getAll('workstyle') || [],
    minSalary: Number(searchParams.get('minSalary')) || 10,
    maxSalary: Number(searchParams.get('maxSalary')) || 10000,
    tags: searchParams.getAll('tags') || [],
    companyID: Number(searchParams.get('companyID')) || 0
  });
  useEffect(() => {
    setQuery(searchParams.get('query') || "");
    setLocation(searchParams.get('location') || "");
    setFilters({
      position: searchParams.getAll('position') || [],
      workstyle: searchParams.getAll('workstyle') || [],
      minSalary: Number(searchParams.get('minSalary')) || 10,
      maxSalary: Number(searchParams.get('maxSalary')) || 10000,
      tags: searchParams.getAll('tags') || [],
      companyID: Number(searchParams.get('companyID')) || 0
    });
  }, [searchParams]);

  const navigateToSearch = (newFilters: Partial<JobFilterParams> = {}) => {
    
    // Gộp filter từ Dialog (newFilters) với filter từ thanh search (query, location)
    const allFilters = {
      ...filters,
      ...newFilters,
      query: query,
      location: location,
    };

    // Tạo URL Query String
    const params = new URLSearchParams();
    if (allFilters.query) params.set('query', allFilters.query);
    if (allFilters.location) params.set('location', allFilters.location);
    if (allFilters.minSalary && allFilters.minSalary !== 10) params.set('minSalary', allFilters.minSalary.toString());
    if (allFilters.maxSalary && allFilters.maxSalary !== 10000) params.set('maxSalary', allFilters.maxSalary.toString());
    
    allFilters.position?.forEach(level => params.append('position', level));
    allFilters.workstyle?.forEach(style => params.append('workstyle', style));
    allFilters.tags?.forEach(skill => params.append('tags', skill));
    if (allFilters.companyID && allFilters.companyID !== 0) params.set('companyID', allFilters.companyID.toString());
    navigate(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigateToSearch();
      }}
      className="flex flex-col gap-y-[12px] mb-[30px] w-full max-w-5xl mx-auto"
    >
      <div className="flex flex-col md:flex-row bg-white dark:bg-slate-800 rounded-[30px] p-2 shadow-lg border border-black/5 dark:border-white/10 relative z-20">
        
        {/* Location Dropdown - Left side of the pill */}
        <div className="flex items-center sm:w-auto md:w-[260px] md:border-r border-slate-200 dark:border-slate-700 px-3 py-2 md:py-0">
          <MapPin size={20} className="text-slate-400 mr-2 flex-shrink-0" />
          <select
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full h-full bg-transparent font-medium text-[15px] text-slate-800 dark:text-slate-100 outline-none cursor-pointer appearance-none pr-8 relative"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em'
            }}
          >
            <option value="" className="dark:bg-slate-800">Tất cả địa điểm</option>
            {locations.map((obj) => (
              <option key={obj.abbreviation} value={obj.abbreviation} className="dark:bg-slate-800">{obj.name}</option>
            ))}
          </select>
        </div>
        
        {/* Keyword Search & Filter - Middle of the pill */}
        <div className="flex-1 flex items-center px-4 py-2 md:py-0 border-t md:border-t-0 border-slate-200 dark:border-slate-700">
          <IoMdSearch size={22} className="text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            className="w-full bg-transparent outline-none font-medium text-[15px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            placeholder="Tìm kiếm kỹ năng, chức danh, công ty..."
            name="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          
          <button 
            type="button" 
            onClick={() => setIsFilterDialogOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-300"
          >
            <Funnel size={18} />
            <span className="hidden sm:inline-block text-sm font-medium">Lọc</span>
          </button>
        </div>

        {/* Search Button - Right side of the pill */}
        <button
          type="button"
          onClick={() => navigateToSearch()}
          className="mt-2 md:mt-0 w-full md:w-auto min-w-[140px] h-[48px] rounded-[24px] bg-[#00b14f] hover:bg-[#00b14f]/90 transition-all font-bold text-[16px] text-white px-6 shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer"
        >
          Tìm kiếm
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
          }}
          tags={tags}
          companyList={companyList}/>
        </DialogContent>
      </Dialog>
    </form>
  )
}

export default SearchBar