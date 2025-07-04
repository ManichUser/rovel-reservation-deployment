
import { NextResponse,NextRequest } from 'next/server';
import { z } from 'zod';
import { hashPassword } from '../../lib/server/hash';
import postgres from 'postgres'; 
import type { User } from '../../lib/definitions'; 

export const runtime = 'nodejs';
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Schéma de validation pour l'enregistrement d'un utilisateur
const registerSchema = z.object({
  name: z.string().min(2, 'Le nom est requis et doit contenir au moins 2 caractères.'),
  email: z.string().email('Format d\'email invalide.'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères.'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    // 1. Vérifier si l'utilisateur existe déjà
    const existingUser = await sql<User[]>`SELECT id FROM users WHERE email = ${email}`;
    if (existingUser.length > 0) {
      return NextResponse.json({ message: 'Un utilisateur avec cet email existe déjà.' }, { status: 409 });
    }

    // 2. Hacher le mot de passe
    const hashedPassword = await hashPassword(password);

    // 3. Insérer le nouvel utilisateur dans la base de données Neon
    // Note: 'id' est généré automatiquement par la BDD si vous avez mis 'UUID DEFAULT gen_random_uuid() PRIMARY KEY'
    const newUser = await sql<User[]>`
      INSERT INTO users (name, email, password)
      VALUES (${name}, ${email}, ${hashedPassword})
      RETURNING id, name, email;
    `;

    // Vérifier si l'insertion a réussi et retourner l'utilisateur créé (sans le mot de passe haché)
    if (newUser.length > 0) {
      const { password, ...userWithoutPassword } = newUser[0]; 
      console.log('Nouvel utilisateur enregistré avec succès dans Neon:', userWithoutPassword);
      console.log(password)
      return NextResponse.json({ message: 'Utilisateur enregistré avec succès', user: userWithoutPassword }, { status: 201 });
    } else {
      throw new Error('Échec de l\'insertion de l\'utilisateur dans la base de données.',);
    }

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur lors de l\'enregistrement.' }, { status: 500 });
  }
}

