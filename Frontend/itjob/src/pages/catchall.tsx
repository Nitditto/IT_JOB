import { useLocation } from "react-router"

export default function Catchall() {
    const location = useLocation();
    return (
        <>
            <div className="border-22 border-green-400 flex flex-col justify-center items-center space-y-5 w-full h-full">
                <p className='text-6xl text-pink-400'>The current route is: {location.pathname}</p>
            </div>
        </>
    );
}