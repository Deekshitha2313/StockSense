import { redirect } from 'next/navigation';

export default function ReceiptsPage() {
  redirect('/operations?tab=receipts');
}
