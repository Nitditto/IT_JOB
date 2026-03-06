import React from 'react'

export const HeaderMenu = ({children, item}: {children?: React.ReactNode, item?: true}) => {
    return (
            <ul className={`hidden ${item ? "group-hover/item_hover:block left-[95%] -top-2" : "group-hover/item:block top-[100%] mt-2"} text-[15px] absolute w-[280px] rounded-[8px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50`}>
                {children}
            </ul>
    )
}
