import React from 'react'

export const HeaderMenu = ({children}: {children: React.ReactNo}) => {
    return (
        <>
            <ul className="text-xl text-white w-[280px] rounded-[4px] bg-[#000065]">
                {children}
            </ul>
        </>
    )
}
