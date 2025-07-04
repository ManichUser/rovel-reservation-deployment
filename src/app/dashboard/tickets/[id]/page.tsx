// src/app/dashboard/tickets/[id]/page.tsx

import postgres from 'postgres';
import { auth } from '@/app/auth';
import { notFound } from 'next/navigation';
import { TicketDBRaw } from '@/app/data/ tickets'; 
import { mapTicketDbToTicket } from '@/app/lib/mapTicketDbToTicket';
import { User } from '@/app/lib/definitions';
import Link from 'next/link';
import { TicketCard } from '@/app/components/TicketCard';
import { getTicketByIdAndUser } from '@/app/lib/actionsTicket';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getUserIdByEmail(email: string): Promise<string | undefined> {
  try {
    const user = await sql<User[]>`SELECT id FROM users WHERE email = ${email}`;
    return user.length > 0 ? user[0].id.toString() : undefined;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'ID utilisateur :", error);
    return undefined;
  }
}

export default async function TicketDetailsPage({ params }: PageProps) {
  const { id: ticketId } = await params;
  const session = await auth();
  if (!session?.user?.email) {
    return (
      <section className="mt-24 text-center">
        <h1 className="text-3xl font-bold text-red-600">Authentification requise</h1>
        <p className="text-gray-600">Veuillez vous connecter pour accéder à cette page.</p>
      </section>
    );
  }

  const idUser = await getUserIdByEmail(session.user.email);
  if (!idUser) {
    return (
      <section className="mt-24 text-center">
        <h1 className="text-3xl font-bold text-red-600">Utilisateur non trouvé</h1>
        <p className="text-gray-600">Impossible de lier votre session à un utilisateur existant.</p>
      </section>
    );
  }

  let rawTicket: TicketDBRaw | undefined;
  try {
    rawTicket = await getTicketByIdAndUser(ticketId, idUser);
  } catch (error) {
    console.error("Erreur récupération ticket:", error);
    return (
      <section className="mt-24 text-center">
        <h1 className="text-3xl font-bold text-red-600">Erreur de chargement</h1>
        <p className="text-gray-600">Veuillez réessayer plus tard.</p>
      </section>
    );
  }

  if (!rawTicket) {
    notFound();
  }

  const ticket = mapTicketDbToTicket(rawTicket);

  return (
    <div className="min-h-screen bg-gray-100 mt-16 p-8">
      <h1 className="text-4xl font-extrabold text-blue-900 text-center mb-10">Détails du Ticket</h1>
      <div className="max-w-screen w-7xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">Ticket pour {ticket.name}</h2>
        <TicketCard ticket={ticket} />
        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retour à la liste des tickets
          </Link>
        </div>
      </div>
    </div>
  );
}
