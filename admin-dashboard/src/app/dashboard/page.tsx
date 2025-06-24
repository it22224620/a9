'use client';

import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Car, 
  CreditCard, 
  Route, 
  TrendingUp, 
  Users,
  RefreshCw
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import StatsCard from '../../components/dashboard/StatsCard';
import RecentBookings from '../../components/dashboard/RecentBookings';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { dashboardAPI } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

interface DashboardStats {
  bookings: {
    total: number;
    confirmed: number;
    today: number;
  };
  payments: {
    totalRevenue: number;
    todayRevenue: number;
    totalTransactions: number;
    todayTransactions: number;
  };
  vehicles: {
    total: number;
    active: number;
  };
  routes: {
    total: number;
    active: number;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to fetch dashboard statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardStats();
    setIsRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const handleUnlockSeats = async () => {
    try {
      const response = await dashboardAPI.unlockExpiredSeats();
      if (response.success) {
        toast.success(`Unlocked ${response.data.unlockedCount} expired seats`);
        await fetchDashboardStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error unlocking seats:', error);
      toast.error('Failed to unlock expired seats');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome to your travel booking admin panel</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={handleUnlockSeats}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Unlock Expired Seats</span>
            </Button>
            <Button
              onClick={handleRefresh}
              isLoading={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Bookings"
            value={stats?.bookings.total || 0}
            icon={Calendar}
            color="blue"
          />
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(stats?.payments.totalRevenue || 0)}
            icon={CreditCard}
            color="green"
          />
          <StatsCard
            title="Active Vehicles"
            value={stats?.vehicles.active || 0}
            icon={Car}
            color="yellow"
          />
          <StatsCard
            title="Active Routes"
            value={stats?.routes.active || 0}
            icon={Route}
            color="red"
          />
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span>Today's Bookings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.bookings.today || 0}
              </div>
              <p className="text-sm text-gray-600">
                {stats?.bookings.confirmed || 0} confirmed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Today's Revenue</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.payments.todayRevenue || 0)}
              </div>
              <p className="text-sm text-gray-600">
                {stats?.payments.todayTransactions || 0} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span>System Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Vehicles</span>
                  <span className="text-sm font-medium">{stats?.vehicles.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Routes</span>
                  <span className="text-sm font-medium">{stats?.routes.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Transactions</span>
                  <span className="text-sm font-medium">{stats?.payments.totalTransactions || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <RecentBookings />
      </div>
    </Layout>
  );
}