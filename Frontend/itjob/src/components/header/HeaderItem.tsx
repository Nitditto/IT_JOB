import React from 'react'
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
        className="group-item flex items-center flex-wrap justify-between rounded-[4px] mx-2"
      >
        <NavLink
          to={to}
          {...rest}
          className="font-[500] text-[15px] block w-full py-[10px] px-[16px] hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-foreground dark:text-white rounded-md cursor-pointer"
        >
          {linkText}
        </NavLink>
      </li>
      )
}

      export default HeaderItem
