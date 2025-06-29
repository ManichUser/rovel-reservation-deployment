import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Ticket } from '@/app/data/ tickets';

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#1f2937', // text-gray-800
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  leftColumn: {
    flex: 3,
    paddingRight: 12,
  },
  rightColumn: {
    flex: 2,
    borderLeft: '1pt dashed #ccc',
    paddingLeft: 12,
  },
  header: {
    backgroundColor: '#1d4ed8',
    color: 'white',
    padding: 6,
    fontSize: 14,
    fontWeight: 'bold',
    borderRadius: 4,
    textAlign: 'left',
    marginBottom: 12,
  },
  label: {
    fontSize: 10,
    color: '#6b7280', // text-gray-500
  },
  value: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  locationBox: {
    backgroundColor: '#1d4ed8',
    color: 'white',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  qrcode: {
    width: 80,
    height: 80,
    marginVertical: 6,
    alignSelf: 'center',
  },
  barcode: {
    width: 120,
    height: 40,
    alignSelf: 'center',
    marginVertical: 8,
  },
  rightTitle: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
});

type TicketPDFProps = {
  ticket: Ticket;
  barcodeBuffer: string;
  qrCodeBuffer: string;
};

export const TicketPDF = ({ ticket, barcodeBuffer, qrCodeBuffer }: TicketPDFProps) => (
  <Document>
    <Page size="A5" style={styles.page}>
      {/* Colonne Gauche */}
      <View style={styles.leftColumn}>
        <Text style={styles.header}>ROVEL TICKET</Text>
        <Text style={styles.label}>AGENCE CHOISIE: <Text style={styles.value}>{ticket.agency}</Text></Text>
        <Text style={styles.label}>Nom/Nom:</Text>
        <Text style={styles.value}>{ticket.name}</Text>

        <Text style={styles.label}>Date:</Text>
        <Text style={styles.value}>{ticket.date}</Text>

        <Text style={styles.label}>Heure de départ:</Text>
        <Text style={styles.value}>{ticket.departureTime}</Text>

        <Text style={styles.label}>Mode:</Text>
        <Text style={styles.value}>{ticket.mode}</Text>

        <Text style={styles.label}>Classe/Class:</Text>
        <Text style={styles.value}>{ticket.class}</Text>

        <Text style={styles.label}>Montant total:</Text>
        <Text style={styles.value}>
          {typeof ticket.totalAmount === 'number'
          ? ticket.totalAmount.toFixed(2)
          : parseFloat(ticket.totalAmount || '0').toFixed(2)
        } FCFA
        </Text>

        <View style={styles.locationBox}>
          <Text>From:</Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{ticket.from}</Text>
          <Image style={styles.qrcode} src={`data:image/png;base64,${qrCodeBuffer}`} />
          <Text>To:</Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{ticket.to}</Text>
        </View>
      </View>

      {/* Colonne Droite */}
      <View style={styles.rightColumn}>
        <Text style={styles.rightTitle}>CLASS: {ticket.class}</Text>
        <Image style={styles.barcode}
        
        src={`data:image/png;base64,${barcodeBuffer}`} />

        <Text style={styles.label}>Mode:</Text>
        <Text style={styles.value}>{ticket.mode}</Text>

        <Text style={styles.label}>Nom/Nom:</Text>
        <Text style={styles.value}>{ticket.name}</Text>

        <Text style={styles.label}>Date:</Text>
        <Text style={styles.value}>{ticket.date}</Text>

        <Text style={styles.label}>Montant:</Text>
        <Text style={styles.value}>
          {typeof ticket.totalAmount === 'number'
          ? ticket.totalAmount.toFixed(2)
          : parseFloat(ticket.totalAmount || '0').toFixed(2)
        } FCFA
        </Text>


        <Text style={styles.label}>Time/Heure:</Text>
        <Text style={styles.value}>{ticket.departureTime}</Text>

        <Text style={styles.label}>From:</Text>
        <Text style={styles.value}>{ticket.from}</Text>

        <Image style={styles.qrcode} src={`data:image/png;base64,${qrCodeBuffer}`} />

        <Text style={styles.label}>To:</Text>
        <Text style={styles.value}>{ticket.to}</Text>
      </View>
    </Page>
  </Document>
);
