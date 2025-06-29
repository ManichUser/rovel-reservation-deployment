import { Ticket, TicketDBRaw } from '@/app/data/ tickets';

export function mapTicketDbToTicket(ticketDb: TicketDBRaw): Ticket {
  return {
    id: ticketDb.id,
    agency: ticketDb.agency,
    mode: ticketDb.mode,
    name: ticketDb.name,
    email: ticketDb.email,
    date: ticketDb.date,
    departureTime: ticketDb.departure_time ?? '',
    totalAmount: typeof ticketDb.total_amount === 'number'
      ? ticketDb.total_amount
      : parseFloat(ticketDb.total_amount || '0'),
    class: ticketDb.class,
    from: ticketDb.from_location ?? '',
    to: ticketDb.to_location ?? '',
    userId: ticketDb.user_id ?? '',
    barcodeUrl: `/images/barcode-${ticketDb.id}.png`, // ou à générer dynamiquement
    thumbnailUrl: `/images/bus-thumbnail.jpeg`, // idem
  };
}
