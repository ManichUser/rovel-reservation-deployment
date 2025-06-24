// src/app/dashboard/page.tsx
import { TicketCard } from '../components/TicketCard';
import { TicketForm } from '../components/TicketForm';
import { staticTickets } from '../data/ tickets';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-extrabold text-blue-900 text-center mb-10">Tableau de Bord Rovel Ticket</h1>

      {/* Section Enregistrer un Nouveau Ticket */}
      <section className="mb-12">
        <TicketForm />
      </section>

      {/* Section Liste des Tickets Enregistrés */}
      <section>
        <h2 className="text-3xl font-bold text-blue-800 text-center mb-8">Liste des Tickets Enregistrés</h2>
        {staticTickets.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {staticTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600">Aucun ticket enregistré pour le moment.</p>
        )}
      </section>
    </div>
  );
}
