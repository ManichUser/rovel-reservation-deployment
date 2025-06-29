"use client";
import Link from "next/link";



export default function NavLinks() {
    return (
        <div className="fixed inset-0  bg-black/30 z-30 transition-opacity opacity-100 visible" >
            <aside
            className="fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform "
            >
            <nav className="flex flex-col p-4  space-y-4">
            <Link href="/" className="hover:text-blue-800">
                Acceuil
            </Link> 
            </nav>
        </aside>
        </div>
    );
}
