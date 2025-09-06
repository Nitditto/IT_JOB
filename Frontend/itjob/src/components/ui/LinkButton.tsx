import { NavLink } from "react-router"

export default function LinkButton({
     children,
     toHref
    }: {
        children: React.ReactNode
        toHref: string
    }
) {
    return (
        <NavLink viewTransition to={toHref} className={`flex w-full h-full justify-center items-center`}>
            {children}
        </NavLink>
    );
}