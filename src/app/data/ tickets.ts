// src/app/data/tickets.ts

import { ReactNode } from "react";

export interface TicketDB {
  id: string;
  agency: string;
  mode: 'BUS' | 'TRAIN' | 'AVION';
  name: string;
  email: string;
  date: string;
  departureTime: string;
  totalAmount: number;
  class: 'Classique'|'VIP';
  from: string;
  to: string;
  userId: string;
}
// types.ts ou data/tickets.ts

export interface TicketDBRaw {
  id: string;
  agency: string;
  mode: 'BUS' | 'TRAIN' | 'AVION';
  name: string;
  email: string;
  date: string;
  departure_time: string;
  total_amount: number;
  class: 'Classique' | 'VIP';
  from_location: string;
  to_location: string;
  user_id: string;
}

export interface Ticket extends TicketDB {

  barcodeUrl: string;
  thumbnailUrl: string;
}


// Fonction utilitaire pour générer un ID simple
const generateId = () => Math.random().toString(36).substr(2, 9);

