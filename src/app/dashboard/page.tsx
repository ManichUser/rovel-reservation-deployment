import { auth } from '@/app/auth'; // Pour obtenir la session côté serveur
import { getTickets, getTicketsByUser } from '../api/tickets/route'; // Importez les deux fonctions
import { TicketCard } from '../components/ticketCard2';
import { TicketForm } from '../components/TicketForm'; // Composant client
import { mapTicketDbToTicket } from '../lib/mapTicketDbToTicket';
import { Ticket,TicketDBRaw } from '../data/ tickets';
import { Suspense } from 'react'; // Pour la gestion du chargement des searchParams
import { getTicketByIdAndUser } from './tickets/[id]/page'; // Importez la fonction de récupération d'un seul ticket
import postgres from 'postgres'; // Pour getUserIdByEmailInternal

// Composant pour afficher un message de chargement pour les searchParams
function LoadingSearchParams() {
  return <p className="text-center text-gray-600">Chargement des paramètres...</p>;
}

// Fonction utilitaire pour obtenir l'ID de l'utilisateur (copie interne pour éviter les dépendances circulaires)
async function getUserIdByEmailInternal(email: string): Promise<string | undefined> {
  const sqlInternal = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
  const user = await sqlInternal`SELECT id FROM users WHERE email = ${email}`;
  return user.length > 0 ? user[0].id.toString() : undefined;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: {
    editId?: string; // L'ID du ticket à éditer, si présent dans l'URL
  };
}) {
  // const editTicketId = searchParams?.editId;

  // 1. Vérification de la session et des droits d'administrateur (côté serveur)
  const session = await auth();
  const username = session?.user?.name;
  const isAdmin = username === "Ronel Mbami";

  let tickets: Ticket[] = [];
  let ticketsError: string | null = null;
  // let ticketToEdit: Ticket | undefined = undefined;
  let editTicketError: string | null = null;

  if (isAdmin) {
    // --- Logique pour les Administrateurs ---
    let rawAdminTickets: TicketDBRaw[] | undefined;
    const result = await getTickets(); // Récupère TOUS les tickets
    if (Array.isArray(result)) {
      rawAdminTickets = result;
    } else if (result && typeof result === 'object' && 'error' in result) {
      ticketsError = result.error as string;
    } else {
      ticketsError = 'Erreur inattendue lors du chargement de tous les tickets.';
    }
    tickets = rawAdminTickets ? rawAdminTickets.map(mapTicketDbToTicket) : [];

    // Si un ID d'édition est présent pour l'admin, essayer de récupérer ce ticket
    // if (editTicketId) {
    //   try {
    //     // Pour l'admin, on peut récupérer le ticket par ID sans vérifier l'user_id
    //     // Si vous voulez que l'admin ne puisse éditer que les tickets qu'il a créés,
    //     // vous pouvez passer son userId ici aussi. Pour une gestion complète, on ne le fait pas.
    //     const rawEditTicket = await getTicketByIdAndUser(editTicketId, 'admin_access'); // 'admin_access' est un placeholder, la fonction getTicketByIdAndUser devra être adaptée pour l'admin
    //     if (rawEditTicket) {
    //       ticketToEdit = mapTicketDbToTicket(rawEditTicket);
    //     } else {
    //       editTicketError = `Ticket avec l'ID ${editTicketId} non trouvé pour l'édition.`;
    //     }
    //   } catch (error) {
    //     console.error('Erreur lors de la récupération du ticket pour édition (admin):', error);
    //     editTicketError = 'Erreur serveur lors du chargement du ticket pour édition.';
    //   }
    // }

  } else {
    // --- Logique pour les Utilisateurs Normaux ---
    if (!session?.user?.email) {
      ticketsError = 'Authentification requise pour charger vos tickets.';
    } else {
      const result = await getTicketsByUser(); // Récupère les tickets de l'utilisateur
      let rawTickets
      if (Array.isArray(result)) {
        rawTickets = result;
      } else if (result && typeof result === 'object' && 'error' in result) {
        ticketsError = result.error as string;
      } else {
        ticketsError = 'Erreur inattendue lors du chargement de vos tickets.';
      }
      tickets = rawTickets ? rawTickets.map(mapTicketDbToTicket) : [];

      // Si un ID d'édition est présent pour l'utilisateur normal
      // if (editTicketId && session?.user?.email) {
      //   try {
      //     const currentUserId = await getUserIdByEmailInternal(session.user.email);
      //     if (currentUserId) {
      //       const rawEditTicket = await getTicketByIdAndUser(editTicketId, currentUserId);
      //       if (rawEditTicket) {
      //         ticketToEdit = mapTicketDbToTicket(rawEditTicket);
      //       } else {
      //         editTicketError = `Ticket avec l'ID ${editTicketId} non trouvé ou non autorisé.`;
      //       }
      //     } else {
      //       editTicketError = 'Impossible de récupérer l\'ID utilisateur pour l\'édition.';
      //     }
      //   } catch (error) {
      //     console.error('Erreur lors de la récupération du ticket pour édition (utilisateur):', error);
      //     editTicketError = 'Erreur serveur lors du chargement du ticket pour édition.';
      //   }
      // }
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 mt-16 p-8">
      <h1 className="text-4xl font-extrabold text-blue-900 text-center mb-10">
        Tableau de Bord Rovel Ticket
      </h1>

      {/* Section du formulaire de création/modification */}
      <section className="mb-12">
        {editTicketError && (
          <div className="w-full justify-center flex text-red-600 font-bold mb-4">{editTicketError}</div>
        )}
        <Suspense fallback={<LoadingSearchParams />}>
          <section className="mb-12">
            <TicketForm />
          </section>
        </Suspense>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-blue-800 text-center mb-8">
          {isAdmin ? 'Gestion de Tous les Tickets' : 'Liste de Mes Tickets Enregistrés'}
        </h2>
        {ticketsError ? (
          <div className='w-full justify-center flex text-red-600 font-bold'>{ticketsError}</div>
        ) : tickets.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {tickets.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600">
            {isAdmin ? 'Aucun ticket enregistré dans la base de données.' : 'Aucun ticket enregistré pour le moment.'}
          </p>
        )}
      </section>
    </div>
  );
}
