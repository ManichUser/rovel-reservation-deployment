// src/app/components/TicketActions.tsx
'use client'; // Ce composant est un Composant Client

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteTicket } from '@/app/lib/actionsTicket'; // Importez votre Server Action de suppression

interface TicketActionsProps {
  ticketId: string;
  ticketName: string;
  ticketAgency: string;
}

export function TicketActions({ ticketId, ticketName, ticketAgency }: TicketActionsProps) {
  // const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le ticket pour ${ticketName} (${ticketAgency})?`)) {
      setIsDeleting(true);
      const result = await deleteTicket(ticketId); // Appel de la Server Action
      if (!result.success) {
        alert(result.error || 'Échec de la suppression du ticket.'); // Utilisez une modale personnalisée en production
      }
      setIsDeleting(false);
      // La revalidation de /dashboard est gérée par le Server Action (revalidatePath)
      // Pas besoin de router.refresh() ici.
    }
  };

  // const handleEditClick = () => {
  //   // Navigue vers la même page (/dashboard) mais avec un paramètre de recherche 'editId'
  //   router.push(`/dashboard?editId=${ticketId}`);
  // };

  return (
    <div className="mt-4 flex flex-wrap gap-3 justify-end"> {/* Ajusté pour aligner les boutons à droite */}
      <Link
        href={`/dashboard/tickets/${ticketId}`}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Voir les détails
      </Link>
      {/* <button
        onClick={handleEditClick}
        className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
      >
        Modifier
      </button> */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isDeleting ? 'Suppression...' : 'Supprimer'}
      </button>
    </div>
  );
}
