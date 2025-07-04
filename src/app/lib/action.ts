'use server';

import { signIn } from 'next-auth/react';
import { User } from './definitions';
import postgres from 'postgres';
import { auth } from '../auth';
import { NextResponse } from 'next/server';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function authenticate(_prevState: unknown, formData: FormData) {
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const redirectTo = formData.get('redirectTo')?.toString() || '/';

  if (!email || !password) {
    return 'Email et mot de passe requis';
  }

  const result = await signIn('credentials', {
    email,
    password,
    redirect: false,
    callbackUrl: redirectTo,
  });

  if (result?.error) {
    return 'Échec de la connexion : identifiants invalides';
  }

  if (result?.ok) {
    if (typeof window !== 'undefined') {
      window.location.href = result.url || redirectTo;
    }
  }

  return undefined;
}

export async function GET(_req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }
    const data = await sql<User[]>`SELECT * FROM users`;
    return data?.length > 0 ? data : 'Aucun utilisateur dans la base de donnees';
  } catch (err) {
    console.error('Erreur lors du traitement de la requete', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function deleteUser(userId: number) {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'Authentification requise.' };
  }

  try {
    const result = await sql`
      DELETE FROM users
      WHERE id = ${userId};
    `;

    if (result.count === 0) {
      return { success: false, error: 'Utillisateur non trouvé ou non autorisé pour la suppression.' };
    }

    return { success: true, message: 'Utillisateur supprimé avec succès.' };
  } catch (error) {
    console.error('Erreur lors de la suppression du ticket:', error);
    return { success: false, error: 'Échec de la suppression de l\'utillisateur en base de données.' };
  }
}

export async function getUserById(id: number) {
  try {
    const user = await sql<User[]>`SELECT * FROM users WHERE id = ${id}`;
    if (user.length === 0) {
      return null;
    }
    return user[0];
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur :', error);
    return null;
  }
}

export async function updateUser(id: number, data: { name?: string; email?: string; password?: string }) {
  try {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push(`name = $${fields.length + 1}`);
      values.push(data.name);
    }

    if (data.email !== undefined) {
      fields.push(`email = $${fields.length + 1}`);
      values.push(data.email);
    }

    if (data.password !== undefined) {
      fields.push(`password = $${fields.length + 1}`);
      values.push(data.password);
    }

    if (fields.length === 0) {
      return { success: false, error: 'Aucun champ à mettre à jour.' };
    }

    values.push(id); // Pour le WHERE

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${fields.length + 1}`;
    const result = await sql.unsafe(query, values);

    if (result.count === 0) {
      return { success: false, error: "Aucune mise à jour effectuée. Utilisateur non trouvé." };
    }

    return { success: true, message: "Utilisateur mis à jour avec succès." };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    return { success: false, error: "Erreur lors de la mise à jour en base de données." };
  }
}

