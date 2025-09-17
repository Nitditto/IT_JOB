import React from 'react'
import { NavLink } from 'react-router'

const HeaderItem = ({
  toHref,
  linkText,
}: {
  toHref: string,
  linkText: string,

}) => {
  return (
      <li
        className="group-item flex items-center flex-wrap justify-between py-[10px] px-[16px] rounded-[4px] hover:bg-[#000096]"
      >
        <NavLink
          to={toHref}
          className="font-[600] text-[16px] text-white w-full"
        >
          {linkText}
        </NavLink>
      </li>
      )
}

      export default HeaderItem
