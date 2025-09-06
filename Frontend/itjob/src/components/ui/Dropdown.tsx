import { NavLink } from "react-router";

function DropdownMenu({
    isClickable,
    title,
    items,
    toHref
}: {
    isClickable: boolean,
    title: string,
    items: Array<React.ReactNode>,
    toHref?: string
}
) {
    if (isClickable) {
        return (
            <NavLink to={toHref} className="text-xl text-white w-fit h-full mx-2"/> 
        );
    } else {
        return (
            <p className="text-xl text-white w-fit h-full mx-2"/>
        );
    }
}