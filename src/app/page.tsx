import { redirect } from 'next/navigation';

export default function Home() {
  // Temporary redirect to login or dashboard
  redirect('/login');
}
