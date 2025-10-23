// src/context/SidebarContext.tsx
import { createContext, useContext, type ReactNode } from "react"

export interface SidebarContextType {
  expanded: boolean
  activeItem: string
  setActiveItem: (text: string) => void
}

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const useSidebarContext = (): SidebarContextType => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarContext.Provider")
  }
  return context
}
