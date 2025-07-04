// src/app/components/TicketCard.tsx
import { Ticket } from '@/app/data/ tickets';
import { TicketActions } from './TicketAction';
import { auth } from '../auth';
import Link from 'next/link';

interface TicketCardProps {
  ticket: Ticket;
}

export const TicketCard = async ({ ticket }: TicketCardProps) => {
  // Génération des codes-barres et QR codes côté serveur
const session = await auth()
const username = session?.user?.name;
const isAdmin = username === "Ronel Mbami";
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden my-4 mx-auto border border-gray-200">
        <div className="grid px-4 grid-cols-1 md:grid-cols-2 gap-4 text-lg">
          <p><strong>Agence:</strong> {ticket.agency}</p>
          <p><strong>Mode:</strong> {ticket.mode}</p>
          <p><strong>De:</strong> {ticket.from}</p>
          <p><strong>À:</strong> {ticket.to}</p>
          <p><strong>Date:</strong> {ticket.date}</p>
          <p><strong>Heure de départ:</strong> {ticket.departureTime}</p>
          <p><strong>Classe:</strong> {ticket.class}</p>
          <p><strong>Montant Total:</strong> {ticket.totalAmount} FCFA</p>
          <p className="md:col-span-2"><strong>Email:</strong> {ticket.email}</p>
        </div>
      {/* Intégration du composant client pour les actions */}
      {isAdmin?(
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <TicketActions ticketId={ticket.id} ticketName={ticket.name} ticketAgency={ticket.agency} />
                </div>
              ):
              ( <Link
              href={`/dashboard/tickets/${ticket.id}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
              Voir les détails
            </Link>)
              }
    </div>
  );
};
