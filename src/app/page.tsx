'use client';

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Reservation {
  agent: string;
  totalReservations: number;
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
  const isAdmin = username === "Ronel Mbami";

  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    if (isAdmin) {
      // Simuler les données de réservations
      setReservations([
        { agent: "Agent Alpha", totalReservations: 20, ticketsIssued: 17 },
        { agent: "Agent Bravo", totalReservations: 35, ticketsIssued: 30 },
        { agent: "Agent Charlie", totalReservations: 15, ticketsIssued: 14 },
      ]);
    }
  }, [isAdmin]);

  if (status === "loading") return <p className="text-center py-44">Chargement...</p>;

  return (
    <main className="min-h-screen pt-24 w-full bg-gray-50 py-16 px-6 lg:px-32">
      <section className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-blue-800 mb-4">Bienvenue sur Rovel-TicketExpress</h1>
        <p className="text-lg text-gray-700 mb-8">
          {isAdmin ? (
            <>Vous êtes connecté en tant qu'<span className="font-semibold">Administrateur</span>.</>
          ) : (
            <>Bonjour <span className="font-semibold">{username || "invité(e)"}</span>, voici votre espace de réservation de billets.</>
          )}
        </p>

        {isAdmin && (
          <>
            <h2 className="text-2xl font-semibold text-black text-left mb-4">Statistiques de Réservation</h2>
            <div className="overflow-x-auto bg-white rounded-xl shadow-lg mb-8">
              <table className="min-w-full text-black">
                <thead className="bg-blue-600 text-white">
                  <tr className="flex justify-between">
                    <th className="px-6 py-3 text-left">Agent</th>
                    <th className="px-6 py-3 text-left">Total Réservations</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((res, i) => {
                    const taux = Math.round((res.ticketsIssued / res.totalReservations) * 100);
                    return (
                      <tr key={i} className="border-b hover:bg-gray-100 flex justify-between">
                        <td className="px-6 py-4 font-medium">{res.agent}</td>
                        <td className="px-6 py-4">{res.totalReservations}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
                title="Réservations"
                description="Consulter toutes les réservations enregistrées."
                href="/reservations"
              />
            </>
          ) : (
            <>
              <UserCard
                title="Mes tickets"
                description="Consultez vos tickets réservés et recevez-les par WhatsApp."
                href="/dashboard"
              />
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

function UserCard({ title, description, href }: CardProps) {
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
