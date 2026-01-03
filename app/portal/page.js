import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import { getMemberById, getActiveDropsByMember } from '@/lib/airtable';
import { getSubscription } from '@/lib/stripe-helpers';
import MemberDashboardClient from '@/components/MemberDashboardClient';

export default async function PortalDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('flex_auth')?.value;

  if (!token) {
    redirect('/portal/login');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    redirect('/portal/login');
  }

  // Fetch member data
  const member = await getMemberById(payload.memberId);
  if (!member) {
    redirect('/portal/login');
  }

  // Fetch subscription from Stripe
  let subscription = null;
  if (member.fields['Stripe Subscription ID']) {
    try {
      subscription = await getSubscription(member.fields['Stripe Subscription ID']);
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    }
  }

  // Fetch active drops
  let drops = [];
  try {
    drops = await getActiveDropsByMember(member.id);
  } catch (err) {
    console.error('Failed to fetch drops:', err);
  }

  // Transform data for client component
  const memberData = {
    id: member.id,
    firstName: member.fields['First Name'],
    lastName: member.fields['Last Name'],
    email: member.fields['Email'],
    phone: member.fields['Phone Number'],
    gym: member.fields['Gym']?.[0] ? member.fields['Gym Name'] || 'Your Gym' : 'No gym set',
    plan: member.fields['Subscription Tier'] || 'None',
    status: member.fields['Status'] || 'Unknown',
    dropsRemaining: member.fields['Drops Remaining'] || 0,
    totalDrops: member.fields['Total Drops'] || 0,
  };

  const subscriptionData = subscription ? {
    status: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toLocaleDateString('en-GB'),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  } : null;

  const dropsData = drops.map(drop => ({
    id: drop.id,
    bagNumber: drop.fields['Bag Number'],
    status: drop.fields['Status'],
    dropDate: drop.fields['Drop Date'],
    expectedReady: drop.fields['Expected Ready'],
  }));

  return (
    <MemberDashboardClient 
      member={memberData}
      subscription={subscriptionData}
      drops={dropsData}
    />
  );
}
