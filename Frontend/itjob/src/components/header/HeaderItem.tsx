import React, { type ComponentPropsWithoutRef } from 'react'
import { NavLink, type NavLinkProps } from 'react-router'

type HeaderItemProps = {
  to: string,
  linkText: string
}
type HeaderProps = HeaderItemProps & NavLinkProps;
const HeaderItem = ({
  to,
  linkText,
  ...rest
}: HeaderProps) => {
  return (
      <li
        className="group-item flex items-center flex-wrap justify-between py-[10px] px-[16px] rounded-[4px] hover:bg-[#000096]"
      >
        <NavLink
          to={to}
          {...rest}
          className="font-[600] text-[16px] text-white w-full"
        >
          {linkText}
        </NavLink>
      </li>
      )
}

      export default HeaderItem
