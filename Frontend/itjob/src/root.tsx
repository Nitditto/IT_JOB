import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { Header } from "./components/header/Header";
import Footer from "./components/footer/Footer";

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
        <Footer/>
        <ScrollRestoration />
        <Scripts />
    </body>
    </html>
    );
}

export default function Root() {
    return <Outlet />;
}
