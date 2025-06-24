// src/auth.config.ts

import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login', // La page de connexion
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            // ... (votre logique existante pour protéger les routes)
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirige les utilisateurs non authentifiés vers la page de connexion
            } else if (isLoggedIn) {
                // Si l'utilisateur est connecté et essaie d'accéder à la page de connexion, le rediriger vers le tableau de bord
                if (nextUrl.pathname === '/login' || nextUrl.pathname === '/register') {
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
            }
            return true; // Laisse passer les requêtes pour les autres pages ou si non connecté sur une page publique
        },
    },
    providers: [], // IMPORTANT : Laissez ceci vide dans auth.config.ts pour éviter les conflits. Les fournisseurs sont définis dans auth.ts.
} satisfies NextAuthConfig;