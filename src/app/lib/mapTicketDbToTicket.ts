// lib/mappers.ts ou utils/ticketMapper.ts
// import { Ticket, TicketDB } from '../data/tickets'; 
import { Ticket,TicketDBRaw } from "../data/ tickets";

export function mapTicketDbToTicket(ticketDb: TicketDBRaw): Ticket {
  return {
    id: ticketDb.id,
    agency: ticketDb.agency,
    mode: ticketDb.mode,
    name: ticketDb.name,
    email: ticketDb.email,
    date: ticketDb.date,
    departureTime: ticketDb.departure_time,
    totalAmount: ticketDb.total_amount,
    class: ticketDb.class,
    from: ticketDb.from_location,
    to: ticketDb.to_location,
    userId: ticketDb.user_id,
    barcodeUrl: '/images/barcode-sample.png', // valeur par défaut ou à générer
    thumbnailUrl: '/images/bus-thumbnail.jpeg', // idem
  };
}
