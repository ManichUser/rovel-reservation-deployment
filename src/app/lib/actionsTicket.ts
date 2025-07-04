// src/app/lib/actions.ts
'use server'; // Indique que toutes les fonctions de ce fichier sont des Server Actions

import { revalidatePath } from 'next/cache'; // Pour revalider le cache de la page après une mutation
import postgres from 'postgres'; // Importez votre client postgres
import { z } from 'zod'; // Pour la validation des données
import { auth } from '@/app/auth'; // Pour vérifier la session utilisateur
import { User } from '@/app/lib/definitions'; // Pour le type User
import { TicketDBRaw } from '../data/ tickets';
// import { Ticket } from '../data/ tickets';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Schéma de validation pour un ticket (doit correspondre à votre ticketSchema existant)
const ticketSchema = z.object({
  id: z.string().optional(), // ID est optionnel pour la création, requis pour la mise à jour
  agency: z.string().min(1, 'L\'agence est requise.'),
  mode: z.enum(['BUS', 'TRAIN', 'AVION'], { message: 'Mode de transport invalide.' }),
  name: z.string().min(1, 'Le nom du client est requis.'),
  email: z.string().email('Format d\'email invalide.'),
  date: z.string().min(1, 'La date est requise.'),
  departureTime: z.string().min(1, 'L\'heure de départ est requise.'),
  totalAmount: z.number().min(0, 'Le montant doit être positif.').or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)).refine(val => !isNaN(val), { message: "Le montant total doit être un nombre." }),
  class: z.string().min(1, 'La classe est requise.'),
  from: z.string().min(1, 'Le lieu de départ est requis.'),
  to: z.string().min(1, 'Le lieu d\'arrivée est requis.'),
  // user_id sera ajouté côté serveur, pas par le formulaire
});

/**
 * Fonction utilitaire pour obtenir l'ID de l'utilisateur.
 * Réutilisée ici pour la logique des Server Actions.
 */
async function getUserIdByEmail(email: string): Promise<string | undefined> {
  try {
    const user = await sql<User[]>`SELECT id FROM users WHERE email = ${email}`;
    return user.length > 0 ? user[0].id.toString() : undefined;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ID utilisateur par email dans les actions:', error);
    return undefined;
  }
}

/**
 * Server Action pour ajouter un nouveau ticket.
 * @param formData Les données du formulaire.
 * @returns Un objet indiquant le succès ou l'échec.
 */
export async function addTicket(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const parsed = ticketSchema.safeParse(rawData);

  if (!parsed.success) {
    console.error('Validation error for addTicket:', parsed.error.flatten().fieldErrors);
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'Authentification requise.' };
  }
  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) {
    return { success: false, error: 'Utilisateur non trouvé.' };
  }

  try {
    await sql`
      INSERT INTO tickets (agency, mode, name, email, date, departure_time, total_amount, class, from_location, to_location, user_id)
      VALUES (
        ${data.agency},
        ${data.mode},
        ${data.name},
        ${data.email},
        ${data.date},
        ${data.departureTime},
        ${data.totalAmount},
        ${data.class},
        ${data.from},
        ${data.to},
        ${userId}
      );
    `;
    revalidatePath('/dashboard'); // Revalide la page du tableau de bord pour afficher le nouveau ticket
    return { success: true, message: 'Ticket ajouté avec succès.' };
  } catch (error) {
    console.error('Erreur lors de l\'ajout du ticket:', error);
    return { success: false, error: 'Échec de l\'ajout du ticket en base de données.' };
  }
}

/**
 * Server Action pour mettre à jour un ticket existant.
 * @param formData Les données du formulaire, incluant l'ID du ticket.
 * @returns Un objet indiquant le succès ou l'échec.
 */
export async function updateTicket(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const parsed = ticketSchema.safeParse(rawData);

  if (!parsed.success) {
    console.error('Validation error for updateTicket:', parsed.error.flatten().fieldErrors);
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { id, ...data } = parsed.data; // Extraire l'ID

  if (!id) {
    return { success: false, error: 'ID du ticket manquant pour la mise à jour.' };
  }

  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'Authentification requise.' };
  }
  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) {
    return { success: false, error: 'Utilisateur non trouvé.' };
  }

  try {
    const result = await sql`
      UPDATE tickets
      SET
        agency = ${data.agency},
        mode = ${data.mode},
        name = ${data.name},
        email = ${data.email},
        date = ${data.date},
        departure_time = ${data.departureTime},
        total_amount = ${data.totalAmount},
        class = ${data.class},
        from_location = ${data.from},
        to_location = ${data.to}
      WHERE id = ${id} AND user_id = ${userId}; -- S'assurer que seul le propriétaire peut modifier
    `;

    if (result.count === 0) {
      return { success: false, error: 'Ticket non trouvé ou non autorisé pour la mise à jour.' };
    }

    revalidatePath('/dashboard'); // Revalide la page du tableau de bord
    revalidatePath(`/dashboard/tickets/${id}`); // Revalide la page de détails du ticket aussi
    return { success: true, message: 'Ticket mis à jour avec succès.' };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du ticket:', error);
    return { success: false, error: 'Échec de la mise à jour du ticket en base de données.' };
  }
}

/**
 * Server Action pour supprimer un ticket.
 * @param id L'ID du ticket à supprimer.
 * @returns Un objet indiquant le succès ou l'échec.
 */
export async function deleteTicket(id: string) {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'Authentification requise.' };
  }
  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) {
    return { success: false, error: 'Utilisateur non trouvé.' };
  }

  try {
    const result = await sql`
      DELETE FROM tickets
      WHERE id = ${id} 
    `;

    if (result.count === 0) {
      return { success: false, error: 'Ticket non trouvé' };
    }

    revalidatePath('/dashboard'); // Revalide la page du tableau de bord
    return { success: true, message: 'Ticket supprimé avec succès.' };
  } catch (error) {
    console.error('Erreur lors de la suppression du ticket:', error);
    return { success: false, error: 'Échec de la suppression du ticket en base de données.' };
  }
}

/**
 * Récupère un seul ticket par son ID et l'ID de l'utilisateur.
 * Ceci garantit que l'utilisateur ne peut voir que ses propres tickets.
 * @param ticketId L'ID unique du ticket.
 * @param userId L'ID de l'utilisateur propriétaire du ticket.
 * @returns Le ticket brut de la base de données ou undefined si non trouvé.
 */
export async  function getTicketByIdAndUser(ticketId: string, userId: string): Promise<TicketDBRaw | undefined> {
  try {
    const ticketData = await sql<TicketDBRaw[]>`
      SELECT * FROM tickets
      WHERE id = ${ticketId} AND user_id = ${userId};
    `;
    return ticketData.length > 0 ? ticketData[0] : undefined;
  } catch (error) {
    console.error(`Erreur lors de la récupération du ticket ${ticketId} pour l'utilisateur ${userId}:`, error);
    // Propager l'erreur pour qu'elle soit gérée par le composant appelant
    throw new Error("Erreur de base de données lors de la récupération du ticket.");
  }
}