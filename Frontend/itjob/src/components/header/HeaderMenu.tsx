import React from 'react'

export const HeaderMenu = ({children, item}: {children?: React.ReactNode, item?: true}) => {
    return (
            <ul className={`hidden ${item ? "group-hover/item_hover:block left-full" : "group-hover/item:block top-full"} text-xl absolute text-white w-[280px] rounded-[4px] bg-[#000065]`}>
                {children}
            </ul>
    )
}
