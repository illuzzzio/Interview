'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/actions/auth.action';
import { useInterview } from '@/lib/interview-context';

const LogoutButton = () => {
  const router = useRouter();
  const { stopInterview } = useInterview();

  const handleLogout = async () => {
    // Stop any active interview before logging out
    stopInterview();
    
    await signOut(); // Clear cookies/sessions
    router.push('/sign-in');
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      className="text-white border-white hover:bg-white hover:text-black transition ml-auto"
    >
      Logout
    </Button>
  );
};

export default LogoutButton;
