// src/app/api/tickets/route.ts

import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { z } from 'zod';
import { renderToBuffer } from '@react-pdf/renderer';
import bwipjs from 'bwip-js';
import nodemailer from 'nodemailer';
import { TicketPDF } from '../../lib/pdf/TicketDocument';
import { auth } from '@/app/auth';
import { User } from '@/app/lib/definitions';
import QRCode from 'qrcode';
import { Ticket, TicketDBRaw } from '@/app/data/ tickets';

export const runtime = 'nodejs';
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const ticketSchema = z.object({
  agency: z.string(),
  mode: z.enum(['BUS', 'TRAIN', 'AVION']),
  name: z.string(),
  email: z.string().email(),
  date: z.string(),
  departureTime: z.string(),
  totalAmount: z.number(),
  class: z.string(),
  from: z.string(),
  to: z.string(),
});

function serializeTicketForQR(ticket: Ticket): string {
  return JSON.stringify({
    name: ticket.name,
    agency: ticket.agency,
    mode: ticket.mode,
    date: ticket.date,
    departureTime: ticket.departureTime,
    from: ticket.from,
    to: ticket.to,
    class: ticket.class,
    totalAmount: ticket.totalAmount,
  });
}

async function getUserIdByEmail(email: string): Promise<string | undefined> {
  const user = await sql<User[]>`SELECT id FROM users WHERE email = ${email}`;
  return user.length > 0 ? user[0].id.toString() : undefined;
}

export async function generateBarcodeBase64(content: string): Promise<string> {
  const buffer = await bwipjs.toBuffer({
    bcid: 'code128',
    text: content,
    scale: 3,
    height: 10,
    includetext: true,
    textxalign: 'center',
  });
  return buffer.toString('base64');
}

export async function generateQRCodeBase64(ticket: Ticket): Promise<string> {
  const payload = serializeTicketForQR(ticket);
  const base64 = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    scale: 8,
    margin: 2,
  });
  return base64.split(',')[1];
}

async function generateTicketPDF(ticket: Ticket, barcodeBase64: string, qrCodeBase64: string): Promise<Buffer> {
  return await renderToBuffer(
    <TicketPDF ticket={ticket} barcodeBuffer={barcodeBase64} qrCodeBuffer={qrCodeBase64} />
  );
}

async function sendTicketEmail(ticket: Ticket, barcodeBase64: string, pdfBuffer: Buffer) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const barcodeBuffer = Buffer.from(barcodeBase64, 'base64');
  await transporter.sendMail({
    from: `"Rovel Reservation" <${process.env.EMAIL_FROM}>`,
    to: ticket.email,
    subject: 'Votre ticket de réservation',
    html: `
      <p>Cher(e) ${ticket.name}, merci pour votre réservation via Rovel-TicketExpress.</p>
      <p>Voici les détails de votre réservation :</p>
      <ul>
        <li><strong>Agence :</strong> ${ticket.agency}</li>
        <li><strong>Mode :</strong> ${ticket.mode}</li>
        <li><strong>De :</strong> ${ticket.from} → <strong>À :</strong> ${ticket.to}</li>
        <li><strong>Date :</strong> ${ticket.date} à ${ticket.departureTime}</li>
        <li><strong>Classe :</strong> ${ticket.class}</li>
        <li><strong>Montant :</strong> ${ticket.totalAmount} FCFA</li>
      </ul>
      <p>Code-barres ci-dessous :</p>
      <img src="cid:barcode-ticket" />
      <p>Votre ticket est joint en PDF.</p>
    `,
    attachments: [
      {
        filename: 'barcode.png',
        content: barcodeBuffer,
        contentType: 'image/png',
        cid: 'barcode-ticket',
      },
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
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const userId = await getUserIdByEmail(userEmail);
    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non trouvé.' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = ticketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;

    const inserted = await sql<Ticket[]>`
      INSERT INTO tickets (agency, mode, name, email, date, departure_time, total_amount, class, from_location, to_location, user_id)
      VALUES (${data.agency}, ${data.mode}, ${data.name}, ${data.email}, ${data.date},
        ${data.departureTime}, ${data.totalAmount}, ${data.class}, ${data.from}, ${data.to}, ${userId})
      RETURNING id, agency, mode, name, email, date,
                departure_time AS "departureTime",
                total_amount AS "totalAmount",
                class,
                from_location AS "from",
                to_location AS "to",
                user_id AS "userId";
    `;

    const dbTicket = inserted[0];

    const ticket: Ticket = {
      ...dbTicket,
      barcodeUrl: `/images/barcode-${dbTicket.id}.png`,
      thumbnailUrl: `/images/bus-thumbnail.jpeg`,
    };

    const barcode = await generateBarcodeBase64(ticket.name + Date.now());
    const qrCode = await generateQRCodeBase64(ticket);
    const pdfBuffer = await generateTicketPDF(ticket, barcode, qrCode);
    await sendTicketEmail(ticket, barcode, pdfBuffer);

    return NextResponse.json({ message: 'Ticket généré et envoyé.', ticketId: ticket.id });
  } catch (err) {
    console.error('Erreur lors du traitement du ticket:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await getTicketsByUser();

    if (result && 'error' in result && 'status' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ tickets: result ?? [] }, { status: 200 });
  } catch (err) {
    console.error(`Erreur inattendue dans la route GET /api/tickets:`, err);
    return NextResponse.json({ error: 'Erreur serveur interne inattendue.' }, { status: 500 });
  }
}

export async function getTickets(): Promise<TicketDBRaw[] | { error: string; status: number } | undefined> {
  try {
    const TicketData = await sql<TicketDBRaw[]>`SELECT * FROM tickets`;
    return TicketData.length > 0 ? TicketData : undefined;
  } catch (err) {
    console.error(`Erreur lors de la récupération de tous les tickets:`, err);
    return { error: 'Erreur serveur lors de la récupération de tous les tickets.', status: 500 };
  }
}

export async function getTicketsByUser(): Promise<TicketDBRaw[] | { error: string; status: number } | undefined> {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { error: 'Authentification requise.', status: 401 };
    }

    const emailUser = session.user.email;
    const idUser = await getUserIdByEmail(emailUser);
    if (!idUser) {
      return { error: 'Utilisateur non trouvé.', status: 404 };
    }

    const TicketData = await sql<TicketDBRaw[]>`SELECT * FROM tickets WHERE user_id = ${idUser}`;
    return TicketData.length > 0 ? TicketData : undefined;
  } catch (err) {
    console.error(`Erreur lors de la récupération des tickets utilisateur:`, err);
    return { error: 'Erreur serveur lors de la récupération des tickets.', status: 500 };
  }
}
