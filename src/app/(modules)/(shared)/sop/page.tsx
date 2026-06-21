import React from 'react';
import { Metadata } from 'next';
import { getSOPsAction, getAllSOPsAction } from '@/actions/sop.actions';
import { getUserProfileAction } from '@/actions/auth.actions';
import { SOPList } from '@/components/sop/SOPList';
import { SOPHeader } from '@/components/sop/SOPHeader';

export const metadata: Metadata = {
  title: 'SOPs | Malee House',
  description: 'Standard Operating Procedures for Malee House teams.',
};

export default async function SOPPage() {
  const profile = await getUserProfileAction();
  
  if (!profile) return null;

  const isAdmin = profile.role === 'admin';
  const response = isAdmin ? await getAllSOPsAction() : await getSOPsAction();
  const sops = response.success ? response.data : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <SOPHeader isAdmin={isAdmin} />
      <SOPList sops={sops} isAdmin={isAdmin} currentRole={profile.role} />
    </div>
  );
}
