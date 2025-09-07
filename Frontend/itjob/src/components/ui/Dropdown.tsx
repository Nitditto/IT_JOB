import { NavLink } from "react-router";

function DropdownItem({
    name,
    toHref
}: {
    name: string,
    toHref: string
}) {
    return (
        <div className="w-[200px] h-fit text-xl">
                    <NavLink className="" viewTransition to={toHref}>{name}</NavLink>
        </div>
    );
}

function DropdownMenu({
    clickable,
    title,
    children,
    toHref
}: {
    clickable?: true,
    title: string,
    children: React.ReactNode,
    toHref?: string
}
) {
    if (clickable && toHref !== undefined) {
        return (
            <div className="group">
                <NavLink viewTransition to={toHref} className="flex text-xl text-white w-fit h-full justify-center items-center">
                    {title}
                </NavLink>
                <div className="hidden group-hover:block w-full h-fit bg-white">
                    {children}
                </div>
            </div>

        );
    } else {
        return (
            <p className="flex text-xl text-white w-fit h-full justify-center items-center">
                {title}
            </p>
        );
    }
}

export {
    DropdownMenu,
    DropdownItem
}