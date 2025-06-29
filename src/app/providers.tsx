'use client'

import NavBar from "./lib/ui/navBar";
import { usePathname } from "next/navigation"

import { SessionProvider } from 'next-auth/react';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {

  const pathname = usePathname();
  const hideNavbar= pathname==="/login" || pathname ==="/add-user"
  return (
    <SessionProvider>
        {!hideNavbar&&<NavBar></NavBar>}
      {children}
    </SessionProvider>
  );
}