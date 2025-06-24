// src/app/data/tickets.ts

export interface Ticket {
  id: string;
  agency: string;
  mode: 'BUS' | 'TRAIN' | 'AVION'; // Ajouté d'autres modes possibles
  name: string;
  email: string; // Email du passager - NOUVEAU CHAMP
  date: string; // Format "JJ/MM/AAAA"
  departureTime: string; // Format "HH:MM"
  totalAmount: number; // Montant en FCFA ou autre
  class: string; // Ex: "Standard", "VIP", "Premiere"
  from: string;
  to: string;
  barcodeUrl: string; // URL d'une image de code-barres statique
  thumbnailUrl: string; // URL d'une image de l'agence ou du bus
}

// Fonction utilitaire pour générer un ID simple
const generateId = () => Math.random().toString(36).substr(2, 9);

export const staticTickets: Ticket[] = [
  {
    id: generateId(),
    agency: "Agence Voyage Rapide",
    mode: "BUS",
    name: "Jean Dupont",
    email: "jean.dupont@example.com", // Ajout de l'email
    date: "25/06/2025",
    departureTime: "08:00",
    totalAmount: 6000,
    class: "Standard",
    from: "DOUALA",
    to: "YAOUNDE",
    barcodeUrl: "/images/barcode-sample.png",
    thumbnailUrl: "/images/bus-thumbnail.jpeg",
  },
  {
    id: generateId(),
    agency: "Agence La Confiance",
    mode: "BUS",
    name: "Marie Curie",
    email: "marie.curie@example.com", // Ajout de l'email
    date: "26/06/2025",
    departureTime: "10:30",
    totalAmount: 7500,
    class: "VIP",
    from: "YAOUNDE",
    to: "DOUALA",
    barcodeUrl: "/images/barcode-sample.png",
    thumbnailUrl: "/images/bus-thumbnail.jpeg",
  },
  {
    id: generateId(),
    agency: "TransExpress",
    mode: "BUS",
    name: "Paul Martin",
    email: "paul.martin@example.com", // Ajout de l'email
    date: "27/06/2025",
    departureTime: "14:00",
    totalAmount: 5000,
    class: "Standard",
    from: "DOUALA",
    to: "BAFOUSSAM",
    barcodeUrl: "/images/barcode-sample.png",
    thumbnailUrl: "/images/bus-thumbnail.jpeg",
  },
];