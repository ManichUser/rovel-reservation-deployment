// src/auth.ts (ou src/lib/auth.ts)

// Importation de la fonction Auth (le point d'entrée principal pour la v5)
import { Auth } from '@auth/next';
// Importation du CredentialsProvider (maintenant de '@auth/core/providers/credentials')
import Credentials from '@auth/core/providers/credentials';

// Si vous utilisez Next.js App Router, getServerSession est toujours là
import { getServerSession } from 'next-auth/next';

import { z } from 'zod';
import type { User } from '@/app/lib/definitions'; // Assurez-vous que le chemin est correct
import bcrypt from 'bcrypt';
import postgres from 'postgres';

// Importation de authConfig pour fusionner ses propriétés (pages, authorized callback)
import { authConfig } from './auth.config'; // Assurez-vous que le chemin est correct

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
    return user[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

// Définition de authConfig (ou options de configuration)
// Notez que le type n'est plus 'NextAuthOptions' mais implicit pour 'Auth'
// Vous pouvez définir un type si vous le souhaitez, mais c'est moins courant pour Auth.js
export const { auth, handlers, signIn, signOut } = Auth({
  // Fusionne les options de authConfig ici.
  // Cela inclura les 'pages' et le 'authorized' callback.
  // Note: Le 'authorized' callback de authConfig est déjà un bon point de départ,
  // mais assurez-vous qu'il est compatible avec le nouveau `auth` object de la v5.
  ...authConfig, // Assurez-vous que authConfig est bien compatible avec les props de Auth

  // Stratégie de session (JWT est par défaut en v5, mais vous pouvez le spécifier)
  session: {
    strategy: 'jwt',
    // maxAge et updateAge ne sont généralement plus configurés ici directement dans la v5
    // Ils sont gérés par le JWT en lui-même ou les options du fournisseur.
  },

  // Définition des fournisseurs d'authentification
  providers: [
    Credentials({
      // Vous n'avez plus besoin du 'name' ici pour Credentials,
      // ou vous pouvez le laisser pour la clarté mais il n'est pas utilisé par Auth.js
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);

        if (!parsed.success) {
          console.log('Invalid input format for credentials.');
          return null;
        }

        const { email, password } = parsed.data;
        const user = await getUser(email);

        if (!user) {
          console.log('User not found.');
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) {
          console.log('Incorrect password.');
          return null;
        }

        // En Auth.js v5, l'objet retourné est généralement le 'user' que vous souhaitez stocker
        // dans le jeton. L'ID est souvent suffisant ou les informations minimales nécessaires.
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          // Vous pouvez ajouter d'autres propriétés de l'utilisateur ici, ex: role: user.role
        };
      },
    }),
    // Si vous avez d'autres fournisseurs (ex: GitHub), ils sont importés de
    // @auth/core/providers/github et configurés ici.
  ],

  // Callbacks JWT et Session (ESSENTIELS pour récupérer l'ID de l'utilisateur)
  callbacks: {
    // Le callback `jwt` est appelé chaque fois qu'un token JWT est créé ou mis à jour.
    // C'est ici que vous ajoutez l'ID de l'utilisateur au token.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; // Ajoute l'id de l'utilisateur (issu de authorize) au token
      }
      return token;
    },
    // Le callback `session` est appelé chaque fois qu'une session est vérifiée.
    // C'est ici que vous exposez l'ID de l'utilisateur dans l'objet `session.user`.
    async session({ session, token }) {
      // Assurez-vous que session.user existe avant d'ajouter des propriétés.
      // Le type de session.user pourrait être SessionUser (un nouveau type à définir si besoin)
      if (session.user) {
        // @ts-ignore: Ceci est souvent nécessaire car NextAuth/Auth.js peut être strict sur les types
        // de 'session.user' mais vous voulez ajouter 'id'. Vous pouvez créer un type personnalisé.
        session.user.id = token.id as string; // L'ID du token est maintenant l'ID de l'utilisateur
      }
      return session;
    },
    // Le `authorized` callback de authConfig est déjà inclus via `...authConfig`
    // donc pas besoin de le redéfinir ici.
  },

  // Vous devrez peut-être ajouter un secret explicitement pour la v5
  secret: process.env.AUTH_SECRET, // Assurez-vous que AUTH_SECRET est défini dans vos variables d'environnement
  // debug: process.env.NODE_ENV === 'development', // Pour le débogage en dev
});


// Exportez la fonction getSession pour récupérer la session dans les composants serveur et les routes API
// Note : avec NextAuth v5, `auth` est la fonction recommandée pour cela.
// `getSession` de 'next-auth/next' utilise une ancienne approche compatible mais `auth()` est la nouvelle voie.
export const getSession = () => getServerSession(authOptions); // Garder pour la compatibilité si votre code le demande

// Exportez le handler pour être utilisé dans src/app/api/auth/[...nextauth]/route.ts
// `handlers` est la nouvelle façon d'exporter les handlers API dans la v5.
// Le chemin de votre route API doit être `src/app/api/auth/[...auth]/route.ts` (Notez `[...auth]` au lieu de `[...nextauth]`)
export { handlers as GET, handlers as POST } from '@auth/next';