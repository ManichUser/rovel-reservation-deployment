// src/app/api/tickets/route.ts
import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import fsPromises from 'fs/promises';
import bwipjs from 'bwip-js';
import nodemailer from 'nodemailer';
import path from 'path';
import os from 'os';
import { User } from '@/app/lib/definitions';
import { getSession } from 'next-auth/react';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Zod Schema de validation
const ticketSchema = z.object({
  agency: z.string(),
  mode: z.string(),
  name: z.string(),
  email: z.string().email(),
  date: z.string(),
  departureTime: z.string(),
  totalAmount: z.number().min(0, "Le montant total doit être un nombre positif."),
  class: z.string(),
  from: z.string(),
  to: z.string(),
  userId: z.string().optional(), // Optionnel si l'utilisateur est connecté
});

// NOUVELLE FONCTION: Récupérer l'ID de l'utilisateur par email
async function getUserIdByEmail(email: string): Promise<string | undefined> {
  try {
      // Assurez-vous que votre table 'users' a une colonne 'id' et 'email'
      const user = await sql<User[]>`SELECT id FROM users WHERE email = ${email}`;
      if (user.length > 0) {
          // L'ID pourrait être un UUID ou autre, assurez-vous de le convertir en string si nécessaire pour NextAuth ou la BDD
          return user[0].id.toString();
      }
      return undefined; // Utilisateur non trouvé
  } catch (error) {
      console.error('Erreur lors de la récupération de l\'ID utilisateur par email:', error);
      throw new Error('Impossible de récupérer l\'ID utilisateur.');
  }
}

// Génération du code-barres
async function generateBarcode(id: string): Promise<string> {
  const buffer = await bwipjs.toBuffer({
    bcid: 'code128',
    text: id,
    scale: 3,
    height: 10,
    includetext: true,
    textxalign: 'center',
  });
  const filePath = path.join(os.tmpdir(), `barcode-${id}.png`);
  await fsPromises.writeFile(filePath, buffer);
  return filePath;
}

// Génération du PDF
async function generateTicketPDF(ticket: any): Promise<string> {
  const doc = new PDFDocument();
  const filePath = path.join(os.tmpdir(), `ticket-${Date.now()}.pdf`);
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(20).text('Ticket de réservation', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Nom: ${ticket.name}`);
  doc.text(`Email: ${ticket.email}`);
  doc.text(`Agence: ${ticket.agency}`);
  doc.text(`Mode: ${ticket.mode}`);
  doc.text(`De: ${ticket.from} → À: ${ticket.to}`);
  doc.text(`Date: ${ticket.date} à ${ticket.departureTime}`);
  doc.text(`Classe: ${ticket.class}`);
  doc.text(`Montant: ${ticket.totalAmount} FCFA`);

  const barcodePath = await generateBarcode(ticket.name + Date.now());
  doc.image(barcodePath, { width: 200 });
  doc.end();

  return new Promise((resolve) => {
    stream.on('finish', () => resolve(filePath));
  });
}

// Envoi par email
async function sendTicketEmail(email: string, pdfPath: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const pdfBuffer = await fsPromises.readFile(pdfPath);

  await transporter.sendMail({
    from: `"Rovel Reservation" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Votre ticket de réservation',
    text: 'Veuillez trouver en pièce jointe votre ticket.',
    attachments: [
      {
        filename: 'ticket.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}


export async function POST(req: Request) {
  try {
      // 1. Récupérer la session de l'utilisateur
      const session = await getSession();

      // Vérifier si l'utilisateur est authentifié et si son email est disponible
      if (!session || !session.user || !session.user.email) {
          return NextResponse.json({ error: 'Authentification requise pour enregistrer un ticket.' }, { status: 401 });
      }

      const userEmail = session.user.email; // L'email de l'utilisateur authentifié
      
      // 2. Récupérer l'ID de l'utilisateur via son email
      const userId = await getUserIdByEmail(userEmail);

      if (!userId) {
          console.error(`Erreur: ID utilisateur non trouvé pour l'email ${userEmail}`);
          return NextResponse.json({ error: 'ID utilisateur non trouvé après authentification.' }, { status: 404 });
      }

      const body = await req.json();
      const parsed = ticketSchema.safeParse(body);

      if (!parsed.success) {
          console.error("Validation failed:", parsed.error.flatten().fieldErrors);
          return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
      }

      const ticketData = parsed.data;

      // 3. Enregistrer le ticket dans la base de données Neon, incluant l'ID de l'utilisateur
      // ASSUREZ-VOUS QUE VOTRE TABLE 'tickets' A UNE COLONNE 'user_id' (par exemple, de type TEXT ou UUID)
      const insertedTicket = await sql`
          INSERT INTO tickets (agency, mode, name, email, date, departure_time, total_amount, class, from_location, to_location, user_id)
          VALUES (
              ${ticketData.agency}, ${ticketData.mode}, ${ticketData.name}, ${ticketData.email}, ${ticketData.date},
              ${ticketData.departureTime}, ${ticketData.totalAmount},
              ${ticketData.class}, ${ticketData.from}, ${ticketData.to}, ${userId}
          )
          RETURNING id, agency, mode, name, email, date, departure_time, total_amount, class, from_location, to_location, user_id;
      `;

      if (!insertedTicket || insertedTicket.length === 0) {
          throw new Error("Failed to insert ticket into database.");
      }
      const createdTicket = insertedTicket[0];

      // 4. Générer le PDF du ticket
      const pdfPath = await generateTicketPDF(createdTicket);
      console.log(`PDF généré à: ${pdfPath}`);

      // 5. Envoyer le PDF par email au client
      await sendTicketEmail(createdTicket.email, pdfPath);
      console.log(`Email envoyé à: ${createdTicket.email}`);

      // 6. Nettoyer les fichiers temporaires (PDF)
      try {
          await fsPromises.unlink(pdfPath);
          console.log(`Fichier PDF temporaire supprimé: ${pdfPath}`);
      } catch (cleanErr) {
          console.warn(`Attention: Impossible de supprimer le fichier PDF temporaire ${pdfPath}. Erreur:`, cleanErr);
      }

      return NextResponse.json({ message: 'Ticket enregistré, généré et envoyé avec succès !', ticketId: createdTicket.id });
  } catch (err) {
      console.error('Erreur globale lors du traitement du ticket:', err);
      if (err instanceof z.ZodError) {
          return NextResponse.json({ error: "Données de formulaire invalides", details: err.flatten().fieldErrors }, { status: 400 });
      }
      return NextResponse.json({ error: 'Erreur interne du serveur lors du traitement du ticket.' }, { status: 500 });
  }
}
