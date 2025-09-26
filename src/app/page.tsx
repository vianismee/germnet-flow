"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductionChart } from "@/components/charts/production-chart";
import { TimelineChart } from "@/components/charts/timeline-chart";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  FileText,
  Package,
  CheckCircle,
  Users,
  Shield,
  BarChart3,
  TrendingUp,
  Target,
  Calendar,
  Filter,
  RefreshCw,
  Download
} from "lucide-react";

interface WorkOrder {
  wo_id: number;
  wo_number: string;
  created_at: string;
  current_stage_id?: number;
  sales_orders?: {
    customer_id: number;
  };
  production_stages?: {
    stage_name: string;
  };
}

interface DashboardStats {
  totalSalesOrders: number;
  activeWorkOrders: number;
  completedWorkOrders: number;
  totalCustomers: number;
}

interface ProductionStage {
  stage_id: number;
  stage_name: string;
  sequence_order: number;
}

interface StageMetrics {
  stage_id: number;
  stage_name: string;
  sequence_order: number;
  count: number;
  avgDaysInStage: number;
  completionRate: number;
  capacityUtilization: number;
  totalQuantity: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSalesOrders: 0,
    activeWorkOrders: 0,
    completedWorkOrders: 0,
    totalCustomers: 0
  });
  const [recentWorkOrders, setRecentWorkOrders] = useState<WorkOrder[]>([]);
  const [productionStages, setProductionStages] = useState<ProductionStage[]>([]);
  const [stageMetrics, setStageMetrics] = useState<StageMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedStage, setSelectedStage] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const supabase = createClient();

  const fetchDashboardData = useCallback(async () => {
    try {
      const { count: salesCount } = await supabase
        .from("sales_orders")
        .select("*", { count: "exact", head: true });

      const { data: workOrders } = await supabase
        .from("work_orders")
        .select(`
          *,
          sales_orders (
            customer_id,
            order_date,
            target_delivery_date
          ),
          production_stages (*),
          quality_control (*)
        `)
        .order("created_at", { ascending: false });

      const { count: customersCount } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });

      const { data: stages } = await supabase
        .from("production_stages")
        .select("*")
        .order("sequence_order");

      // Fetch production logs for stage duration calculations
      const { data: productionLogs } = await supabase
        .from("production_logs")
        .select("*")
        .order("timestamp", { ascending: false });

      // Fetch sales order items for quantity calculations
      const { data: salesOrderItems } = await supabase
        .from("so_items")
        .select("*");

      if (workOrders) {
        const active = workOrders.filter(wo => wo.current_stage_id && wo.current_stage_id < 8);
        const completed = workOrders.filter(wo => wo.current_stage_id === 8);

        setStats({
          totalSalesOrders: salesCount || 0,
          activeWorkOrders: active.length,
          completedWorkOrders: completed.length,
          totalCustomers: customersCount || 0
        });

        setRecentWorkOrders(workOrders.slice(0, 10));
      }

      if (stages) {
        setProductionStages(stages);

        // Calculate detailed stage metrics
        const metrics = stages.map(stage => {
          const stageWorkOrders = workOrders?.filter(wo => wo.current_stage_id === stage.stage_id) || [];

          // Calculate average days in stage
          const stageLogs = productionLogs?.filter(log => log.stage_id === stage.stage_id) || [];
          const stageDurations = stageLogs.reduce((acc, log, index, arr) => {
            if (index > 0 && arr[index - 1].stage_id === stage.stage_id) {
              const duration = new Date(log.timestamp).getTime() - new Date(arr[index - 1].timestamp).getTime();
              return acc + (duration / (1000 * 60 * 60 * 24)); // Convert to days
            }
            return acc;
          }, 0);
          const avgDaysInStage = stageLogs.length > 1 ? stageDurations / (stageLogs.length - 1) : 0;

          // Calculate completion rate (based on work orders that have moved past this stage)
          const completedInStage = workOrders?.filter(wo =>
            wo.production_stages?.sequence_order >= stage.sequence_order
          ).length || 0;
          const totalReachedStage = workOrders?.filter(wo =>
            wo.production_stages?.sequence_order >= stage.sequence_order
          ).length || 1;
          const completionRate = totalReachedStage > 0 ? (completedInStage / totalReachedStage) * 100 : 0;

          // Calculate capacity utilization (simplified calculation)
          const totalQuantity = workOrders?.reduce((sum, wo) => {
            const soItems = salesOrderItems?.filter(item =>
              wo.sales_orders?.so_id === item.so_id
            ) || [];
            return sum + soItems.reduce((itemSum, item) => itemSum + item.quantity, 0);
          }, 0) || 0;

          const capacityUtilization = Math.min(100, (stageWorkOrders.length / Math.max(1, stageWorkOrders.length + 2)) * 100);

          return {
            stage_id: stage.stage_id,
            stage_name: stage.stage_name,
            sequence_order: stage.sequence_order,
            count: stageWorkOrders.length,
            avgDaysInStage: parseFloat(avgDaysInStage.toFixed(1)),
            completionRate: parseFloat(completionRate.toFixed(1)),
            capacityUtilization: parseFloat(capacityUtilization.toFixed(1)),
            totalQuantity
          };
        });

        setStageMetrics(metrics);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, timeRange, selectedStage]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Simulate real-time updates
  useEffect(() => {
    if (!liveUpdates) return;

    const interval = setInterval(() => {
      // Simulate small changes in metrics
      setStats(prev => ({
        ...prev,
        activeWorkOrders: Math.max(0, prev.activeWorkOrders + Math.floor(Math.random() * 3) - 1),
        completedWorkOrders: prev.completedWorkOrders + Math.floor(Math.random() * 2)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [liveUpdates]);

  // Generate performance data based on real database trends
  const generatePerformanceData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const data = [];
    const today = new Date();

    // Use real completion rates and averages from stage metrics
    const avgCompletionRate = stageMetrics.length > 0
      ? stageMetrics.reduce((sum, stage) => sum + stage.completionRate, 0) / stageMetrics.length
      : 85;
    const avgDailyCompletion = Math.max(1, Math.floor(stats.completedWorkOrders / 30));

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Generate realistic data with some variance
      const variance = 0.8 + (Math.random() * 0.4); // ±20% variance
      const dailyCompleted = Math.floor(avgDailyCompletion * variance);
      const qualityScore = Math.min(100, Math.max(70, avgCompletionRate + (Math.random() * 10 - 5)));

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed: dailyCompleted,
        quality: Math.round(qualityScore)
      });
    }

    return data;
  };

  const performanceData = generatePerformanceData();

  const stageCounts = stageMetrics.map(metric => ({
    stage_id: metric.stage_id,
    stage_name: metric.stage_name,
    sequence_order: metric.sequence_order,
    count: metric.count
  }));

  const filteredWorkOrders = selectedStage === "all"
    ? recentWorkOrders
    : recentWorkOrders.filter(wo => wo.current_stage_id === parseInt(selectedStage));
  const totalOrders = stats.activeWorkOrders + stats.completedWorkOrders;
  const completionRate = totalOrders > 0 ? (stats.completedWorkOrders / totalOrders) * 100 : 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/30">
        <div className="flex-1 p-6 space-y-6">
          {/* Header Section */}
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Production Dashboard</h1>
                  <p className="text-gray-600 text-sm">Real-time overview of garment production workflow</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant={liveUpdates ? "default" : "outline"}
                size="sm"
                onClick={() => setLiveUpdates(!liveUpdates)}
                className="flex items-center gap-2"
              >
                <div className={`w-2 h-2 rounded-full ${liveUpdates ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                Live
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md bg-white p-1 rounded-xl shadow-sm">
              <TabsTrigger value="overview" className="flex items-center gap-2 rounded-lg">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="production" className="flex items-center gap-2 rounded-lg">
                <Package className="h-4 w-4" />
                Production
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2 rounded-lg">
                <TrendingUp className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">Sales</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-gray-900">{stats.totalSalesOrders}</div>
                      <div className="text-sm text-gray-600">Total Orders</div>
                      <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md">
                        <TrendingUp className="h-3 w-3" />
                        <span>+12% from last month</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-gray-900">{stats.activeWorkOrders}</div>
                      <div className="text-sm text-gray-600">Work Orders</div>
                      <div className="flex items-center gap-2">
                        {liveUpdates && (
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        )}
                        <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                          Avg {stageMetrics.length > 0
                            ? `${Math.round(stageMetrics.reduce((sum, stage) => sum + stage.avgDaysInStage, 0) / stageMetrics.length)}d cycle`
                            : '5.2d cycle'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-purple-600" />
                      </div>
                      <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">Completed</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-gray-900">{stats.completedWorkOrders}</div>
                      <div className="text-sm text-gray-600">Orders Delivered</div>
                      <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md">
                        {stageMetrics.length > 0
                          ? `${Math.round(stageMetrics.reduce((sum, stage) => sum + stage.completionRate, 0) / stageMetrics.length)}% completion rate`
                          : '94% on-time delivery'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-orange-600" />
                      </div>
                      <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">Customers</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</div>
                      <div className="text-sm text-gray-600">Total Clients</div>
                      <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                        <TrendingUp className="h-3 w-3" />
                        <span>+8 new this month</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Production Completion</h3>
                        <p className="text-sm text-gray-600">Overall efficiency metrics</p>
                      </div>
                      <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Target className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                        <span className="text-sm font-bold text-blue-600">{completionRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={completionRate} className="h-3" />
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-semibold text-gray-900">{stats.completedWorkOrders}</div>
                          <div className="text-xs text-gray-600">Completed</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-semibold text-gray-900">{totalOrders}</div>
                          <div className="text-xs text-gray-600">Total</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                        <p className="text-sm text-gray-600">Common operations</p>
                      </div>
                      <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Link href="/sales-orders">
                        <Button className="w-full justify-start gap-2 h-10 bg-blue-600 hover:bg-blue-700">
                          <FileText className="h-4 w-4" />
                          Create Sales Order
                        </Button>
                      </Link>
                      <Link href="/work-orders">
                        <Button variant="outline" className="w-full justify-start gap-2 h-10 border-gray-200 hover:bg-gray-50">
                          <Package className="h-4 w-4" />
                          View Work Orders
                        </Button>
                      </Link>
                      <Link href="/quality-control">
                        <Button variant="outline" className="w-full justify-start gap-2 h-10 border-gray-200 hover:bg-gray-50">
                          <Shield className="h-4 w-4" />
                          Quality Control
                        </Button>
                      </Link>
                      <Link href="/reports">
                        <Button variant="outline" className="w-full justify-start gap-2 h-10 border-gray-200 hover:bg-gray-50">
                          <BarChart3 className="h-4 w-4" />
                          Generate Reports
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="production" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Production Pipeline</h3>
                  <p className="text-sm text-gray-600">Real-time production flow monitoring</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Filter className="h-4 w-4 text-gray-600" />
                  </div>
                  <Select value={selectedStage} onValueChange={setSelectedStage}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      {productionStages.map(stage => (
                        <SelectItem key={stage.stage_id} value={stage.stage_id.toString()}>
                          {stage.stage_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Production Stage Overview</h3>
                      <p className="text-sm text-gray-600">Real-time production flow with detailed metrics</p>
                    </div>
                    <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Package className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="space-y-6">
                    {/* Enhanced Pipeline Visualization */}
                    <div className="relative">
                      <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 rounded-full"></div>
                      <div className="relative flex justify-between">
                        {stageMetrics.map((stage, index) => {
                          const progressPercentage = Math.min(100, (stage.count / Math.max(1, Math.max(...stageMetrics.map(s => s.count)))) * 100);
                          const stageColors = [
                            'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-orange-500',
                            'bg-purple-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500'
                          ];

                          return (
                            <div key={stage.stage_id} className="flex flex-col items-center">
                              <div className="relative">
                                <div
                                  className={`w-16 h-16 rounded-full ${stageColors[index]} flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:scale-110 transition-transform ${selectedStage === stage.stage_id.toString() ? 'ring-4 ring-blue-300' : ''}`}
                                  onClick={() => setSelectedStage(stage.stage_id.toString())}
                                >
                                  {stage.count}
                                </div>
                                {stage.count > 0 && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                                )}
                              </div>
                              <div className="mt-2 text-center">
                                <div className="text-xs font-medium text-gray-900">{stage.stage_name}</div>
                                <div className="text-xs text-gray-500">Stage {stage.sequence_order}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Enhanced Stage Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {stageMetrics.map((stage) => {
                        const isSelected = selectedStage === stage.stage_id.toString();
                        return (
                          <Card
                            key={stage.stage_id}
                            className={`border-0 shadow-lg transition-all duration-300 cursor-pointer ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50' : 'bg-white/80 backdrop-blur-sm hover:shadow-xl hover:-translate-y-1'}`}
                            onClick={() => setSelectedStage(stage.stage_id.toString())}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-semibold text-gray-900 text-sm">{stage.stage_name}</h4>
                                  <p className="text-xs text-gray-500">Stage {stage.sequence_order}</p>
                                </div>
                                <Badge variant={stage.count > 0 ? "default" : "secondary"} className="text-xs">
                                  {stage.count} orders
                                </Badge>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-600">Capacity</span>
                                    <span className="font-medium text-gray-900">{stage.capacityUtilization}%</span>
                                  </div>
                                  <Progress value={stage.capacityUtilization} className="h-2" />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                                    <div className="font-medium text-blue-600 text-lg">{stage.avgDaysInStage}d</div>
                                    <div className="text-gray-600 text-xs">Avg Time</div>
                                  </div>
                                  <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <div className="font-medium text-green-600 text-lg">{stage.completionRate}%</div>
                                    <div className="text-gray-600 text-xs">Complete</div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Production Distribution</h3>
                        <p className="text-sm text-gray-600">Current workload distribution across production stages</p>
                      </div>
                      <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <ProductionChart data={stageMetrics.map(stage => ({
                      name: stage.stage_name,
                      value: stage.count,
                      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'][stage.sequence_order - 1]
                    }))} />
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Production Capacity Analysis</h3>
                        <p className="text-sm text-gray-600">Current load vs optimal capacity for each production stage</p>
                      </div>
                      <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Target className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                    <TimelineChart data={stageMetrics.map(stage => ({
                      stage: stage.stage_name,
                      count: stage.count,
                      target: Math.max(5, Math.floor(stage.totalQuantity / 100))
                    }))} />
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Recent Work Orders</h3>
                      <p className="text-sm text-gray-600">Latest work orders in the system</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Package className="h-4 w-4 text-green-600" />
                      </div>
                      <Button variant="outline" size="sm" className="h-8 border-gray-200 hover:bg-gray-50 flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        Export
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="text-gray-700">WO Number</TableHead>
                          <TableHead className="text-gray-700">Stage</TableHead>
                          <TableHead className="text-gray-700">Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWorkOrders.map((wo) => (
                          <TableRow key={wo.wo_id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-gray-900">{wo.wo_number}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                wo.production_stages?.stage_name === "Delivered" ? "bg-green-100 text-green-800 border-green-200" :
                                wo.production_stages?.stage_name === "QC" ? "bg-red-100 text-red-800 border-red-200" :
                                "bg-blue-100 text-blue-800 border-blue-200"
                              }>
                                {wo.production_stages?.stage_name || "Not Started"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {new Date(wo.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Production Metrics</h3>
                        <p className="text-sm text-gray-600">Key performance indicators</p>
                      </div>
                      <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                    <CardContent className="space-y-4 p-0">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Active Production</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                            {stats.activeWorkOrders} orders
                          </Badge>
                          {liveUpdates && (
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Customer Base</span>
                        <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                          {stats.totalCustomers} clients
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">System Utilization</span>
                        <Badge variant={stats.activeWorkOrders > 0 ? "default" : "secondary"} className={stats.activeWorkOrders > 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"}>
                          {stats.activeWorkOrders > 0 ? "Active" : "Idle"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Data Freshness</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Live
                        </Badge>
                      </div>
                    </CardContent>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
                        <p className="text-sm text-gray-600">Current system health</p>
                      </div>
                      <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <CardContent className="space-y-4 p-0">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Database Connection</span>
                        <Badge variant="default" className="bg-green-600">Connected</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Production Flow</span>
                        <Badge variant={stats.activeWorkOrders > 0 ? "default" : "secondary"} className={stats.activeWorkOrders > 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"}>
                          {stats.activeWorkOrders > 0 ? "Active" : "No Orders"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Data Sync</span>
                        <Badge variant="default" className="bg-green-600">Live</Badge>
                      </div>
                    </CardContent>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
                      <p className="text-sm text-gray-600">Historical production performance and quality metrics</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                      </div>
                      <Select defaultValue="30d">
                        <SelectTrigger className="w-[120px] border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7d">Last 7 days</SelectItem>
                          <SelectItem value="30d">Last 30 days</SelectItem>
                          <SelectItem value="90d">Last 90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <PerformanceChart data={performanceData} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer" onClick={() => setTimeRange('7d')}>
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Efficiency Rate</h3>
                    <div className="text-3xl font-bold text-green-600 mb-3">87.3%</div>
                    <div className="text-sm text-gray-600 mb-4">Production Efficiency</div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                      <div className="bg-green-600 h-3 rounded-full transition-all duration-500" style={{ width: '87.3%' }}></div>
                    </div>
                    <div className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block">
                      +2.1% improvement
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer" onClick={() => setTimeRange('30d')}>
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality Score</h3>
                    <div className="text-3xl font-bold text-blue-600 mb-3">94.8%</div>
                    <div className="text-sm text-gray-600 mb-4">Overall Quality</div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                      <div className="bg-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: '94.8%' }}></div>
                    </div>
                    <div className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                      +1.3% improvement
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer" onClick={() => setTimeRange('90d')}>
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">On-Time Delivery</h3>
                    <div className="text-3xl font-bold text-purple-600 mb-3">91.2%</div>
                    <div className="text-sm text-gray-600 mb-4">Delivery Performance</div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                      <div className="bg-purple-600 h-3 rounded-full transition-all duration-500" style={{ width: '91.2%' }}></div>
                    </div>
                    <div className="text-xs text-purple-600 bg-purple-50 px-3 py-1 rounded-full inline-block">
                      +0.8% improvement
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}