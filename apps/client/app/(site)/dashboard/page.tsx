"use client";

import React, { useState, useEffect } from "react";
import { useCampaignStats } from "@/lib/hooks/use-campaigns";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Progress } from "@workspace/ui/components/progress";
import {
  Megaphone,
  Users,
  Phone,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Plus,
  ArrowUpRight,
  Activity,
  DollarSign,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";

interface DashboardMetrics {
  campaigns: {
    total: number;
    active: number;
    draft: number;
    paused: number;
    completed: number;
  };
  calls: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    avgDuration: number;
    successRate: number;
  };
  credits: {
    totalMinutes: number;
    usedMinutes: number;
    remainingMinutes: number;
    monthlyUsage: number;
  };
  performance: {
    conversionRate: number;
    avgCallCost: number;
    totalSpent: number;
    savedTime: number;
  };
}

interface RecentActivity {
  id: string;
  type: "campaign_created" | "campaign_launched" | "call_completed" | "campaign_paused";
  title: string;
  description: string;
  timestamp: string;
}

const Dashboard = () => {
  const {
    stats: campaignStats,
    loading: statsLoading,
    error: statsError,
  } = useCampaignStats();

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    campaigns: {
      total: 0,
      active: 0,
      draft: 0,
      paused: 0,
      completed: 0,
    },
    calls: {
      totalCalls: 1247,
      successfulCalls: 892,
      failedCalls: 355,
      avgDuration: 187,
      successRate: 71.5,
    },
    credits: {
      totalMinutes: 5000,
      usedMinutes: 2340,
      remainingMinutes: 2660,
      monthlyUsage: 1205,
    },
    performance: {
      conversionRate: 23.4,
      avgCallCost: 0.12,
      totalSpent: 149.64,
      savedTime: 312,
    },
  });

  // Update metrics when campaign stats are loaded
  useEffect(() => {
    if (campaignStats) {
      setMetrics(prev => ({
        ...prev,
        campaigns: campaignStats,
      }));
    }
  }, [campaignStats]);

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: "1",
      type: "campaign_launched",
      title: "Product Launch Campaign",
      description: "Successfully launched with 500 leads",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      type: "call_completed",
      title: "Customer Follow-up",
      description: "142 calls completed, 71% success rate",
      timestamp: "4 hours ago",
    },
    {
      id: "3",
      type: "campaign_created",
      title: "Survey Collection",
      description: "New campaign created and ready to launch",
      timestamp: "1 day ago",
    },
    {
      id: "4",
      type: "campaign_paused",
      title: "Promotional Outreach",
      description: "Campaign paused for script updates",
      timestamp: "2 days ago",
    },
  ]);

  const loading = statsLoading;

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "campaign_created":
        return <Plus className="w-4 h-4 text-blue-500" />;
      case "campaign_launched":
        return <Megaphone className="w-4 h-4 text-green-500" />;
      case "call_completed":
        return <Phone className="w-4 h-4 text-purple-500" />;
      case "campaign_paused":
        return <Pause className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-red-500 mb-4">
              Error loading dashboard: {statsError}
            </div>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your campaign overview.
          </p>
        </div>
        <Link href="/campaigns/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.campaigns.total}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{metrics.campaigns.active} active</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.calls.totalCalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{metrics.calls.successRate}% success rate</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.credits.usedMinutes.toLocaleString()}
            </div>
            <div className="mt-2">
              <Progress
                value={(metrics.credits.usedMinutes / metrics.credits.totalMinutes) * 100}
                className="h-2"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.credits.remainingMinutes.toLocaleString()} minutes remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.performance.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.4%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Status Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Campaign Status
              <Link href="/campaigns">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Active</span>
              </div>
              <span className="font-semibold">{metrics.campaigns.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Draft</span>
              </div>
              <span className="font-semibold">{metrics.campaigns.draft}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Pause className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Paused</span>
              </div>
              <span className="font-semibold">{metrics.campaigns.paused}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Completed</span>
              </div>
              <span className="font-semibold">{metrics.campaigns.completed}</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="p-1 bg-gray-100 rounded-full">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-500" />
              Cost Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Avg. Cost per Call</span>
              <span className="font-semibold">${metrics.performance.avgCallCost}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Spent</span>
              <span className="font-semibold">${metrics.performance.totalSpent}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Monthly Usage</span>
              <span className="font-semibold">{metrics.credits.monthlyUsage} min</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Phone className="w-5 h-5 mr-2 text-blue-500" />
              Call Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Successful Calls</span>
              <span className="font-semibold text-green-600">
                {metrics.calls.successfulCalls.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Failed Calls</span>
              <span className="font-semibold text-red-600">
                {metrics.calls.failedCalls.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Avg. Duration</span>
              <span className="font-semibold">{metrics.calls.avgDuration}s</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
              Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Time Saved</span>
              <span className="font-semibold text-green-600">
                {metrics.performance.savedTime}h
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Automation Rate</span>
              <span className="font-semibold">94%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">ROI</span>
              <span className="font-semibold text-green-600">+287%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/campaigns/create">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </Link>
            <Link href="/campaigns">
              <Button className="w-full justify-start" variant="outline">
                <Megaphone className="w-4 h-4 mr-2" />
                View Campaigns
              </Button>
            </Link>
            <Link href="/call-reports">
              <Button className="w-full justify-start" variant="outline">
                <Phone className="w-4 h-4 mr-2" />
                Call Reports
              </Button>
            </Link>
            <Link href="/settings">
              <Button className="w-full justify-start" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Account Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
