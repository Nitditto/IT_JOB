import { NavLink } from "react-router";
import { FaAngleDown, FaAngleRight } from "react-icons/fa6";
const HeaderHoverItem = (
    {
        toHref,
        linkText,
        item,
        children
    }: {
        toHref: string,
        linkText: string,
        item?: true,
        children?: React.ReactNode,
    }) => {
    return (
        <li className={`${item ? "group/item_hover" : "group/item flex-col"} flex relative z-50`}>
            <NavLink 
                viewTransition 
                to={toHref} 
                className={`${item ? 'group-hover/item_hover:bg-black/5 dark:group-hover/item_hover:bg-white/10 w-full flex flex-wrap justify-between mx-2 rounded-md' : 'group-hover/item:text-primary inline-flex '} items-center gap-x-[6px] font-[600] text-[15px] py-[10px] px-[12px] xl:px-[16px] transition-colors rounded-md text-foreground dark:text-white`}
            >
                {linkText}
                {item ? <FaAngleRight className="text-[12px]" /> : <FaAngleDown className="text-[12px] opacity-70" />}
            </NavLink>
            {children}
        </li>
    );
}

export default HeaderHoverItem;