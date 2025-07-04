import { Suspense } from 'react';
import AddUserForm from './AddUserForm';

export default function AddUserPage() {
  return (
    <Suspense fallback={<div>Chargement du formulaire...</div>}>
      <AddUserForm />
    </Suspense>
  );
}
