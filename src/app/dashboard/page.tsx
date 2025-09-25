"use client";

import { useState, useEffect, useCallback } from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSalesOrders: 0,
    activeWorkOrders: 0,
    completedWorkOrders: 0,
    totalCustomers: 0
  });
  const [recentWorkOrders, setRecentWorkOrders] = useState<WorkOrder[]>([]);
  const [productionStages, setProductionStages] = useState<ProductionStage[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch sales orders count
      const { count: salesCount } = await supabase
        .from("sales_orders")
        .select("*", { count: "exact", head: true });

      // Fetch work orders with details
      const { data: workOrders } = await supabase
        .from("work_orders")
        .select(`
          *,
          sales_orders (
            customer_id
          ),
          production_stages (*)
        `)
        .order("created_at", { ascending: false });

      // Fetch customers count
      const { count: customersCount } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });

      // Fetch production stages
      const { data: stages } = await supabase
        .from("production_stages")
        .select("*")
        .order("sequence_order");

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
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStageCounts = () => {
    return productionStages.map(stage => ({
      ...stage,
      count: recentWorkOrders.filter(wo => wo.current_stage_id === stage.stage_id).length
    }));
  };

  const stageCounts = getStageCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Production overview and key metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales Orders</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📋</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSalesOrders}</div>
              <p className="text-xs text-muted-foreground">All time orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Work Orders</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">🏭</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeWorkOrders}</div>
              <p className="text-xs text-muted-foreground">In production</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">✅</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedWorkOrders}</div>
              <p className="text-xs text-muted-foreground">Successfully delivered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">👥</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">Registered clients</p>
            </CardContent>
          </Card>
        </div>

        {/* Production Stages Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Production Stages</CardTitle>
            <CardDescription>Current status of work orders across production stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {stageCounts.map((stage) => (
                <div key={stage.stage_id} className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">{stage.count}</div>
                  <div className="text-sm font-medium">{stage.stage_name}</div>
                  <div className="text-xs text-muted-foreground">Stage {stage.sequence_order}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Work Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Work Orders</CardTitle>
              <CardDescription>Latest work orders in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>WO Number</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentWorkOrders.map((wo) => (
                    <TableRow key={wo.wo_id}>
                      <TableCell className="font-medium">{wo.wo_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {wo.production_stages?.stage_name || "Not Started"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(wo.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/sales-orders">
                <Button className="w-full justify-start">
                  📋 Create Sales Order
                </Button>
              </Link>
              <Link href="/work-orders">
                <Button variant="outline" className="w-full justify-start">
                  🏭 View Work Orders
                </Button>
              </Link>
              <Link href="/quality-control">
                <Button variant="outline" className="w-full justify-start">
                  🔍 Quality Control
                </Button>
              </Link>
              <Link href="/customers">
                <Button variant="outline" className="w-full justify-start">
                  👥 Manage Customers
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline" className="w-full justify-start">
                  📊 Generate Reports
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}