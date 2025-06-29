'use server';

import { signIn } from 'next-auth/react';

export async function authenticate(prevState: any, formData: FormData) {
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const redirectTo = formData.get('redirectTo')?.toString() || '/';

  if (!email || !password) {
    return 'Email et mot de passe requis';
  }

  const result = await signIn('credentials', {
    email,
    password,
    redirect: false,
    callbackUrl: redirectTo,
  });

  if (result?.error) {
    return 'Échec de la connexion : identifiants invalides';
  }

  //  Le navigateur va automatiquement rediriger si success côté client
  if (result?.ok) {
    if (typeof window !== 'undefined') {
      window.location.href = result.url || redirectTo;
    }
  }

  return undefined;
}
