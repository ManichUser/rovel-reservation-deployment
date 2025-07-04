'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AddUserPage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      if (!editId) return;

      try {
        const res = await fetch(`/api/user?id=${editId}`);
        const user = await res.json();

        if (!res.ok) throw new Error(user.message || 'Erreur lors de la récupération');

        setFormData({
          name: user.name || '',
          email: user.email || '',
          password: '',
        });
      } catch (err) {
        console.error('Erreur récupération utilisateur :', err);
        setError('Impossible de charger les données de l’utilisateur.');
      }
    };

    fetchUser();
  }, [editId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const response = await fetch(editId ? `/api/user` : `/api/register`, {
        method: editId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || (editId ? 'Utilisateur modifié !' : 'Utilisateur ajouté !'));
        setTimeout(() => {
          router.push('/agents');
        }, 1500);
      } else {
        setError(data.message || 'Une erreur est survenue.');
      }
    } catch (err) {
      console.error(err);
      setError('Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-blue-800 text-center mb-6">
          {editId ? 'Modifier Utilisateur' : 'Ajouter un Nouvel Utilisateur'}
        </h1>

        <Link href="/agents" className="text-lg text-right text-red-800 font-bold">← Retour</Link>

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-black">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              {editId ? 'Nouveau mot de passe:' : 'Mot de passe:'}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!editId}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 text-white p-3 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {loading ? (editId ? 'Modification...' : 'Ajout...') : (editId ? 'Modifier' : 'Ajouter')}
          </button>
        </form>
      </div>
    </div>
  );
}