// app/login/page.tsx

import { Suspense } from 'react';
import LoginForm from '../lib/ui/login-form';

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center bg-white md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="leading-tight">
          <h1 className="font-bold text-blue-950 text-lg lg:text-xl">Rovel</h1>
          <p className="text-xs text-blue-600 tracking-wide">Ticket-Express</p>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
