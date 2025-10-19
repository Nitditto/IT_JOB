import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { Header } from "./components/header/Header";
import Footer from "./components/footer/Footer";
import { useEffect } from "react";
import axios from 'axios';
import { AuthProvider } from "./context/AuthContext";


export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <link rel="icon" type="image/svg+xml" href="/vite.svg" />
                <link href="src/index.css" rel="stylesheet" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>IT.JOB - Việc làm IT cho Developer &quot;Chất&quot; </title>
                <Meta />
                <Links />
            </head>
            <body>
                <AuthProvider>
                    <Header />
                    {children}
                    <Footer />
                    <ScrollRestoration />
                    <Scripts />
                </AuthProvider>
            </body>
        </html>
    );
}

export default function Root() {
    return <Outlet />;
}
