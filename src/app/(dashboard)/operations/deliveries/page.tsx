import { redirect } from 'next/navigation';

export default function DeliveriesPage() {
  redirect('/operations?tab=deliveries');
}
