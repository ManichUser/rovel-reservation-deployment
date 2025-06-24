// src/app/components/TicketCard.tsx
import Image from 'next/image';
import { Ticket } from '../data/ tickets';

interface TicketCardProps {
  ticket: Ticket;
}

export const TicketCard = ({ ticket }: TicketCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden my-4 mx-auto  w-[70vw] border border-gray-200">
      <div className="flex flex-col md:flex-row">
        {/* Partie Gauche du Ticket */}
        <div className="flex-1 p-6 relative">
          <div className="absolute top-0 left-0 bg-blue-800 text-white px-4 py-2 rounded-br-lg text-lg font-bold">
            ROVEL TICKET
          </div>

          <div className="text-center md:text-left mt-10 mb-4 text-blue-800 font-semibold text-lg">
            AGENCE CHOISIE: {ticket.agency}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <p className="text-sm text-gray-500">Nom/Nom:</p>
              <p className="font-bold text-gray-800">{ticket.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mode:</p>
              <p className="font-bold text-gray-800 text-xl">{ticket.mode}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date:</p>
              <p className="font-bold text-gray-800">{ticket.date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Classe/Class:</p>
              <p className="font-bold text-gray-800">{ticket.class}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Heure de départ:</p>
              <p className="font-bold text-gray-800">{ticket.departureTime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Montant total:</p>
              <p className="font-bold text-gray-800">{ticket.totalAmount} FCFA</p> {/* Ou devise appropriée */}
            </div>
          </div>

          <div className="mt-8 flex justify-center items-center">
            <div className="bg-blue-800 text-white p-4 rounded-lg text-center">
              <p className="text-sm">From:</p>
              <p className="text-2xl font-bold">{ticket.from}</p>
              <Image
                src={ticket.thumbnailUrl}
                alt="Thumbnail"
                width={80}
                height={80}
                className="mx-auto my-2 rounded-md"
              />
              <p className="text-sm">To:</p>
              <p className="text-2xl font-bold">{ticket.to}</p>
            </div>
          </div>

          {ticket.barcodeUrl && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Image
                src={ticket.barcodeUrl}
                alt="Barcode"
                width={40}
                height={200}
                className="object-contain transform rotate-90 origin-top-left -translate-x-1/2 translate-y-1/2"
                style={{ width: 'auto', height: '100px' }} // Ajustez la hauteur si nécessaire
              />
            </div>
          )}
        </div>

        {/* Partie Droite du Ticket (Déchirable) */}
        <div className="md:w-1/4 bg-gray-100 p-6 flex flex-col items-center justify-between border-l border-dashed border-gray-300">
          <div className="text-center w-full">
            <h3 className="text-2xl font-bold text-blue-800 mb-4">CLASS: {ticket.class}</h3>
            <div className="mb-4">
              <Image
                src={ticket.barcodeUrl}
                alt="Barcode Small"
                width={100}
                height={50}
                className="mx-auto mb-2"
              />
              <p className="text-xs text-gray-600">Mode: {ticket.mode}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Nom/Nom:</p>
              <p className="font-bold text-gray-800">{ticket.name}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Date:</p>
              <p className="font-bold text-gray-800">{ticket.date}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Montant:</p>
              <p className="font-bold text-gray-800">{ticket.totalAmount} FCFA</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Time/Heure:</p>
              <p className="font-bold text-gray-800">{ticket.departureTime}</p>
            </div>
          </div>

          <div className="text-center mt-6 w-full">
            <p className="text-xs text-gray-500">From:</p>
            <p className="text-lg font-bold text-gray-800">{ticket.from}</p>
            <Image
                src={ticket.thumbnailUrl}
                alt="Thumbnail Small"
                width={60}
                height={60}
                className="mx-auto my-2 rounded-md"
              />
            <p className="text-xs text-gray-500">To:</p>
            <p className="text-lg font-bold text-gray-800">{ticket.to}</p>
          </div>
        </div>
      </div>
    </div>
  );
};