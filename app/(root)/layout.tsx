import React, { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { isAuthenticated } from '@/lib/actions/auth.action';
import { redirect } from 'next/navigation';
import  LogoutButton from "@/components/LogoutButton"// ✅ Import the new component
import { InterviewProvider } from '@/lib/interview-context';

const Rootlayout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();
  if (!isUserAuthenticated) {
    redirect("/sign-in");
  }

  return (
    <InterviewProvider>
      <div className="root-layout">
        <nav className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                className="text-primary-100 bg-black/10 hover:shadow-green-500/30 hover:scale-105 hover:-translate-y-2"
                src="/logo.svg"
                alt="Logo"
                width={38}
                height={32}
              />
              <h2 className="">EzzHire</h2>
            </Link>
            <Link 
              href="/" 
              className="px-4 py-2 text-white border border-white rounded hover:bg-white hover:text-black transition"
            >
              Home
            </Link>
          </div>

          <LogoutButton /> {/* ✅ Logout button added */}
        </nav>

        {children}
      </div>
    </InterviewProvider>
  );
};

export default Rootlayout;
