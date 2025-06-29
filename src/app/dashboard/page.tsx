
import { getTicketsByUser } from '../api/tickets/route';
import { TicketCard } from '../components/TicketCard';
import { TicketForm } from '../components/TicketForm';
import { mapTicketDbToTicket } from '../lib/mapTicketDbToTicket';

export default async function DashboardPage() {
  const rawTickets  = await getTicketsByUser();

  if (!Array.isArray(rawTickets)) {
    return ( 
    <section className="mt-24 ">
      <div className=' w-screen justify-center flex text-red-600 font-bold '>Erreur de chargement des tickets</div>
      <TicketForm />
      
    </section>
    )
  }

  const tickets = rawTickets.map(mapTicketDbToTicket);

  return (
    <div className="min-h-screen bg-gray-100 mt-16 p-8">
      <h1 className="text-4xl font-extrabold text-blue-900 text-center mb-10">Tableau de Bord Rovel Ticket</h1>

      <section className="mb-12">
        <TicketForm />
      </section>

      <section>
        <h2 className="text-3xl font-bold text-blue-800 text-center mb-8">Liste des Tickets Enregistrés</h2>
        {tickets.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {tickets.map(ticket => (
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
