"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

const withAdminAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const Wrapper = (props: P) => {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAdmin) {
        router.push('/auth/login'); // Redirect to login if not an admin
      }
    }, [user, isAdmin, loading, router]);

    if (loading || !isAdmin) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  Wrapper.displayName = `withAdminAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return Wrapper;
};

export default withAdminAuth;
