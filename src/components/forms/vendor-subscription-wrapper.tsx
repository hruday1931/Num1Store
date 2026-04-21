'use client';

import { VendorSubscriptionForm } from './vendor-subscription-form';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/contexts/toast-context';

export function VendorSubscriptionWrapper() {
  const { toasts, removeToast, success, error } = useToast();

  return (
    <>
      <VendorSubscriptionForm 
        onSuccess={success}
        onError={error}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
