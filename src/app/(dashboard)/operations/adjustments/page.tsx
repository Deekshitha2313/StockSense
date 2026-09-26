import { redirect } from 'next/navigation';

export default function AdjustmentsPage() {
  redirect('/operations?tab=adjustments');
}
