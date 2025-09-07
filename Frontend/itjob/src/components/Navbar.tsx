import { NavLink } from "react-router"

import LinkButton from "./ui/LinkButton"
import { DropdownItem, DropdownMenu } from "./ui/Dropdown" 
export default function Navbar() {
    return (
        <div className="flex items-center sticky top-0 left-0 w-full h-20 bg-blue-500">
            <NavLink to="/" className="flex-1 h-full">
            <LinkButton toHref="/">
                <p className="text-3xl text-white">Home</p>
            </LinkButton>
            </NavLink>
            <div className="flex-5 flex h-full justify-between">
                <DropdownMenu clickable toHref={"/test"} title="test">
                    <div className="">
                        <DropdownItem name="thing1" toHref="/thing1" />
                    </div>
                </DropdownMenu>
                
            </div>
            <div className="flex-1 border-2 border-orange-300 h-full"></div>
        </div>
    )
}