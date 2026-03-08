import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { Header } from "./components/header/Header";
import Footer from "./components/footer/Footer";
import { useEffect, useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children } : { children: React.ReactNode }) {
    const [showBackToTop, setShowBackToTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowBackToTop(true);
            } else {
                setShowBackToTop(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <link rel="icon" type="image/svg+xml" href="/vite.svg" />
                <link href="/src/index.css" rel="stylesheet" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>IT.JOB - Việc làm IT cho Developer &quot;Chất&quot; </title>
                <Meta />
                <Links />
            </head>
            <body className="flex flex-col min-h-screen">
                <AuthProvider>
                    <Header />
                    <main className="flex-1">
                        {children}
                    </main>
                    {/* Back to Top Button */}
                    <AnimatePresence>
                        {showBackToTop && (
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.2 }}
                                onClick={scrollToTop}
                                className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                aria-label="Back to top"
                            >
                                <ArrowUp size={24} />
                            </motion.button>
                        )}
                    </AnimatePresence>

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
