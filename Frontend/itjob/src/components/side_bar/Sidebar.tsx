import { ChevronLast, ChevronFirst } from "lucide-react"
import { useState, type ReactNode } from "react"
import { SidebarContext } from "../../context/SidebarContext"
import { useAuth } from "@/context/AuthContext"

interface SidebarProps {
  children: ReactNode
}
export default function Sidebar({ children }: SidebarProps) {
  const [expanded, setExpanded] = useState(true)
  const [activeItem, setActiveItem] = useState("Dashboard")
  const { user } = useAuth();
  const defaultAvatar = "/assets/images/avatar.jpg";
  return (
    <aside className={` ${expanded ? "w-[256px]" : "w-[68px]"} transition-all duration-300 ease-in-out flex-shrink-0 z-40 bg-white border-r border-slate-200 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.1)] relative h-full`}>
      <nav className="h-full flex flex-col justify-between">
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="p-4 pb-4 flex justify-between items-center sticky top-0 bg-white z-10">
            <img
              src="/assets/images/logo_sidebar.svg"
              className={`overflow-hidden transition-all duration-300 ${expanded ? "w-28" : "w-0 opacity-0"
                }`}
              alt="Logo"
            />
            <button
              onClick={() => setExpanded((curr) => !curr)}
              className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            >
              {expanded ? <ChevronFirst size={25} /> : <ChevronLast size={25} />}
            </button>
          </div>

          <SidebarContext.Provider value={{ expanded, activeItem, setActiveItem }}>
            <ul className="px-3 flex flex-col gap-1 pb-4">{children}</ul>
          </SidebarContext.Provider>
        </div>

        <div className="border-t border-slate-100 p-4 transition-all flex items-center bg-slate-50/50">
          <img
            src={user?.avatar || defaultAvatar}
            alt="User Avatar"
            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm flex-shrink-0"
          />

          <div
            className={`
              flex justify-between items-center ml-3
              transition-all duration-300 ease-in-out ${expanded ? "w-full opacity-100" : "w-0 opacity-0 hidden"}
          `}
          >
            <div className="flex flex-col min-w-0 pr-2">
              <h4 className="font-semibold text-sm text-slate-800 truncate" title={user?.name}>
                {user?.name || "Guest User"}
              </h4>
              <span className="text-xs text-slate-500 truncate" title={user?.email}>
                {user?.email || "guest@itjob.com"}
              </span>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  )
}
