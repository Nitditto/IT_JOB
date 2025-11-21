import { MoreVertical, ChevronLast, ChevronFirst } from "lucide-react"
import { useContext, createContext, useState, type ReactNode } from "react"
import { SidebarContext } from "../../context/SidebarContext"
import { useAuth } from "@/context/AuthContext"

interface SidebarProps {
  children: ReactNode
}
export default function Sidebar({ children }:SidebarProps) {
  const [expanded, setExpanded] = useState(true)
  const [activeItem, setActiveItem] = useState("Dashboard")
  const { user } = useAuth();
  const defaultAvatar = "/assets/images/avatar.jpg";
  return (
    <aside className={` ${expanded ? "w-[256px]" : "w-17"}`}>
      <nav className="h-full flex flex-col bg-white border-r shadow-sm">
        <div className="p-4 pb-2 flex justify-between items-center">
          <img
            src="/assets/images/logo_sidebar.svg"
            className={`overflow-hidden transition-all ${
              expanded ? "w-32" : "w-0"
            }`}
            alt=""
          />
          <button
            onClick={() => setExpanded((curr) => !curr)}
            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100"
          >
            {expanded ? <ChevronFirst /> : <ChevronLast />}
          </button>
        </div>

        <SidebarContext.Provider value={{ expanded, activeItem, setActiveItem }}>
          <ul className="flex-1 px-3">{children}</ul>
        </SidebarContext.Provider>

        <div className="border-t flex p-3">
          {/* 3. HIỂN THỊ AVATAR THẬT */}
          <img
            src={user?.avatar || defaultAvatar} // Dùng avatar của user hoặc mặc định
            alt="User Avatar"
            className="w-10 h-10 rounded-md object-cover" // Thêm object-cover cho đẹp
          />
          
          <div
            className={`
              flex justify-between items-center
              overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"}
          `}
          >
            <div className="leading-4">
              {/* 4. HIỂN THỊ TÊN VÀ EMAIL THẬT */}
              <h4 className="font-semibold truncate w-[120px]" title={user?.name}>
                  {user?.name || "Guest User"}
              </h4>
              <span className="text-xs text-gray-600 truncate w-[120px] block" title={user?.email}>
                  {user?.email || "guest@itjob.com"}
              </span>
            </div>
            <MoreVertical size={20} />
          </div>
        </div>
      </nav>
    </aside>
  )
}
