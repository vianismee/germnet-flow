"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";

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
    return <div className="p-8 text-center">Loading reports...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-sm text-gray-600">Generate production performance reports</p>
            </div>
            <Button onClick={fetchReports}>
              Refresh Reports
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Production Cycle Time Report */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Production Cycle Time Report
              </h3>
              <Button onClick={exportProductionCycleReport} size="sm">
                Export CSV
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Average Cycle Time</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {productionCycleTimes.length > 0
                    ? `${(productionCycleTimes.reduce((sum, ct) => sum + ct.cycle_time_days, 0) / productionCycleTimes.length).toFixed(1)} days`
                    : "N/A"}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Fastest Completion</h4>
                <div className="text-2xl font-bold text-green-600">
                  {productionCycleTimes.length > 0
                    ? `${Math.min(...productionCycleTimes.map(ct => ct.cycle_time_days))} days`
                    : "N/A"}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Slowest Completion</h4>
                <div className="text-2xl font-bold text-red-600">
                  {productionCycleTimes.length > 0
                    ? `${Math.max(...productionCycleTimes.map(ct => ct.cycle_time_days))} days`
                    : "N/A"}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      WO Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cycle Time (Days)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productionCycleTimes.map((cycle) => (
                    <tr key={cycle.wo_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cycle.wo_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cycle.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(cycle.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(cycle.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          cycle.cycle_time_days <= 7 ? "bg-green-100 text-green-800" :
                          cycle.cycle_time_days <= 14 ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {cycle.cycle_time_days} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quality Performance Report */}
        {qualityPerformance && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Quality Performance Report
                </h3>
                <Button onClick={exportQualityReport} size="sm">
                  Export CSV
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Pass Rate</h4>
                  <div className="text-2xl font-bold text-green-600">
                    {qualityPerformance.pass_rate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600">
                    {qualityPerformance.total_passed} / {qualityPerformance.total_inspected} units
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Repair Rate</h4>
                  <div className="text-2xl font-bold text-yellow-600">
                    {qualityPerformance.repair_rate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600">
                    {qualityPerformance.total_repaired} units
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Rejection Rate</h4>
                  <div className="text-2xl font-bold text-red-600">
                    {qualityPerformance.rejection_rate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600">
                    {qualityPerformance.total_rejected} units
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Total Inspected</h4>
                  <div className="text-2xl font-bold text-blue-600">
                    {qualityPerformance.total_inspected}
                  </div>
                  <div className="text-xs text-gray-600">units</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Performance Report */}
        {deliveryPerformance && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  On-Time Delivery Report
                </h3>
                <Button onClick={exportDeliveryReport} size="sm">
                  Export CSV
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">On-Time Rate</h4>
                  <div className="text-2xl font-bold text-green-600">
                    {deliveryPerformance.on_time_rate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600">
                    {deliveryPerformance.on_time_deliveries} / {deliveryPerformance.total_orders} orders
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">On-Time Deliveries</h4>
                  <div className="text-2xl font-bold text-blue-600">
                    {deliveryPerformance.on_time_deliveries}
                  </div>
                  <div className="text-xs text-gray-600">orders</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Delayed Deliveries</h4>
                  <div className="text-2xl font-bold text-red-600">
                    {deliveryPerformance.delayed_deliveries}
                  </div>
                  <div className="text-xs text-gray-600">orders</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Total Orders</h4>
                  <div className="text-2xl font-bold text-gray-600">
                    {deliveryPerformance.total_orders}
                  </div>
                  <div className="text-xs text-gray-600">orders</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}