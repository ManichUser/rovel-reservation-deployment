"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const session= useSession()
  const username=session?.data?.user?.name
  const isAdmin=username==='Ronel Mbami'  
  return (
    <div
      className={`fixed inset-0 text-black  bg-black/30 z-30 transition-opacity ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
      onClick={onClose}
    >
      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform ${
          isOpen ? "-translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-bold text-lg">Menu</h2>
          <button onClick={onClose} aria-label="Fermer le menu">✕</button>
        </div>
        <nav className="flex flex-col p-4  space-y-4">
        <Link href="/" className="hover:text-blue-800">
              Acceuil
        </Link> 
        {isAdmin && ["Agents", "Reservations"].map((link) => (
              <h2 key={link}>
                <Link href={`/${link.toLowerCase()}`} className="hover:text-blue-800">
                  {link}
                </Link>
              </h2>
            ))}
        <Link href="/dashboard" className="hover:text-blue-800">
              Dashboard
        </Link> 
        </nav>
      </aside>
    </div>
  );
}
