import {auth} from "@/app/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    const session = await auth();

    // Liste des chemins protégés
    const protectedPaths = ["/dashboard", "/reservations","/agents"];

    const pathname = req.nextUrl.pathname;

    // Vérifie si la requête cible une route protégée (exact ou prefix)
    const isProtected = protectedPaths.some(path => pathname === path || pathname.startsWith(path + "/"));

    if (isProtected && !session) {
        // Redirige vers login si pas connecté
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Sinon laisse passer
    return NextResponse.next();
}

// Spécifie quelles routes le middleware doit intercepter
export const config = {
    matcher: ["/dashboard/:path*", "/api/protected/:path*","/agents/:path*","/reservations/:path*"],
};