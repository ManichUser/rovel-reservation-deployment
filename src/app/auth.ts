import Credentials from 'next-auth/providers/credentials';
import NextAuth from "next-auth";
import { ZodError } from "zod";
import { signInSchema } from "./lib/zod";
import type { User } from '@/app/lib/definitions';
import postgres from 'postgres';
// Vous avez besoin de bcrypt pour comparer le mot de passe.
import bcrypt from 'bcryptjs'; // Assurez-vous d'avoir 'bcrypt' installé (`npm install bcrypt`)

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Fonction getUser corrigée : ne récupère l'utilisateur que par email
async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User[]>`SELECT id, email, password, name FROM users WHERE email=${email}`;
    return user[0]; // Retourne le premier utilisateur trouvé ou undefined
  } catch (error) {
    console.error('Failed to fetch user:', error);
    // En cas d'erreur de base de données, considérez que l'authentification échoue
    throw new Error('Failed to fetch user due to database error.');
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials, request) => {
        try {
          // 1. Valider les identifiants avec Zod
          const { email, password } = await signInSchema.parseAsync(credentials);

          // 2. Récupérer l'utilisateur par email UNIQUEMENT
          const user = await getUser(email);

          // 3. Si aucun utilisateur n'est trouvé, retourner null (échec de l'authentification)
          if (!user) {
            console.log('No user found with the provided email.');
            return null;
          }

          // 4. Comparer le mot de passe fourni avec le mot de passe haché de la base de données
          const passwordsMatch = await bcrypt.compare(password, user.password);

          // 5. Si les mots de passe ne correspondent pas, retourner null (échec de l'authentification)
          if (!passwordsMatch) {
            console.log('Invalid password.');
            return null;
          }

          // 6. Si l'authentification réussit, préparer l'objet User avec id de type string pour NextAuth
          let newUserWithIdString={...user, id: user.id.toString()}; 
          return newUserWithIdString; // Retourner l'objet utilisateur authentifié

        } catch (error) {
          if (error instanceof ZodError) {
            console.error('Validation error during authentication:', error.issues);
            // Retourner `null` pour les erreurs de validation
            return null;
          }
          // Gérer d'autres erreurs inattendues (ex: de `getUser` si elle propage)
          console.error('An unexpected error occurred during authentication:', error);
          return null; // Retourner null pour toute autre erreur d'authentification
        }
      },
    }),
  ],

  // Options de NextAuth
  pages: {
    signIn: '/login', // Définissez le chemin vers votre page de connexion
    // error: '/auth/error', // Optionnel: page d'erreur
  },
  callbacks: {
    // Le callback `jwt` est appelé avant que le jeton ne soit stocké
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; // Ajouter l'ID de l'utilisateur au jeton
        token.email = user.email;
        // Ajoutez d'autres propriétés de l'utilisateur que vous voulez dans le jeton
      }
      return token;
    },
    // Le callback `session` est appelé chaque fois qu'une session est vérifiée
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string; // S'assurer que l'ID est dans la session
      }
      if (token.email) {
        session.user.email = token.email as string;
      }
      // Ajoutez d'autres propriétés de l'utilisateur à la session
      return session;
    },
  },
});