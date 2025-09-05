import { useLocation } from "react-router"

export default function Component() {
    const location = useLocation();
    return (
        <>
            <div className="flex flex-col justify-center items-center space-y-5  w-screen h-screen">
                <p className='text-6xl text-pink-400'>The current route is: {location.pathname}</p>
            </div>
        </>
    );
}