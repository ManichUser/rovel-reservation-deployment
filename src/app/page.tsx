'use client';

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { TicketDBRaw } from '@/app/data/ tickets'; // Correction de l'espace dans le chemin

// Définir l'interface pour les statistiques de réservation réelles
// Elle doit correspondre à ce que votre API /api/reservation-stats retourne
interface ReservationStat {
  nomAgent: string;
  nomClient: string;
  agency: string;
  ticketsIssued: number;
}

type CardProps = {
  title: string;
  description: string;
  href: string;
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const username = session?.user?.name;
  const isAdmin = username === "Ronel Mbami"; // Vérification de l'administrateur

  // Utilisez ReservationStat pour le type de l'état des réservations
  const [reservations, setReservations] = useState<ReservationStat[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false); // Nouveau état de chargement pour les stats admin
  const [reservationsError, setReservationsError] = useState<string | null>(null); // Nouvel état d'erreur pour les stats admin

  // État existant pour les tickets de l'utilisateur normal
  const [userTickets, setUserTickets] = useState<TicketDBRaw[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  useEffect(() => {
    // Logique de récupération des statistiques pour l'administrateur
    if (isAdmin) {
      const fetchReservationStats = async () => {
        setLoadingReservations(true);
        setReservationsError(null);
        try {
          const response = await fetch('/api/reservation-stats'); // Appel à la nouvelle route API

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Échec de la récupération des statistiques de réservation.');
          }
          const data = await response.json();
          setReservations(data.stats || []); // Met à jour l'état avec les données réelles
        } catch (error: any) {
          console.error('Erreur lors de la récupération des statistiques de réservation:', error);
          setReservationsError(error.message || 'Impossible de charger les statistiques de réservation.');
        } finally {
          setLoadingReservations(false);
        }
      };
      fetchReservationStats();
    }
    // Logique existante pour la récupération des tickets de l'utilisateur normal
    else if (status === "authenticated" && session?.user?.email) {
      const fetchUserTickets = async () => {
        setLoadingTickets(true);
        setTicketsError(null);
        try {
          const response = await fetch('/api/tickets');

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Échec de la récupération des tickets');
          }
          const data = await response.json();
          setUserTickets(data.tickets || []);
        } catch (error: any) {
          console.error('Erreur lors de la récupération des tickets de l\'utilisateur:', error);
          setTicketsError(error.message || 'Impossible de charger vos tickets.');
        } finally {
          setLoadingTickets(false);
        }
      };
      fetchUserTickets();
    } else if (status === "unauthenticated") {
      setLoadingTickets(false);
    }
  }, [isAdmin, status, session]); // Dépendances du useEffect

  if (status === "loading") return <p className="text-center py-44">Chargement...</p>;

  return (
    <main className="min-h-screen pt-24 w-full bg-gray-50 py-16 px-6 lg:px-32">
      <section className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-blue-800 mb-4">Bienvenue sur Rovel-TicketExpress</h1>
        <p className="text-lg text-gray-700 mb-8">
          {isAdmin ? (
            <>Vous êtes connecté en tant que <span className="font-semibold">Administrateur</span>.</>
          ) : (
            <>Bonjour <span className="font-semibold">{username || "invité(e)"}</span>, voici votre espace de réservation de billets. 
          {!username?( <Link color="bleue" href='/login'>
            Veuillez vous <span className="text-red-600">connectez</span> pour travailler
            </Link>):" " }
            </>
          )}
        </p>

        {isAdmin && (
          <>
            {/* Le titre peut rester "Statistiques de Réservation" mais le contenu sera plus détaillé */}
            <h2 className="text-2xl font-semibold text-black text-left mb-4">Détails des Réservations</h2>
            <div className="overflow-x-auto bg-white rounded-xl shadow-lg mb-8">
              {loadingReservations ? (
                <p className="text-gray-600 p-4">Chargement des détails de réservation...</p>
              ) : reservationsError ? (
                <p className="text-red-600 p-4">Erreur : {reservationsError}</p>
              ) : reservations.length > 0 ? (
                <table className="min-w-full text-black">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-center">Nom Agent</th>
                      <th className="px-6 py-4 text-center">Nom Client</th>
                      <th className="px-6 py-4 text-center">Agence</th>
                      <th className="px-6 py-4 text-left">Tickets Émis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((res, i) => (
                      <tr key={i} className="border-b hover:bg-gray-100">
                        <td className="px-6 py-4 font-medium">{res.nomAgent}</td>
                        <td className="px-6 py-4">{res.nomClient}</td>
                        <td className="px-6 py-4">{res.agency}</td>
                        <td className="px-6 py-4">{res.ticketsIssued}</td> {/* Sera toujours 1 ici */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-600 p-4">Aucune réservation détaillée disponible.</p>
              )}
            </div>
          </>
        )}

        <div className="grid gap-6 md:grid-cols-2 text-left">
          {isAdmin ? (
            <>
              <AdminCard
                title="Gestion des Agents"
                description="Ajouter, modifier ou supprimer des agents enregistrés."
                href="/agents"
              />
              <AdminCard
                title="Toutes les Réservations"
                description="Consulter toutes les réservations enregistrées."
                href="/dashboard" // Ou un autre chemin si vous avez une page dédiée pour toutes les réservations
              />
            </>
          ) : (
            <>
              {/* Affichage des tickets de l'utilisateur */}
              <div className="md:col-span-2 mt-8">
                <h2 className="text-2xl font-semibold text-black text-left mb-4">Vos Tickets Enregistres</h2>
                {loadingTickets ? (
                  <p className="text-gray-600">Chargement de vos tickets...</p>
                ) : ticketsError ? (
                  <p className="text-red-600">Erreur : {ticketsError}</p>
                ) : userTickets.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {userTickets.map((ticket) => (
                      <div key={ticket.id} className="p-4 bg-white shadow-md rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold text-blue-700 mb-1">{ticket.agency} - {ticket.mode}</h3>
                        <p className="text-gray-600 text-sm">{ticket.from_location} → {ticket.to_location}</p>
                        <p className="text-gray-600 text-sm">Date : {ticket.date} à {ticket.departure_time}</p>
                        <p className="text-gray-600 text-sm">Classe : {ticket.class}</p>
                        <p className="text-gray-800 font-bold mt-2">Montant : {ticket.total_amount} FCFA</p>
                        <Link href={`/dashboard/tickets/${ticket.id}`} className="mt-3 inline-block text-blue-600 hover:underline text-sm">
                          Voir les détails
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Vous n'avez pas encore de tickets réservés. <Link href="/dashboard" className="text-blue-600 hover:underline">Réservez-en un maintenant !</Link></p>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function AdminCard({ title, description, href }: CardProps) {
  return (
    <Link
      href={href}
      className="p-6 bg-white shadow-md rounded-xl hover:shadow-xl transition duration-200"
    >
      <h2 className="text-xl font-semibold text-blue-700 mb-2">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </Link>
  );
}

