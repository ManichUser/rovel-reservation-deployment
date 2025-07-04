// Importation correcte du client postgres
import postgres from 'postgres';

// Importations Next.js et de vos modules locaux
import { auth } from '@/app/auth';
import { notFound } from 'next/navigation';
import { TicketDBRaw } from '@/app/data/ tickets'; // Correction de l'espace dans le chemin
import { mapTicketDbToTicket } from '@/app/lib/mapTicketDbToTicket';
import { User } from '@/app/lib/definitions'; // Assurez-vous que le type User est importé
import Link from 'next/link';
import { TicketCard } from '@/app/components/TicketCard';

// Initialisation du client SQL pour la base de données
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Définition des props attendues par le composant de la page
interface TicketDetailsPageProps {
  params: {
    id: string; 
  };
}

/**
 * Récupère l'ID de l'utilisateur à partir de son adresse e-mail.
 * Cette fonction est déplacée ici pour être réutilisable et claire.
 * @param email L'adresse e-mail de l'utilisateur.
 * @returns L'ID de l'utilisateur sous forme de chaîne ou undefined si non trouvé.
 */
async function getUserIdByEmail(email: string): Promise<string | undefined> {
  try {
    const user = await sql<User[]>`SELECT id FROM users WHERE email = ${email}`;
    return user.length > 0 ? user[0].id.toString() : undefined;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ID utilisateur par email:', error);
    // En cas d'erreur, renvoyer undefined ou propager l'erreur selon la gestion souhaitée
    return undefined;
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

/**
 * Composant de la page de détails d'un ticket.
 * C'est un composant serveur asynchrone qui récupère et affiche les détails d'un ticket spécifique.
 * @param params Contient l'ID du ticket extrait de l'URL.
 */
export default async function TicketDetailsPage({ params }: TicketDetailsPageProps) {
  const ticketId = params.id; // Récupération de l'ID du ticket depuis les paramètres de l'URL

  // Vérification de l'authentification de l'utilisateur
  const session = await auth();
  if (!session?.user?.email) {
    // Si l'utilisateur n'est pas authentifié, afficher un message d'erreur.
    // Dans une application réelle, une redirection vers la page de connexion serait préférable.
    return (
      <section className="mt-24 text-center">
        <h1 className="text-3xl font-bold text-red-600">Authentification requise pour voir les détails.</h1>
        <p className="text-gray-600">Veuillez vous connecter pour accéder à cette page.</p>
      </section>
    );
  }

  // Récupération de l'ID de l'utilisateur à partir de l'email de la session
  const emailUser = session.user.email;
  const idUser = await getUserIdByEmail(emailUser);

  if (!idUser) {
    // Si l'ID utilisateur n'est pas trouvé (par exemple, email de session invalide ou utilisateur supprimé)
    return (
      <section className="mt-24 text-center">
        <h1 className="text-3xl font-bold text-red-600">Utilisateur non trouvé.</h1>
        <p className="text-gray-600">Impossible de lier votre session à un utilisateur existant.</p>
      </section>
    );
  }

  let rawTicket: TicketDBRaw | undefined;
  try {
    // Tenter de récupérer le ticket en s'assurant qu'il appartient à l'utilisateur connecté
    rawTicket = await getTicketByIdAndUser(ticketId, idUser);
  } catch (error) {
    console.error("Échec de la récupération du ticket unique:", error);
    return (
      <section className="mt-24 text-center">
        <h1 className="text-3xl font-bold text-red-600">Erreur lors du chargement du ticket.</h1>
        <p className="text-gray-600">Veuillez réessayer plus tard.</p>
      </section>
    );
  }

  // Si le ticket n'est pas trouvé (ou n'appartient pas à l'utilisateur), afficher une page 404
  if (!rawTicket) {
    notFound(); // Next.js affichera sa page 404 par défaut
  }

  // Mapper le ticket brut de la base de données à la structure de données utilisée côté front-end
  const ticket = mapTicketDbToTicket(rawTicket);

  return (
    <div className="min-h-screen  bg-gray-100 mt-16 p-8">
      <h1 className="text-4xl font-extrabold text-blue-900 text-center mb-10">Détails du Ticket</h1>

      <div className="max-w-screen w-7xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">Ticket pour {ticket.name}</h2>
            <TicketCard ticket={ticket} />
        <div className="mt-8 text-center">
            <Link href="/dashboard" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
                Retour à la liste des tickets
            </Link>
        </div>
      </div>
    </div>
  );
}
