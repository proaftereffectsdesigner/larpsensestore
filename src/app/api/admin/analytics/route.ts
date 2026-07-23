import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    
    let points = 30;
    let customStartDate = new Date();
    
    if (daysParam === 'custom' && fromParam && toParam) {
      const from = new Date(fromParam);
      const to = new Date(toParam);
      const diffTime = Math.abs(to.getTime() - from.getTime());
      points = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      customStartDate = to;
    } else if (daysParam === 'all') {
      points = 365;
    } else if (daysParam) {
      points = parseInt(daysParam, 10);
    }

    // Simulated Advanced Metrics
    let simulatedData: any[] = [];
    let simulatedRevenueData: any[] = [];
    
    let basePageviews = 200;
    let baseUniques = 120;

    for (let i = points - 1; i >= 0; i--) {
      const d = new Date(customStartDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Add some randomness
      const dailyViews = Math.floor(basePageviews + (Math.random() * 100 - 30));
      const dailyUniques = Math.floor(baseUniques + (Math.random() * 50 - 15));
      const dailyOrders = Math.floor(Math.random() * 15) + 2;
      const dailyRevenue = dailyOrders * (Math.random() * 20 + 30);
      
      // Trend slightly upwards over time
      basePageviews += 2;
      baseUniques += 1;

      simulatedData.push({
        date: dateStr,
        pageviews: dailyViews,
        uniques: dailyUniques
      });
      
      simulatedRevenueData.push({
        date: dateStr,
        orders: dailyOrders,
        revenue: parseFloat(dailyRevenue.toFixed(2))
      });
    }

    if (daysParam === 'all') {
      // Aggregate into monthly data for "All Time"
      const monthlyTraffic: Record<string, any> = {};
      const monthlyRevenue: Record<string, any> = {};
      
      simulatedData.forEach(d => {
        const month = d.date.substring(0, 7); // YYYY-MM
        if (!monthlyTraffic[month]) monthlyTraffic[month] = { date: month, pageviews: 0, uniques: 0 };
        monthlyTraffic[month].pageviews += d.pageviews;
        monthlyTraffic[month].uniques += d.uniques;
      });
      
      simulatedRevenueData.forEach(d => {
        const month = d.date.substring(0, 7);
        if (!monthlyRevenue[month]) monthlyRevenue[month] = { date: month, orders: 0, revenue: 0 };
        monthlyRevenue[month].orders += d.orders;
        monthlyRevenue[month].revenue += d.revenue;
      });
      
      simulatedData = Object.values(monthlyTraffic);
      simulatedRevenueData = Object.values(monthlyRevenue);
    }

    let dynamicTotalRevenue = 0;
    let dynamicTotalOrders = 0;
    simulatedRevenueData.forEach(d => {
      dynamicTotalRevenue += d.revenue;
      dynamicTotalOrders += d.orders;
    });

    const responseData = {
      success: true,
      summary: {
        totalRevenue: parseFloat(dynamicTotalRevenue.toFixed(2)),
        totalOrders: dynamicTotalOrders,
        averageOrderValue: dynamicTotalOrders > 0 ? dynamicTotalRevenue / dynamicTotalOrders : 0,
      },
      advanced: {
        kpi: {
          uniqueUsers: { value: Math.floor(baseUniques * points * 0.7), trend: '+12.5%' },
          sessions: { value: Math.floor(basePageviews * points * 0.6), trend: '+8.2%' },
          avgTime: { value: '2m 45s', trend: '+1.5%' },
          bounceRate: { value: '42.3%', trend: '-4.1%' }, // Negative bounce rate is good
          realtime: Math.floor(Math.random() * 15) + 3 // 3 to 17 users right now
        },
        trafficChart: simulatedData,
        revenueChart: simulatedRevenueData,
        devices: [
          { name: 'Mobile', value: 65, fill: '#3b82f6' },
          { name: 'Desktop', value: 30, fill: '#10b981' },
          { name: 'Tablet', value: 5, fill: '#8b5cf6' }
        ],
        topPages: [
          { path: '/', views: Math.floor(basePageviews * 15) },
          { path: '/product/nfa-tool', views: Math.floor(basePageviews * 8) },
          { path: '/checkout', views: Math.floor(basePageviews * 4) },
          { path: '/dashboard', views: Math.floor(basePageviews * 3) },
          { path: '/terms', views: Math.floor(basePageviews * 0.5) }
        ],
        vitals: {
          fcp: { value: '0.8s', status: 'good' }, // green
          lcp: { value: '1.2s', status: 'good' }, // green
          cls: { value: '0.04', status: 'warning' }, // yellow
        },
        ecommerce: {
          conversionRate: { value: '3.4%', trend: '+0.5%' },
          newOrdersToday: { value: Math.floor(Math.random() * 20) + 5, trend: '+12%' }
        },
        tokenGuard: {
          apiRateLimit: '450/500',
          auths24h: 1245,
          decryptionErrors: 12
        },
        topCountries: [
          { name: 'Poland', code: '🇵🇱', percent: 45 },
          { name: 'Germany', code: '🇩🇪', percent: 20 },
          { name: 'United States', code: '🇺🇸', percent: 15 },
          { name: 'United Kingdom', code: '🇬🇧', percent: 10 },
          { name: 'France', code: '🇫🇷', percent: 10 }
        ],
        recentActivity: [
          { message: 'User r1k bought NFA Tool License', time: '2 mins ago', type: 'purchase' },
          { message: 'New account registered: user@test.com', time: '15 mins ago', type: 'user' },
          { message: 'User admin@larpsense.com topped up €50.00', time: '1 hour ago', type: 'topup' },
          { message: 'Failed login attempt (IP: 192.168.1.1)', time: '2 hours ago', type: 'security' },
          { message: 'User pablo22 bought VIP Package', time: '5 hours ago', type: 'purchase' }
        ],
        logs: [
          { type: 'error', time: '2 mins ago', message: 'TypeError: Cannot read properties of undefined (reading "avatar") in /dashboard' },
          { type: '404', time: '15 mins ago', message: 'GET /assets/old-logo.png - Not Found' },
          { type: 'warning', time: '1 hour ago', message: 'Slow API response on /api/checkout (1450ms)' },
          { type: '404', time: '3 hours ago', message: 'GET /admin/hidden-page - Not Found' },
          { type: 'error', time: '5 hours ago', message: 'Stripe webhook delivery failed (timeout)' }
        ]
      }
    };

    return NextResponse.json(responseData);

  } catch (err: any) {
    console.error('Analytics error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
