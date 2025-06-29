import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Ticket } from '@/app/data/ tickets';

const styles = StyleSheet.create({
  page: { padding: 24 },
  section: { marginBottom: 12 },
  title: { fontSize: 20, textAlign: 'center', marginBottom: 12 },
  label: { fontSize: 12, marginBottom: 4 },
  barcode: { width: 200, height: 60, marginTop: 10 },
  qrcode: { width: 100, height: 100, marginTop: 10 },
});

type TicketPDFProps = {
  ticket: Ticket;
  barcodeBuffer: string;
  qrCodeBuffer: string; 
};

export const TicketPDF = ({ ticket, barcodeBuffer, qrCodeBuffer }: TicketPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Ticket de Réservation fait sur Rovel-TicketExpress</Text>
      <View style={styles.section}>
        <Text style={styles.label}>Nom: {ticket.name}</Text>
        <Text style={styles.label}>Email: {ticket.email}</Text>
        <Text style={styles.label}>Agence: {ticket.agency}</Text>
        <Text style={styles.label}>Mode: {ticket.mode}</Text>
        <Text style={styles.label}>Trajet: {ticket.from} → {ticket.to}</Text>
        <Text style={styles.label}>Date: {ticket.date} à {ticket.departureTime}</Text>
        <Text style={styles.label}>Classe: {ticket.class}</Text>
        <Text style={styles.label}>Montant: {ticket.totalAmount} FCFA</Text>

        <Image style={styles.barcode} src={`data:image/png;base64,${barcodeBuffer}`} />
        <Image style={styles.qrcode} src={`data:image/png;base64,${qrCodeBuffer}`} />
      </View>
    </Page>
  </Document>
);
