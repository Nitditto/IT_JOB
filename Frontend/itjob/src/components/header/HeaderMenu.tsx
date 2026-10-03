import React from 'react'

export const HeaderMenu = ({children, item}: {children?: React.ReactNode, item?: true}) => {
    return (
        <div className={`hidden ${item ? "group-hover/item_hover:block left-[95%] -top-2" : "group-hover/item:block top-full"} absolute pt-2 z-50`}>
            <ul className={`text-[15px] w-[280px] rounded-[8px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2`}>
                {children}
            </ul>
        </div>
    )
}
