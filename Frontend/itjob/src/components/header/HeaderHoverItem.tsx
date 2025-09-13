import { NavLink } from "react-router";
import { FaAngleDown, FaAngleRight } from "react-icons/fa6";
const HeaderHoverItem = (
    {
        toHref,
        linkText,
        item,
        children,
    }: {
        toHref: string,
        linkText: string,
        item?: true,
        children?: React.ReactNode,
    }) => {
    return (
        <>
            <li className={`${item ? "group/item_hover" : "group/item flex-col"} bg-[#000065] flex relative`}>
                <NavLink viewTransition to={toHref} className={`${item ? 'group-hover/item_hover:bg-[#000096] w-full py-[10px] px-[16px] flex flex-wrap justify-between ' : 'group-hover/item:bg-[#000096] inline-flex '}  items-center gap-x-[8px] font-[600] text-[16px] text-white`}>
                    {linkText}
                    {item ? <FaAngleRight /> : <FaAngleDown />}
                </NavLink>
                {children}
            </li>
            
        </>

    );
}

export default HeaderHoverItem;