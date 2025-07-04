'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // ✅ correct import
import { deleteUser } from '../lib/action';

interface AgentActionsProps {
  AgentId: number;
  AgentName: string | undefined;
}

export function AgentActions({ AgentId, AgentName }: AgentActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter(); 

  const handleDelete = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${AgentName} ?`)) {
      setIsDeleting(true);
      const result = await deleteUser(AgentId);
      if (!result.success) {
        alert(result.error || 'Échec de la suppression!');
      }
      setIsDeleting(false);
      router.refresh(); 
    }
  };

  const handleEditClick = () => {
    router.push(`/add-user?editId=${AgentId}`);
  };

  return (
    <div className="mt-4 flex flex-wrap gap-3 justify-end">
      <button
        onClick={handleEditClick}
        className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
      >
        Modifier
      </button>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isDeleting ? 'Suppression...' : 'Supprimer'}
      </button>
    </div>
  );
}
