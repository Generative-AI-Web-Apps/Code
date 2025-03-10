'use client';
import { useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation'; // Changed import
import { useEffect } from 'react';

export default function IndexPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
    } else {
      router.push('/chat')
    }
  }, [isSignedIn, router]);

  return (
    <div>
        Loading...
    </div>
  );
}