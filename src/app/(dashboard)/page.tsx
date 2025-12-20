'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return null;
}
