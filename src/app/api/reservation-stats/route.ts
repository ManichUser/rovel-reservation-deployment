// src/app/api/reservation-stats/route.ts

import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { auth } from '@/app/auth'; // Chemin vers votre fichier auth.ts

export const runtime = 'nodejs'; // Cette route API s'exécutera sur le runtime Node.js

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

/**
 * Interface pour les données de statistiques de réservation retournées par l'API.
 * Chaque objet représente un ticket individuel avec des informations sur l'agent et le client.
 */
interface ReservationStat {
  nomAgent: string; // Nom de l'utilisateur (agent) qui a effectué la réservation (depuis la table 'users')
  nomClient: string; // Nom de la personne pour qui le ticket a été réservé (attribut 'name' de la table 'tickets')
  agency: string;    // Agence du ticket
  ticketsIssued: number; // Sera toujours 1 pour chaque ticket individuel dans cette liste
}

/**
 * Gère les requêtes GET pour récupérer les statistiques de réservation détaillées.
 * Nécessite une authentification d'administrateur.
 */
export async function GET(request: Request) {
  try {
    // 1. Vérifier l'authentification et les droits d'administrateur
    const session = await auth();
    // Assurez-vous que 'Ronel Mbami' est bien le nom d'utilisateur de l'administrateur
    if (!session?.user?.email || session.user.name !== "Ronel Mbami") {
      return NextResponse.json({ error: 'Accès non autorisé. Réservé aux administrateurs.' }, { status: 403 });
    }

    // 2. Récupérer les données détaillées de la base de données
    // Jointure entre les tables 'tickets' et 'users' pour obtenir le nom de l'agent (utilisateur)
    const rawData = await sql<{
      id: string; // Nécessaire pour la clé React dans le front-end
      client_name: string; // Alias pour tickets.name
      agency: string;
      agent_name: string; // Alias pour users.name
    }[]>`
      SELECT
          t.id,
          t.name AS client_name,
          t.agency,
          u.name AS agent_name
      FROM
          tickets t
      JOIN
          users u ON t.user_id = u.id
      ORDER BY
          t.agency, u.name, t.name;
    `;

    // 3. Mapper les données brutes en un format ReservationStat
    const reservationStats: ReservationStat[] = rawData.map(row => ({
      nomAgent: row.agent_name,
      nomClient: row.client_name,
      agency: row.agency,
      ticketsIssued: 1, // Chaque ligne représente un ticket individuel
    }));

    // 4. Retourner les statistiques sous forme de réponse JSON
    return NextResponse.json({ stats: reservationStats });

  } catch (err) {
    console.error(`Erreur lors de la récupération des statistiques de réservation détaillées:`, err);
    return NextResponse.json({ error: 'Erreur serveur lors de la récupération des statistiques détaillées.' }, { status: 500 });
  }
}
