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
  
  const { data: profile } = await supabase.rpc("get_public_profile", { p_id: id });
  
  if (!profile) {
    return {
      title: 'LarpSense Store | Profile Not Found',
    };
  }
  
  const displayName = profile.display_name || 'LarpSense Member';
  const spent = (profile.total_spent || 0).toFixed(2);
  const orders = profile.total_orders || 0;
  
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
