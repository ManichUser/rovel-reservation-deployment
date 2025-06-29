"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "./Siderbar";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";

export default function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const session= useSession()
  const username=session?.data?.user?.name
  const isAdmin=username==='Ronel Mbami'    
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
        <nav className={`
        fixed top-0 w-full z-20 flex items-center justify-between px-4 lg:px-12 transition-all duration-300 
        ${isScrolled ? "navbar-solid shadow" : "navbar-transparent backdrop-blur-md"}
        ${isScrolled ? "h-20" : "h-24"}
    `}>
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
            <div className="leading-tight">
            <h1 className="font-bold text-blue-950 text-lg lg:text-xl">
                Rovel
            </h1>
            <p className="text-xs text-blue-600 tracking-wide">Ticket-Express</p>
        </div>
        </Link>
        <div className="hidden lg:flex gap-12">
        <Link href="/" className="flex items-center space-x-2">
            <label className="hover:text-blue-400 text-blue-950 text-lg lg:text-xl">
            Acceuil
            </label>
        </Link> 
        {isAdmin &&<Link href="/agents" className="flex items-center space-x-2">
        <label className="hover:text-blue-400 text-blue-950 text-lg lg:text-xl">
        Mes Agents
            </label>
        </Link>}
      { isAdmin && <Link href="/reservations" className="flex items-center space-x-2">
        <label className="hover:text-blue-400 text-blue-950 text-lg lg:text-xl">
            Reservations
            </label>
        </Link>}
        <Link href="/dashboard" className="flex items-center space-x-2">
        <label className="hover:text-blue-400 text-blue-950 text-lg lg:text-xl">
            Dashboard
            </label>
        </Link>
        </div>
        {/* Burger mobile */}
        <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
        >
        <Bars3Icon className="w-6 h-6 " color="blue" /> 
        </button>
    
        </nav>

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
    );
}
