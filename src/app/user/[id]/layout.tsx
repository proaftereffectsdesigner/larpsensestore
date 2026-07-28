import { Metadata, ResolvingMetadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

type Props = {
  params: Promise<{ id: string }>
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).single();
  
  if (!profile) {
    return {
      title: 'LarpSense Store | Profile Not Found',
    };
  }

  if (profile.is_private) {
    return {
      title: 'Private Profile',
      description: 'This user has decided to keep their profile private.',
      openGraph: {
        title: 'Private Profile',
        description: 'This user has decided to keep their profile private.',
        type: 'profile',
      },
      twitter: {
        card: 'summary',
        title: 'Private Profile',
        description: 'This user has decided to keep their profile private.',
      }
    };
  }
  
  const displayName = profile.display_name || 'LarpSense Member';
  
  // Calculate total spent manually using admin key since we're replacing the RPC
  const { data: ordersData } = await supabase.from("orders").select("total_price").eq("user_id", id).in("status", ["completed", "pending"]);
  const orders = ordersData?.length || 0;
  const spent = (ordersData?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0).toFixed(2);
  
  return {
    title: `${displayName}'s LarpSense Profile`,
    description: `🔥 Total Spent: €${spent} | 📦 Orders: ${orders}\nCheck out ${displayName}'s elite profile on LarpSense Store!`,
    openGraph: {
      title: `${displayName} - LarpSense Statistics`,
      description: `🔥 Total Spent: €${spent} | 📦 Orders: ${orders}\nCheck out ${displayName}'s elite profile on LarpSense Store!`,
      images: [profile.avatar_url || 'https://i.imgur.com/your-default-image.png'],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} - LarpSense Statistics`,
      description: `🔥 Total Spent: €${spent} | 📦 Orders: ${orders}`,
      images: [profile.avatar_url || 'https://i.imgur.com/your-default-image.png'],
    }
  };
}

export default function UserProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
