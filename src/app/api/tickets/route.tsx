import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { z } from 'zod';
import { renderToBuffer } from '@react-pdf/renderer';
import bwipjs from 'bwip-js';
import nodemailer from 'nodemailer';
import {TicketPDF} from '../../lib/pdf/TicketDocument';
import { auth } from '@/app/auth';
import { User } from '@/app/lib/definitions';
import QRCode from 'qrcode'
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
  try {
    const payload = serializeTicketForQR(ticket); // JSON.stringify({...})
    const base64 = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      scale: 8,
      margin: 2,
    });

    // Supprimer le préfixe "data:image/png;base64,"
    return base64.split(',')[1];
  } catch (error) {
    console.error('Erreur lors de la génération du QR code:', error);
    throw error;
  }
}


export async function generateTicketPDF(
  ticket: Ticket,
  barcodeBase64: string,
  qrCodeBase64: string
): Promise<Buffer> {
  const pdfBuffer = await renderToBuffer(
    <TicketPDF ticket={ticket} barcodeBuffer={barcodeBase64} qrCodeBuffer={qrCodeBase64} />
  );
  return pdfBuffer;
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
      <p>Cher(e) ${ticket.name}, Rovel-TicketExpress vous remercie pour votre souscription</p>
      <p>Voici les détails de votre réservation :</p>
      <ul>
        <li><strong>Agence :</strong> ${ticket.agency}</li>
        <li><strong>Mode :</strong> ${ticket.mode}</li>
        <li><strong>De :</strong> ${ticket.from} → <strong>À :</strong> ${ticket.to}</li>
        <li><strong>Date :</strong> ${ticket.date} à ${ticket.departureTime}</li>
        <li><strong>Classe :</strong> ${ticket.class}</li>
        <li><strong>Montant :</strong> ${ticket.totalAmount} FCFA</li>
      </ul>
      <p>Veuillez trouver votre code-barres ci-dessous :</p>
      <img src="cid:barcode-ticket" />
      <p>Et votre ticket en pièce jointe (PDF).</p>
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
    id: dbTicket.id,
    agency: dbTicket.agency,
    mode: dbTicket.mode,
    name: dbTicket.name,
    email: dbTicket.email,
    date: dbTicket.date,
    departureTime: dbTicket.departureTime,
    totalAmount: dbTicket.totalAmount,
    class: dbTicket.class,
    from: dbTicket.from,
    to: dbTicket.to,
    userId: dbTicket.userId,
    barcodeUrl: `/images/barcode-${dbTicket.id}.png`,
    thumbnailUrl: `/images/bus-thumbnail.jpeg`
  };
  
  
    
    const barcode = await generateBarcodeBase64(ticket.name + Date.now());
    const qrCode = await generateQRCodeBase64(ticket);
    const pdfBuffer = await generateTicketPDF(ticket, barcode, qrCode); // si tu ajoutes le QR code
    await sendTicketEmail(ticket, barcode, pdfBuffer);
    
    return NextResponse.json({ message: 'Ticket généré et envoyé.', ticketId: ticket.id });
  } catch (err) {
    console.error('Erreur lors du traitement du ticket:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function getTickets():Promise<TicketDBRaw[] | undefined>{
  const TicketData = await sql<TicketDBRaw[]>`SELECT * FROM tickets`
  return TicketData.length>0? TicketData : undefined
}
export async function getTicketsByUser():Promise<TicketDBRaw[] | NextResponse<{ error: string; }> | undefined>{
  try{
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }
    const emailUser = session.user?.email
    const idUser= await getUserIdByEmail(emailUser)
    if (!idUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé.' }, { status: 404 });
    }
    const TicketData = await sql<TicketDBRaw[]>`SELECT * FROM tickets WHERE user_id = ${idUser}`
    return TicketData.length>0? TicketData : undefined
  } catch (err){
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }
    console.error(`Erreur lors de la recuperation des tickets de ${session.user?.name} `, err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }); 
  }
  
}  