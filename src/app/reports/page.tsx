"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, RefreshCw, Download, TrendingUp, Shield, Truck, Clock, CheckCircle, AlertTriangle } from "lucide-react";

interface ProductionCycleTime {
  wo_id: number;
  wo_number: string;
  customer_name: string;
  start_date: string;
  end_date: string;
  cycle_time_days: number;
}

interface QualityPerformance {
  total_inspected: number;
  total_passed: number;
  total_repaired: number;
  total_rejected: number;
  pass_rate: number;
  repair_rate: number;
  rejection_rate: number;
}

interface DeliveryPerformance {
  total_orders: number;
  on_time_deliveries: number;
  delayed_deliveries: number;
  on_time_rate: number;
}

export default function ReportsPage() {
  const [productionCycleTimes, setProductionCycleTimes] = useState<ProductionCycleTime[]>([]);
  const [qualityPerformance, setQualityPerformance] = useState<QualityPerformance | null>(null);
  const [deliveryPerformance, setDeliveryPerformance] = useState<DeliveryPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchReports = useCallback(async () => {
    try {
      // Fetch production cycle time data
      const { data: workOrders } = await supabase
        .from("work_orders")
        .select(`
          wo_id,
          wo_number,
          production_start_date,
          production_end_date,
          sales_orders (
            customers (
              customer_name
            )
          )
        `)
        .not("production_start_date", "is", null)
        .not("production_end_date", "is", null);

      if (workOrders) {
        const cycleTimes = workOrders.map(wo => ({
          wo_id: wo.wo_id,
          wo_number: wo.wo_number,
          customer_name: ((wo.sales_orders as Array<{customers: Array<{customer_name: string}>}> | undefined)?.[0]?.customers?.[0]?.customer_name) || "N/A",
          start_date: wo.production_start_date,
          end_date: wo.production_end_date,
          cycle_time_days: Math.ceil(
            (new Date(wo.production_end_date).getTime() - new Date(wo.production_start_date).getTime()) /
            (1000 * 60 * 60 * 24)
          )
        }));
        setProductionCycleTimes(cycleTimes);
      }

      // Fetch quality performance data
      const { data: qcData } = await supabase
        .from("quality_control")
        .select("quantity_passed, quantity_repaired, quantity_rejected");

      if (qcData) {
        const total_inspected = qcData.reduce((sum, qc) =>
          sum + qc.quantity_passed + qc.quantity_repaired + qc.quantity_rejected, 0);
        const total_passed = qcData.reduce((sum, qc) => sum + qc.quantity_passed, 0);
        const total_repaired = qcData.reduce((sum, qc) => sum + qc.quantity_repaired, 0);
        const total_rejected = qcData.reduce((sum, qc) => sum + qc.quantity_rejected, 0);

        setQualityPerformance({
          total_inspected,
          total_passed,
          total_repaired,
          total_rejected,
          pass_rate: total_inspected > 0 ? (total_passed / total_inspected) * 100 : 0,
          repair_rate: total_inspected > 0 ? (total_repaired / total_inspected) * 100 : 0,
          rejection_rate: total_inspected > 0 ? (total_rejected / total_inspected) * 100 : 0
        });
      }

      // Fetch delivery performance data
      const { data: deliveryData } = await supabase
        .from("sales_orders")
        .select("target_delivery_date, work_orders!left(production_end_date)");

      if (deliveryData) {
        const total_orders = deliveryData.length;
        let on_time_deliveries = 0;
        let delayed_deliveries = 0;

        deliveryData.forEach(order => {
          if ((order.work_orders as Array<{production_end_date: string}> | undefined)?.[0]?.production_end_date) {
            const actualDate = new Date((order.work_orders as Array<{production_end_date: string}>)[0].production_end_date);
            const targetDate = new Date(order.target_delivery_date);
            if (actualDate <= targetDate) {
              on_time_deliveries++;
            } else {
              delayed_deliveries++;
            }
          }
        });

        setDeliveryPerformance({
          total_orders,
          on_time_deliveries,
          delayed_deliveries,
          on_time_rate: total_orders > 0 ? (on_time_deliveries / total_orders) * 100 : 0
        });
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(header => row[header]).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportProductionCycleReport = () => {
    exportToCSV(productionCycleTimes as unknown as Record<string, unknown>[], "production_cycle_time_report.csv");
  };

  const exportQualityReport = () => {
    const qualityData = [
      {
        metric: "Total Inspected",
        value: qualityPerformance?.total_inspected || 0
      },
      {
        metric: "Total Passed",
        value: qualityPerformance?.total_passed || 0
      },
      {
        metric: "Total Repaired",
        value: qualityPerformance?.total_repaired || 0
      },
      {
        metric: "Total Rejected",
        value: qualityPerformance?.total_rejected || 0
      },
      {
        metric: "Pass Rate (%)",
        value: qualityPerformance?.pass_rate.toFixed(2) || 0
      },
      {
        metric: "Repair Rate (%)",
        value: qualityPerformance?.repair_rate.toFixed(2) || 0
      },
      {
        metric: "Rejection Rate (%)",
        value: qualityPerformance?.rejection_rate.toFixed(2) || 0
      }
    ];
    exportToCSV(qualityData as unknown as Record<string, unknown>[], "quality_performance_report.csv");
  };

  const exportDeliveryReport = () => {
    const deliveryData = [
      {
        metric: "Total Orders",
        value: deliveryPerformance?.total_orders || 0
      },
      {
        metric: "On-Time Deliveries",
        value: deliveryPerformance?.on_time_deliveries || 0
      },
      {
        metric: "Delayed Deliveries",
        value: deliveryPerformance?.delayed_deliveries || 0
      },
      {
        metric: "On-Time Rate (%)",
        value: deliveryPerformance?.on_time_rate.toFixed(2) || 0
      }
    ];
    exportToCSV(deliveryData as unknown as Record<string, unknown>[], "delivery_performance_report.csv");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reports...</p>
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
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                  <p className="text-gray-600 text-sm">Generate production performance reports</p>
                </div>
              </div>
            </div>
            <Button onClick={fetchReports} className="h-10 bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Reports
            </Button>
          </div>
        {/* Production Cycle Time Report */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Production Cycle Time Report</h3>
                <p className="text-sm text-gray-600">Analysis of production completion times</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <Button onClick={exportProductionCycleReport} size="sm" className="h-8 border-gray-200 hover:bg-gray-50 flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-0 shadow-sm bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Average Cycle Time</h4>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {productionCycleTimes.length > 0
                      ? `${(productionCycleTimes.reduce((sum, ct) => sum + ct.cycle_time_days, 0) / productionCycleTimes.length).toFixed(1)} days`
                      : "N/A"}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Fastest Completion</h4>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {productionCycleTimes.length > 0
                      ? `${Math.min(...productionCycleTimes.map(ct => ct.cycle_time_days))} days`
                      : "N/A"}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Slowest Completion</h4>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {productionCycleTimes.length > 0
                      ? `${Math.max(...productionCycleTimes.map(ct => ct.cycle_time_days))} days`
                      : "N/A"}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-gray-700">WO Number</TableHead>
                    <TableHead className="text-gray-700">Customer</TableHead>
                    <TableHead className="text-gray-700">Start Date</TableHead>
                    <TableHead className="text-gray-700">End Date</TableHead>
                    <TableHead className="text-gray-700">Cycle Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productionCycleTimes.map((cycle) => (
                    <TableRow key={cycle.wo_id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">{cycle.wo_number}</TableCell>
                      <TableCell className="text-gray-700">{cycle.customer_name}</TableCell>
                      <TableCell className="text-gray-700">{new Date(cycle.start_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-gray-700">{new Date(cycle.end_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          cycle.cycle_time_days <= 7 ? "default" :
                          cycle.cycle_time_days <= 14 ? "secondary" : "destructive"
                        } className={
                          cycle.cycle_time_days <= 7 ? "bg-green-100 text-green-800 border-green-200" :
                          cycle.cycle_time_days <= 14 ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                          "bg-red-100 text-red-800 border-red-200"
                        }>
                          {cycle.cycle_time_days} days
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Quality Performance Report */}
        {qualityPerformance && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Quality Performance Report</h3>
                  <p className="text-sm text-gray-600">Quality control metrics and analysis</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-4 w-4 text-green-600" />
                  </div>
                  <Button onClick={exportQualityReport} size="sm" className="h-8 border-gray-200 hover:bg-gray-50 flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    Export CSV
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-0 shadow-sm bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Pass Rate</h4>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {qualityPerformance.pass_rate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {qualityPerformance.total_passed} / {qualityPerformance.total_inspected} units
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Repair Rate</h4>
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {qualityPerformance.repair_rate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {qualityPerformance.total_repaired} units
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Rejection Rate</h4>
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {qualityPerformance.rejection_rate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {qualityPerformance.total_rejected} units
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Total Inspected</h4>
                      <Shield className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {qualityPerformance.total_inspected}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">units</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Performance Report */}
        {deliveryPerformance && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">On-Time Delivery Report</h3>
                  <p className="text-sm text-gray-600">Delivery performance and timeliness analysis</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Truck className="h-4 w-4 text-purple-600" />
                  </div>
                  <Button onClick={exportDeliveryReport} size="sm" className="h-8 border-gray-200 hover:bg-gray-50 flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    Export CSV
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-0 shadow-sm bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">On-Time Rate</h4>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {deliveryPerformance.on_time_rate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {deliveryPerformance.on_time_deliveries} / {deliveryPerformance.total_orders} orders
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">On-Time Deliveries</h4>
                      <Truck className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {deliveryPerformance.on_time_deliveries}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">orders</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Delayed Deliveries</h4>
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {deliveryPerformance.delayed_deliveries}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">orders</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Total Orders</h4>
                      <FileText className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-600">
                      {deliveryPerformance.total_orders}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">orders</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </DashboardLayout>
  );
}