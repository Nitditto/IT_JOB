import * as React from "react"
import { Check, PlusCircle, X } from "lucide-react"

import { cn } from "../../lib/utils" 
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../../components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"

// Kiểu dữ liệu cho mỗi tag
interface TagOption {
  value: string;
  label: string;
}

// Giả sử đây là các tag có sẵn
const ALL_TAGS: TagOption[] = [
  { value: "react", label: "React" },
  { value: "nodejs", label: "NodeJS" },
  { value: "typescript", label: "TypeScript" },
  { value: "java", label: "Java" },
  { value: "spring", label: "Spring Boot" },
  { value: "python", label: "Python" },
];

interface TagSelectProps {
  allTags: TagOption[];
  value: string[]; 
  onChange: (value: string[]) => void; 
}

export function TagSelect({ value, onChange, allTags }: TagSelectProps) {
  const [availableTags, setAvailableTags] = React.useState<TagOption[]>(allTags);;
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  React.useEffect(() => {
    setAvailableTags(prev => {
      // Giữ lại các tag mới mà người dùng đã thêm
      const newTags = prev.filter(p => !allTags.some(at => at.value === p.value));
      return [...allTags, ...newTags];
    });
  }, [allTags]);

  const selectedTags = availableTags.filter(tag => value.includes(tag.value));
  
  const handleCreateNewTag = (inputValue: string) => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue === "") return;
    const newTagValue = trimmedValue.toLowerCase();
    if (!availableTags.some(tag => tag.value === newTagValue)) {
      const newTag: TagOption = {
        value: newTagValue,
        label: trimmedValue, 
      };
      setAvailableTags(prev => [newTag, ...prev]);
    }
  };

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full h-[46px] justify-between text-gray-500"
          >
            {value.length > 0 ? "Đã chọn " + value.length + " công nghệ" : "Chọn công nghệ..."}
            <PlusCircle className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
        side="right" 
        align="start" 
        sideOffset={10}
        className="w-[--radix-popover-trigger-width] p-0 z-[999] bg-white"> 
          
          {/*(Ô tìm kiếm và danh sách) */}
          <Command>
            <CommandInput 
              placeholder="Tìm hoặc thêm mới..." 
              value={inputValue}
              onValueChange={setInputValue}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateNewTag(inputValue);
                  setInputValue("")
                }
              }}
            />
            <CommandList>
              <CommandEmpty>
                Không tìm thấy. Nhấn "Enter" để thêm mới.
              </CommandEmpty>
              <CommandGroup>
                {availableTags.map((option) => {
                  const isSelected = value.includes(option.value);
                  const isNewTag = !allTags.some(t => t.value === option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => {
                        if (isSelected) {
                          onChange(value.filter((v) => v !== option.value));
                        } else {
                          onChange([...value, option.value]);
                        }
                      }}
                      className="group" 
                    >
                      <Checkbox
                        className="mr-2"
                        checked={isSelected}
                      />
                      <span>{option.label}</span>
                      {isNewTag && (
                        <button
                          type="button"
                          className="ml-auto invisible group-hover:visible" 
                          onClick={(e) => {
                            e.stopPropagation(); // Ngăn 'onSelect' chạy
                            setAvailableTags(prev => prev.filter(t => t.value !== option.value));
                            onChange(value.filter((v) => v !== option.value));
                          }}
                        >
                          <X className="h-4 w-4 text-red-500 hover:text-red-700" />
                        </button>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>

        </PopoverContent>
      </Popover>


      <div className="flex gap-3 w-[600px] flex-wrap">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.value}
            variant="outline"
            className="p-2 px-3 rounded-md text-base cursor-pointer transition-colors border border-gray-500 font-[400] hover:bg-indigo-100"
          >
            {tag.label}
            <button
              type="button"
              className="cursor-pointer"
              onClick={() => {
                // Bấm vào 'X' để bỏ chọn
                onChange(value.filter((v) => v !== tag.value));
              }}
            >
              <X className="h-3 w-3 ml-1" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}