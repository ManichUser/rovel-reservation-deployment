// src/app/components/NavBar.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "./Siderbar"; // Assurez-vous que ce chemin est correct
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";

export default function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false); // Gardé pour d'autres effets si besoin
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const session = useSession();
  const username = session?.data?.user?.name;
  const isAdmin = username === 'Ronel Mbami';

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav className={`
        fixed top-0 w-full z-20 flex items-center justify-between px-4 lg:px-12 transition-all duration-300
        bg-white  shadow-md 
        ${isScrolled? "h-12 ":"h-18"}
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
              Accueil
            </label>
          </Link>
          {isAdmin && (
            <Link href="/agents" className="flex items-center space-x-2">
              <label className="hover:text-blue-400 text-blue-950 text-lg lg:text-xl">
                Mes Agents
              </label>
            </Link>
          )}
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
          <Bars3Icon className="w-6 h-6" color="blue" />
        </button>
      </nav>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
