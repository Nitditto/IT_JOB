import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { Header } from "./components/header/Header";
<<<<<<< HEAD
import Footer from "./components/footer/Footer";
=======
import Footer from "./components/Footer";
>>>>>>> 66728b8e8d7b2cec1a51dab74c42130b7953ba73


export function Layout({ children } : { children: React.ReactNode }) {
    return (
    <html lang="en">
    <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <link href="src/index.css" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Vite + React + TS with React Router</title>
        <Meta />
        <Links />
    </head>
    <body>
        <Header />
        {children}
<<<<<<< HEAD
        <Footer/>
=======
        <Footer />
>>>>>>> 66728b8e8d7b2cec1a51dab74c42130b7953ba73
        <ScrollRestoration />
        <Scripts />
    </body>
    </html>
    );
}

export default function Root() {
    return <Outlet />;
}
