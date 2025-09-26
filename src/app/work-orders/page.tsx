"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Package,
  Scissors,
  Palette,
  Shirt,
  Zap,
  CheckCircle,
  Truck,
  Circle,
  Clock,
  AlertCircle,
  FolderKanban,
  Spool,
  FileText,
  PackageCheck,
} from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface WorkOrder {
  wo_id: number;
  wo_number: string;
  so_id: number;
  production_start_date: string;
  production_end_date: string;
  current_stage_id: number;
  created_at: string;
  sales_orders?: {
    so_number: string;
    customers?: {
      customer_name: string;
    };
  };
  production_stages?: {
    stage_name: string;
  };
}

interface ProductionStage {
  stage_id: number;
  stage_name: string;
  sequence_order: number;
}

interface SalesOrder {
  so_id: number;
  so_number: string;
  customers?: {
    customer_name: string;
  }[];
  status: string;
}

const getStageIcon = (stageName: string) => {
  const name = stageName.toLowerCase();
  if (name.includes("ppic")) return FolderKanban;
  if (name.includes("material")) return Spool;
  if (name.includes("planning") || name.includes("design")) return Palette;
  if (name.includes("cutting") || name.includes("scissors")) return Scissors;
  if (name.includes("sewing") || name.includes("stitch")) return Shirt;
  if (name.includes("iron") || name.includes("press")) return Zap;
  if (name.includes("quality") || name.includes("qc")) return CheckCircle;
  if (name.includes("pack") || name.includes("ship")) return Package;
  if (name.includes("delivery") || name.includes("truck")) return Truck;
  if (name.includes("delivered")) return PackageCheck;
  if (name.includes("complete") || name.includes("finish")) return CheckCircle;
  if (name.includes("pending") || name.includes("wait")) return Clock;
  if (name.includes("issue") || name.includes("problem")) return AlertCircle;
  return Circle;
};

const getStageColor = (stageName: string, sequenceOrder: number) => {
  const name = stageName.toLowerCase();
  if (name.includes("planning") || name.includes("design"))
    return "bg-blue-100 text-blue-700 border-blue-200";
  if (name.includes("cutting"))
    return "bg-green-100 text-green-700 border-green-200";
  if (name.includes("sewing"))
    return "bg-purple-100 text-purple-700 border-purple-200";
  if (name.includes("iron") || name.includes("press"))
    return "bg-orange-100 text-orange-700 border-orange-200";
  if (name.includes("quality") || name.includes("qc"))
    return "bg-red-100 text-red-700 border-red-200";
  if (name.includes("pack")) return "bg-cyan-100 text-cyan-700 border-cyan-200";
  if (name.includes("delivery"))
    return "bg-indigo-100 text-indigo-700 border-indigo-200";
  if (name.includes("complete") || name.includes("finish"))
    return "bg-emerald-100 text-emerald-700 border-emerald-200";

  // Fallback colors based on sequence order
  const colors = [
    "bg-gray-100 text-gray-700 border-gray-200",
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-green-100 text-green-700 border-green-200",
    "bg-yellow-100 text-yellow-700 border-yellow-200",
    "bg-purple-100 text-purple-700 border-purple-200",
    "bg-pink-100 text-pink-700 border-pink-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200",
    "bg-red-100 text-red-700 border-red-200",
  ];
  return colors[sequenceOrder % colors.length];
};

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [productionStages, setProductionStages] = useState<ProductionStage[]>(
    []
  );
  const [availableSalesOrders, setAvailableSalesOrders] = useState<
    SalesOrder[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(
    null
  );
  const supabase = createClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    so_id: "",
    production_start_date: new Date(),
    production_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    current_stage_id: 1,
  });

  const [showStartDateCalendar, setShowStartDateCalendar] = useState(false);
  const [showEndDateCalendar, setShowEndDateCalendar] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, stagesRes, salesOrdersRes] = await Promise.all([
        supabase
          .from("work_orders")
          .select(
            `
          *,
          sales_orders (
            so_number,
            customers (
              customer_name
            )
          ),
          production_stages (*)
        `
          )
          .order("created_at", { ascending: false }),
        supabase.from("production_stages").select("*").order("sequence_order"),
        supabase
          .from("sales_orders")
          .select(
            `
          so_id,
          so_number,
          customers (
            customer_name
          ),
          status
        `
          )
          .eq("status", "Approved"),
      ]);

      if (ordersRes.data) setWorkOrders(ordersRes.data);
      if (stagesRes.data) setProductionStages(stagesRes.data);
      if (salesOrdersRes.data) setAvailableSalesOrders(salesOrdersRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Convert Date objects to ISO strings for database
      const submitData = {
        ...formData,
        production_start_date:
          formData.production_start_date instanceof Date
            ? formData.production_start_date.toISOString().split("T")[0]
            : formData.production_start_date,
        production_end_date:
          formData.production_end_date instanceof Date
            ? formData.production_end_date.toISOString().split("T")[0]
            : formData.production_end_date,
      };

      if (editingWorkOrder) {
        // Update existing work order
        const { error } = await supabase
          .from("work_orders")
          .update({
            production_start_date: submitData.production_start_date,
            production_end_date: submitData.production_end_date,
            current_stage_id: submitData.current_stage_id,
          })
          .eq("wo_id", editingWorkOrder.wo_id);

        if (error) throw error;

        // Log the stage change if it changed
        if (formData.current_stage_id !== editingWorkOrder.current_stage_id) {
          await supabase.from("production_logs").insert([
            {
              wo_id: editingWorkOrder.wo_id,
              stage_id: formData.current_stage_id,
              notes: `Stage updated to ${
                productionStages.find(
                  (s) => s.stage_id === formData.current_stage_id
                )?.stage_name
              }`,
            },
          ]);
        }

        toast({
          title: "Work order updated",
          description: "Work order has been updated successfully.",
        });
      } else {
        // Create new work order - generate unique WO number
        const currentYear = new Date().getFullYear();
        const { data: maxOrder, error: maxError } = await supabase
          .from("work_orders")
          .select("wo_number")
          .like("wo_number", `WO-${currentYear}-%`)
          .order("wo_number", { ascending: false })
          .limit(1)
          .single();

        let nextNumber = 1;
        if (maxOrder?.wo_number) {
          const match = maxOrder.wo_number.match(/WO-(\d{4})-(\d{3})$/);
          if (match) {
            nextNumber = parseInt(match[2]) + 1;
          }
        }

        const woNumber = `WO-${currentYear}-${String(nextNumber).padStart(3, "0")}`;

        const { error } = await supabase.from("work_orders").insert([
          {
            wo_number: woNumber,
            so_id: parseInt(formData.so_id),
            production_start_date: submitData.production_start_date,
            production_end_date: submitData.production_end_date,
            current_stage_id: submitData.current_stage_id,
          },
        ]);

        if (error) throw error;

        // Update sales order status
        await supabase
          .from("sales_orders")
          .update({ status: "Converted to WO" })
          .eq("so_id", parseInt(formData.so_id));

        toast({
          title: "Work order created",
          description: `Work order ${woNumber} has been created successfully.`,
        });
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving work order:", error);
      toast({
        title: "Error",
        description: "Failed to save work order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (workOrder: WorkOrder) => {
    setEditingWorkOrder(workOrder);
    setFormData({
      so_id: workOrder.so_id.toString(),
      production_start_date: workOrder.production_start_date ? new Date(workOrder.production_start_date) : new Date(),
      production_end_date: workOrder.production_end_date ? new Date(workOrder.production_end_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      current_stage_id: workOrder.current_stage_id,
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (woId: number) => {
    if (confirm("Are you sure you want to delete this work order?")) {
      try {
        const { error } = await supabase
          .from("work_orders")
          .delete()
          .eq("wo_id", woId);

        if (error) throw error;

        toast({
          title: "Work order deleted",
          description: "Work order has been removed successfully.",
        });

        fetchData();
      } catch (error) {
        console.error("Error deleting work order:", error);
        toast({
          title: "Error",
          description: "Failed to delete work order. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const createWorkOrderFromSO = async (soId: number) => {
    try {
      // Generate unique WO number
      const currentYear = new Date().getFullYear();
      const { data: maxOrder, error: maxError } = await supabase
        .from("work_orders")
        .select("wo_number")
        .like("wo_number", `WO-${currentYear}-%`)
        .order("wo_number", { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 1;
      if (maxOrder?.wo_number) {
        const match = maxOrder.wo_number.match(/WO-(\d{4})-(\d{3})$/);
        if (match) {
          nextNumber = parseInt(match[2]) + 1;
        }
      }

      const woNumber = `WO-${currentYear}-${String(nextNumber).padStart(3, "0")}`;

      const { error } = await supabase.from("work_orders").insert([
        {
          wo_number: woNumber,
          so_id: soId,
          current_stage_id: 1, // PPIC stage
          production_start_date: new Date().toISOString().split("T")[0],
          production_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        },
      ]);

      if (error) throw error;

      // Update sales order status
      await supabase
        .from("sales_orders")
        .update({ status: "Converted to WO" })
        .eq("so_id", soId);

      toast({
        title: "Work order created",
        description: `Work order ${woNumber} has been created from sales order.`,
      });

      fetchData();
    } catch (error) {
      console.error("Error creating work order from SO:", error);
      toast({
        title: "Error",
        description: "Failed to create work order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateWorkOrderStage = async (woId: number, newStageId: number) => {
    try {
      const { error } = await supabase
        .from("work_orders")
        .update({ current_stage_id: newStageId })
        .eq("wo_id", woId);

      if (error) throw error;

      // Log the stage change
      await supabase.from("production_logs").insert([
        {
          wo_id: woId,
          stage_id: newStageId,
          notes: `Stage updated to ${
            productionStages.find((s) => s.stage_id === newStageId)?.stage_name
          }`,
        },
      ]);

      toast({
        title: "Stage updated",
        description: `Work order stage has been updated to ${
          productionStages.find((s) => s.stage_id === newStageId)?.stage_name
        }.`,
      });

      fetchData();
    } catch (error) {
      console.error("Error updating work order stage:", error);
      toast({
        title: "Error",
        description: "Failed to update work order stage. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      so_id: "",
      production_start_date: new Date(),
      production_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      current_stage_id: 1,
    });
    setEditingWorkOrder(null);
    setShowCreateForm(false);
  };

  const getStageBadge = (stageName: string) => {
    const variants: {
      [key: string]: "default" | "secondary" | "destructive" | "outline";
    } = {
      PPIC: "secondary",
      "Material Prep": "outline",
      Cutting: "outline",
      Sewing: "outline",
      Finishing: "outline",
      QC: "default",
      "Ready for Delivery": "default",
      Delivered: "default",
    };
    return (
      <Badge variant={variants[stageName] || "secondary"}>{stageName}</Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading work orders...</p>
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
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
                  <p className="text-gray-600 text-sm">Track production progress and manage work orders</p>
                </div>
              </div>
            </div>
            <Button onClick={() => setShowCreateForm(true)} className="h-10 bg-blue-600 hover:bg-blue-700">
              Create Work Order
            </Button>
          </div>

        {/* Production Stages Overview */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Production Stages Overview</h3>
                <p className="text-sm text-gray-600">Current distribution of work orders across production stages</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FolderKanban className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {productionStages.map((stage) => {
                const ordersInStage = workOrders.filter(
                  (wo) => wo.current_stage_id === stage.stage_id
                );
                const StageIcon = getStageIcon(stage.stage_name);
                const colorClass = getStageColor(
                  stage.stage_name,
                  stage.sequence_order
                );

                return (
                  <Card
                    key={stage.stage_id}
                    className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorClass.replace('bg-', 'bg-').replace('text-', 'text-').split(' ')[0]} bg-opacity-20`}>
                          <StageIcon className="h-5 w-5" />
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {ordersInStage.length}
                          </div>
                          <div className="text-xs text-gray-600">orders</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="font-semibold text-gray-900 text-sm">
                          {stage.stage_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Stage {stage.sequence_order}
                        </div>
                        {ordersInStage.length > 0 && (
                          <div className="mt-3">
                            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 text-xs">
                              Active
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Work Order Form */}
        {showCreateForm && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingWorkOrder ? "Edit Work Order" : "Create New Work Order"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {editingWorkOrder
                      ? "Update work order details"
                      : "Convert sales order to work order"}
                  </p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingWorkOrder && (
                  <div>
                    <Label htmlFor="sales_order">Sales Order *</Label>
                    <Select
                      value={formData.so_id}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, so_id: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a sales order" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSalesOrders.map((so) => (
                          <SelectItem
                            key={so.so_id}
                            value={so.so_id.toString()}
                          >
                            {so.so_number} - {so.customers?.[0]?.customer_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Popover
                      open={showStartDateCalendar}
                      onOpenChange={setShowStartDateCalendar}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.production_start_date
                            ? format(formData.production_start_date, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.production_start_date}
                          onSelect={(date) => {
                            setFormData((prev) => ({
                              ...prev,
                              production_start_date: date || new Date(),
                            }));
                            setShowStartDateCalendar(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date *</Label>
                    <Popover
                      open={showEndDateCalendar}
                      onOpenChange={setShowEndDateCalendar}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.production_end_date
                            ? format(formData.production_end_date, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.production_end_date}
                          onSelect={(date) => {
                            setFormData((prev) => ({
                              ...prev,
                              production_end_date: date || new Date(),
                            }));
                            setShowEndDateCalendar(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="stage">Current Stage *</Label>
                    <Select
                      value={formData.current_stage_id.toString()}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          current_stage_id: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {productionStages.map((stage) => (
                          <SelectItem
                            key={stage.stage_id}
                            value={stage.stage_id.toString()}
                          >
                            {stage.stage_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm} className="h-10 border-gray-200 hover:bg-gray-50">
                    Cancel
                  </Button>
                  <Button type="submit" className="h-10 bg-blue-600 hover:bg-blue-700">
                    {editingWorkOrder
                      ? "Update Work Order"
                      : "Create Work Order"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Work Orders Table */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">All Work Orders</h3>
                <p className="text-sm text-gray-600">Current work orders and their production status</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-gray-700">WO Number</TableHead>
                    <TableHead className="text-gray-700">SO Number</TableHead>
                    <TableHead className="text-gray-700">Customer</TableHead>
                    <TableHead className="text-gray-700">Current Stage</TableHead>
                    <TableHead className="text-gray-700">Start Date</TableHead>
                    <TableHead className="text-gray-700">End Date</TableHead>
                    <TableHead className="text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrders.map((order) => (
                    <TableRow key={order.wo_id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">
                        {order.wo_number}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {order.sales_orders?.so_number || "N/A"}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {order.sales_orders?.customers?.customer_name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStageBadge(
                            order.production_stages?.stage_name || "Not Started"
                          )}
                          <Select
                            value={order.current_stage_id.toString()}
                            onValueChange={(value) =>
                              updateWorkOrderStage(
                                order.wo_id,
                                parseInt(value)
                              )
                            }
                          >
                            <SelectTrigger className="w-32 text-xs border-gray-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {productionStages.map((stage) => (
                                <SelectItem
                                  key={stage.stage_id}
                                  value={stage.stage_id.toString()}
                                >
                                  {stage.stage_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {order.production_start_date
                          ? new Date(
                              order.production_start_date
                            ).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {order.production_end_date
                          ? new Date(
                              order.production_end_date
                            ).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(order)}
                            className="h-8 border-gray-200 hover:bg-gray-50"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(order.wo_id)}
                            className="h-8"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {workOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No work orders found. Create a work order from an approved sales
                  order.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Available Sales Orders */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Available Sales Orders</h3>
                <p className="text-sm text-gray-600">Convert approved sales orders to work orders</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-gray-700">SO Number</TableHead>
                    <TableHead className="text-gray-700">Customer</TableHead>
                    <TableHead className="text-gray-700">Status</TableHead>
                    <TableHead className="text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableSalesOrders.map((order) => (
                    <TableRow key={order.so_id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">
                        {order.so_number}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {order.customers?.[0]?.customer_name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">{order.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => createWorkOrderFromSO(order.so_id)}
                          className="h-8 bg-blue-600 hover:bg-blue-700"
                        >
                          Create WO
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {availableSalesOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No approved sales orders available for conversion.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
