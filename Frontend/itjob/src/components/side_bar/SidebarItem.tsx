import { useEffect, type ReactNode } from "react"
import { Link, useLocation } from "react-router"
import { useSidebarContext } from "../../context/SidebarContext"
interface SidebarItemProps {
  icon: ReactNode
  text: string
  to?: string
  onClick?: ()=>void
  active?: boolean
  alert?: boolean
  style?: React.CSSProperties
}
export function SidebarItem({ icon, text, to, onClick, alert=false, style }:SidebarItemProps) {
  const { expanded, activeItem, setActiveItem } = useSidebarContext()
  const location = useLocation()
  const isActive = to ? location.pathname === to : false
  const handleClick=()=>{
    setActiveItem(text)
    document.title=text
  }
  useEffect(() => {
    if (isActive) {
      document.title = text
    }
  }, [isActive, text])
  const itemContent = (
    <>
      {icon}
      <span
        className={`overflow-hidden transition-all ${
          expanded ? "w-52 ml-3" : "w-0"
        }`}
      >
        {text}
      </span>
      {alert && (
        <div
          className={`absolute right-2 w-2 h-2 rounded bg-indigo-400 ${
            expanded ? "" : "top-2"
          }`}
        />
      )}
    </>
  )
  const baseClassName = `
    relative flex items-center py-2 px-3 my-1
    font-medium rounded-md cursor-pointer
    transition-colors group
  `
  const tooltip = !expanded && (
    <div
      className={`
        absolute z-[999] left-full rounded-md px-2 py-1 ml-6
        bg-indigo-100 text-indigo-800 text-sm 
        invisible opacity-20 -translate-x-3 transition-all
        group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
      `}
    >
      {text}
    </div>
  )
  return (
    <li style={style} className="relative"> {/* Bọc <li> ở ngoài cùng */}
      {to ? (
        // Nếu có 'to', render <Link>
        <Link
          to={to}
          className={`
            ${baseClassName}
            ${
              isActive
                ? "bg-indigo-50/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }
          `}
        >
          {itemContent}
          {tooltip}
        </Link>
      ) : (
        // Nếu không có 'to' (ví dụ: nút Đăng xuất), render <div onClick>
        <div
          onClick={onClick}
          className={`
            ${baseClassName}
            hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200
          `}
          style={style} // Áp dụng style (ví dụ: màu đỏ)
        >
          {itemContent}
          {tooltip}
        </div>
      )}
    </li>
  )
}