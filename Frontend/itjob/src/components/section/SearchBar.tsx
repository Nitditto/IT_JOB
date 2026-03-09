import { useEffect, useRef, useState } from 'react'
import { IoMdSearch } from 'react-icons/io'
import type { Location, Tag } from '../../types'
import { Funnel, Plus, Check, MapPin, Sparkles } from 'lucide-react'
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
import { getSmartSearchSuggestions } from '../../utils/gemini';

const FilterDialogContent = ({
  setDialogOpen,
  onApplyFilters,
  currentFilters,
  tags,
  companyList
}: {
  setDialogOpen: (open: boolean) => void,
  onApplyFilters: (newFilters: Partial<JobFilterParams>) => void,
  currentFilters: Partial<JobFilterParams>,
  tags: Array<Tag>,
  companyList: Array<any>
}) => {
  const [tempSalaryRange, setTempSalaryRange] = useState([currentFilters.minSalary || 100, currentFilters.maxSalary || 10000]);
  const [tempPosition, setTempPosition] = useState<string[]>(currentFilters.position || []);
  const [tempWorkstyle, setTempWorkstyle] = useState<string[]>(currentFilters.workstyle || []);
  const [tempTags, setTempTags] = useState<string[]>(currentFilters.tags || []);
  const [selectedCompany, setSelectedCompany] = useState(0);

  const handleApplyFilter = () => {
    onApplyFilters({
      position: tempPosition,
      workstyle: tempWorkstyle,
      minSalary: tempSalaryRange[0],
      maxSalary: tempSalaryRange[1],
      tags: tempTags,
      companyID: selectedCompany
    });
    setDialogOpen(false)
  }

  const positionOptions = ['intern', 'fresher', 'junior', 'middle', 'senior'] as const;
  const positionLabels: Record<string, string> = { intern: 'Intern', fresher: 'Fresher', junior: 'Junior', middle: 'Middle', senior: 'Senior' };
  const workstyleOptions = ['onsite', 'remote', 'hybrid'] as const;
  const workstyleLabels: Record<string, string> = { onsite: 'Tại văn phòng', remote: 'Làm từ xa', hybrid: 'Linh hoạt' };

  return (
    <>
      <DialogHeader className="p-6 rounded-tr-3xl rounded-tl-3xl pb-4 bg-gray-50 border-b">
        <DialogTitle className="text-2xl font-bold">Bộ lọc</DialogTitle>
      </DialogHeader>
      <ScrollArea className="max-h-[60vh]">
        <div className="px-6 pb-6 space-y-6">
          {/* Cấp bậc */}
          <div>
            <label className="font-semibold text-lg mb-3 block">Cấp bậc</label>
            <div className="flex flex-wrap gap-2">
              {positionOptions.map((pos) => (
                <Badge
                  key={pos}
                  variant={tempPosition.includes(pos) ? "default" : "outline"}
                  onClick={() => {
                    const newPosition = tempPosition.includes(pos)
                      ? tempPosition.filter(l => l !== pos)
                      : [...tempPosition, pos];
                    setTempPosition(newPosition);
                  }}
                  className={`p-2 px-3 rounded-md text-base cursor-pointer transition-colors
                    ${tempPosition.includes(pos)
                      ? "bg-indigo-500 text-white hover:bg-indigo-600"
                      : "border border-indigo-400 text-indigo-500 hover:bg-indigo-100"}`}
                >
                  {positionLabels[pos]} {tempPosition.includes(pos)
                    ? <Check className="ml-2 h-4 w-4" />
                    : <Plus className="ml-2 h-4 w-4" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Hình thức làm việc */}
          <div>
            <label className="font-semibold text-lg mb-3 block">Hình thức làm việc</label>
            <div className="flex flex-wrap gap-2">
              {workstyleOptions.map((ws) => (
                <Badge
                  key={ws}
                  variant={tempWorkstyle.includes(ws) ? "default" : "outline"}
                  onClick={() => {
                    const newStyles = tempWorkstyle.includes(ws)
                      ? tempWorkstyle.filter(s => s !== ws)
                      : [...tempWorkstyle, ws];
                    setTempWorkstyle(newStyles);
                  }}
                  className={`p-2 px-3 rounded-md text-base cursor-pointer transition-colors
                    ${tempWorkstyle.includes(ws)
                      ? "bg-indigo-500 text-white hover:bg-indigo-600"
                      : "border border-indigo-400 text-indigo-500 hover:bg-indigo-100"}`}
                >
                  {workstyleLabels[ws]}
                  {tempWorkstyle.includes(ws)
                    ? <Check className='ml-2 h-4 w-4' />
                    : <Plus className='ml-2 h-4 w-4' />
                  }
                </Badge>
              ))}
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

      <DialogFooter className="p-6 rounded-br-3xl rounded-bl-3xl bg-gray-50 border-t flex justify-between">
        <Button className='cursor-pointer text-indigo-600' variant="ghost" onClick={() => console.log("Xóa bộ lọc")}>Xoá bộ lọc</Button>
        <Button type="button" onClick={handleApplyFilter} className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer text-white">
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

  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)

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

  // AI Smart Search
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (value.length >= 3) {
      debounceTimer.current = setTimeout(async () => {
        setAiLoading(true);
        try {
          const suggestions = await getSmartSearchSuggestions(value, tags.map(t => t.tag));
          setAiSuggestions(suggestions);
        } catch { setAiSuggestions([]); }
        finally { setAiLoading(false); }
      }, 800);
    } else {
      setAiSuggestions([]);
    }
  };

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
    const allFilters = {
      ...filters,
      ...newFilters,
      query: query,
      location: location,
    };

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

        {/* Location Dropdown */}
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

        {/* Keyword Search & Filter */}
        <div className="flex-1 flex items-center px-4 py-2 md:py-0 border-t md:border-t-0 border-slate-200 dark:border-slate-700">
          <IoMdSearch size={22} className="text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            className="w-full bg-transparent outline-none font-medium text-[15px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            placeholder="Tìm kiếm kỹ năng, chức danh, công ty..."
            name="query"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
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

        {/* Search Button */}
        <button
          type="button"
          onClick={() => navigateToSearch()}
          className="mt-2 md:mt-0 w-full md:w-auto min-w-[140px] h-[48px] rounded-[24px] bg-indigo-600 hover:bg-indigo-700 transition-all font-bold text-[16px] text-white px-6 shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer"
        >
          Tìm kiếm
        </button>
      </div>

      {/* AI Smart Search Suggestions */}
      {(aiSuggestions.length > 0 || aiLoading) && (
        <div className="flex items-center gap-2 flex-wrap px-2">
          <div className="flex items-center gap-1 text-xs font-medium text-indigo-300">
            {aiLoading ? (
              <div className="w-3 h-3 border-2 border-indigo-300 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles size={12} />
            )}
            AI gợi ý:
          </div>
          {aiSuggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setQuery(s); setAiSuggestions([]); navigateToSearch(); }}
              className="text-xs px-3 py-1 rounded-full bg-white/10 text-white font-medium hover:bg-white/20 transition-colors cursor-pointer backdrop-blur-sm border border-white/10"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className='min-w-[800px] border-0 p-0 bg-white'>
          <FilterDialogContent
            setDialogOpen={setIsFilterDialogOpen}
            currentFilters={filters}
            onApplyFilters={(newFilters) => {
              setFilters(prev => ({ ...prev, ...newFilters }))
              navigateToSearch(newFilters)
            }}
            tags={tags}
            companyList={companyList} />
        </DialogContent>
      </Dialog>
    </form>
  )
}

export default SearchBar