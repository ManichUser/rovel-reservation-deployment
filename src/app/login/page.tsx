// import AcmeLogo from '@/app/ui/acme-logo';

import LoginForm from '../lib/ui/login-form';
import { Suspense } from 'react';
 
export default function LoginPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">

          <div className="leading-tight">
            <h1 className="font-bold text-blue-950 text-lg lg:text-xl">
              Rovel
            </h1>
            <p className="text-xs text-blue-600 tracking-wide">Ticket-Express</p>
          </div>

        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}