// src/app/components/TicketForm.tsx
'use client'; // Indique que c'est un composant côté client

import React, { useState } from 'react';

export const TicketForm = () => {
  const [formData, setFormData] = useState({
    agency: '',
    mode: 'BUS',
    name: '',
    email: '',
    date: '',
    departureTime: '',
    totalAmount: 0, 
    class: 'Standard', // CORRECTION 1: Changé de 'classique' à 'Standard' pour correspondre aux options du select
    from: '',
    to: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Préparer les données, en convertissant totalAmount en nombre
      // CORRECTION 2: Gérer les cas où totalAmount est une chaîne vide ou non numérique (qui donnerait NaN)
      const dataToSend = {
        ...formData,
        totalAmount: parseFloat(String(formData.totalAmount) || '0'), // Convertit '' en '0' avant parseFloat, pour éviter NaN
      };

      // CORRECTION 3: L'appel à l'API doit être '/api/ticket' (au singulier)
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json(); // Récupérer la réponse JSON de l'API

      if (response.ok) {
        setMessage(result.message || 'Ticket enregistré et envoyé avec succès !');
        // Réinitialiser le formulaire après succès
        setFormData({
          agency: '',
          mode: 'BUS',
          name: '',
          email: '',
          date: '',
          departureTime: '',
          totalAmount: 0, // Réinitialiser à 0,
          class: 'Standard', // Réinitialiser à la valeur par défaut correcte
          from: '',
          to: '',
        });
      } else {
        // Gérer les erreurs de l'API (ex: validation Zod)
        // Amélioration de l'affichage des erreurs de validation
        let errorMessage = result.error || 'Erreur lors de l\'enregistrement du ticket.';
        if (result.errors) { // Si Zod retourne des erreurs de champs
            // Concaténer les erreurs de validation des champs pour un message plus clair
            const fieldErrors = Object.entries(result.errors)
                .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
                .join('; ');
            errorMessage += ` Détails: ${fieldErrors}`;
        } else if (result.message) { // Parfois, l'API renvoie 'message' pour les erreurs non-validation
            errorMessage = result.message;
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Erreur réseau ou inattendue:', err);
      setError('Une erreur réseau est survenue. Veuillez vérifier votre connexion ou réessayer.');
    } finally {
      setLoading(false); // Désactiver l'état de chargement
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-xl mx-auto my-8">
      <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">Enregistrer un Nouveau Ticket</h2>

      {/* Affichage des messages (succès, erreur) */}
      {message && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{message}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="agency" className="block text-sm font-medium text-gray-700">Agence:</label>
          <input
            type="text"
            id="agency"
            name="agency"
            value={formData.agency}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="mode" className="block text-sm font-medium text-gray-700">Mode:</label>
          <select
            id="mode"
            name="mode"
            value={formData.mode}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="BUS">BUS</option>
            <option value="TRAIN">TRAIN</option>
            <option value="AVION">AVION</option>
          </select>
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom du Passager:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email du Passager:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date (JJ/MM/AAAA):</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="departureTime" className="block text-sm font-medium text-gray-700">Heure de départ (HH:MM):</label>
          <input
            type="time"
            id="departureTime"
            name="departureTime"
            value={formData.departureTime}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700">Montant Total:</label>
          <input
            type="number"
            id="totalAmount"
            name="totalAmount"
            value={formData.totalAmount}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="class" className="block text-sm font-medium text-gray-700">Classe:</label>
          <select
            id="class"
            name="class"
            value={formData.class}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="Standard">Standard</option>
            <option value="VIP">VIP</option>
            <option value="Premiere">Première</option>
          </select>
        </div>
        <div>
          <label htmlFor="from" className="block text-sm font-medium text-gray-700">De (Ville/Localité):</label>
          <input
            type="text"
            id="from"
            name="from"
            value={formData.from}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="to" className="block text-sm font-medium text-gray-700">À (Ville/Localité):</label>
          <input
            type="text"
            id="to"
            name="to"
            value={formData.to}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="md:col-span-2 mt-4">
          <button
            type="submit"
            className="w-full bg-blue-700 text-white p-3 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Enregistrement en cours...' : 'Enregistrer Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};