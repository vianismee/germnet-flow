"use client";

import { useState, useEffect, useCallback } from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [productionStages, setProductionStages] = useState<ProductionStage[]>([]);
  const [availableSalesOrders, setAvailableSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const supabase = createClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    so_id: "",
    production_start_date: new Date().toISOString().split('T')[0],
    production_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    current_stage_id: 1
  });

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, stagesRes, salesOrdersRes] = await Promise.all([
        supabase.from("work_orders").select(`
          *,
          sales_orders (
            so_number,
            customers (
              customer_name
            )
          ),
          production_stages (*)
        `).order("created_at", { ascending: false }),
        supabase.from("production_stages").select("*").order("sequence_order"),
        supabase.from("sales_orders").select(`
          so_id,
          so_number,
          customers (
            customer_name
          ),
          status
        `).eq("status", "Approved")
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
      if (editingWorkOrder) {
        // Update existing work order
        const { error } = await supabase
          .from("work_orders")
          .update({
            production_start_date: formData.production_start_date,
            production_end_date: formData.production_end_date,
            current_stage_id: formData.current_stage_id
          })
          .eq("wo_id", editingWorkOrder.wo_id);

        if (error) throw error;

        // Log the stage change if it changed
        if (formData.current_stage_id !== editingWorkOrder.current_stage_id) {
          await supabase.from("production_logs").insert([{
            wo_id: editingWorkOrder.wo_id,
            stage_id: formData.current_stage_id,
            notes: `Stage updated to ${productionStages.find(s => s.stage_id === formData.current_stage_id)?.stage_name}`
          }]);
        }

        toast({
          title: "Work order updated",
          description: "Work order has been updated successfully.",
        });
      } else {
        // Create new work order
        const woNumber = `WO-${new Date().getFullYear()}-${String(workOrders.length + 1).padStart(3, '0')}`;

        const { error } = await supabase
          .from("work_orders")
          .insert([{
            wo_number: woNumber,
            so_id: parseInt(formData.so_id),
            production_start_date: formData.production_start_date,
            production_end_date: formData.production_end_date,
            current_stage_id: formData.current_stage_id
          }]);

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
      production_start_date: workOrder.production_start_date,
      production_end_date: workOrder.production_end_date,
      current_stage_id: workOrder.current_stage_id
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
      const woNumber = `WO-${new Date().getFullYear()}-${String(workOrders.length + 1).padStart(3, '0')}`;

      const { error } = await supabase
        .from("work_orders")
        .insert([{
          wo_number: woNumber,
          so_id: soId,
          current_stage_id: 1, // PPIC stage
          production_start_date: new Date().toISOString().split('T')[0],
          production_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }]);

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
      await supabase.from("production_logs").insert([{
        wo_id: woId,
        stage_id: newStageId,
        notes: `Stage updated to ${productionStages.find(s => s.stage_id === newStageId)?.stage_name}`
      }]);

      toast({
        title: "Stage updated",
        description: `Work order stage has been updated to ${productionStages.find(s => s.stage_id === newStageId)?.stage_name}.`,
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
      production_start_date: new Date().toISOString().split('T')[0],
      production_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      current_stage_id: 1
    });
    setEditingWorkOrder(null);
    setShowCreateForm(false);
  };

  const getStageBadge = (stageName: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      "PPIC": "secondary",
      "Material Prep": "outline",
      "Cutting": "outline",
      "Sewing": "outline",
      "Finishing": "outline",
      "QC": "default",
      "Ready for Delivery": "default",
      "Delivered": "default",
    };
    return (
      <Badge variant={variants[stageName] || "secondary"}>
        {stageName}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading work orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
            <p className="mt-2 text-gray-600">Track production progress and manage work orders</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            Create Work Order
          </Button>
        </div>

        {/* Production Stages Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Production Stages Overview</CardTitle>
            <CardDescription>Current distribution of work orders across production stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {productionStages.map((stage) => {
                const ordersInStage = workOrders.filter(wo => wo.current_stage_id === stage.stage_id);
                return (
                  <div key={stage.stage_id} className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">{ordersInStage.length}</div>
                    <div className="text-sm font-medium">{stage.stage_name}</div>
                    <div className="text-xs text-muted-foreground">Stage {stage.sequence_order}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Work Order Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingWorkOrder ? "Edit Work Order" : "Create New Work Order"}</CardTitle>
              <CardDescription>
                {editingWorkOrder ? "Update work order details" : "Convert sales order to work order"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingWorkOrder && (
                  <div>
                    <Label htmlFor="sales_order">Sales Order *</Label>
                    <select
                      id="sales_order"
                      required
                      className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={formData.so_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, so_id: e.target.value }))}
                    >
                      <option value="">Select a sales order</option>
                      {availableSalesOrders.map(so => (
                        <option key={so.so_id} value={so.so_id}>
                          {so.so_number} - {so.customers?.[0]?.customer_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      required
                      value={formData.production_start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, production_start_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      required
                      value={formData.production_end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, production_end_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stage">Current Stage *</Label>
                    <select
                      id="stage"
                      required
                      className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={formData.current_stage_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, current_stage_id: parseInt(e.target.value) }))}
                    >
                      {productionStages.map((stage) => (
                        <option key={stage.stage_id} value={stage.stage_id}>
                          {stage.stage_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingWorkOrder ? "Update Work Order" : "Create Work Order"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Work Orders Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>All Work Orders</CardTitle>
            <CardDescription>Current work orders and their production status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>WO Number</TableHead>
                  <TableHead>SO Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Current Stage</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrders.map((order) => (
                  <TableRow key={order.wo_id}>
                    <TableCell className="font-medium">{order.wo_number}</TableCell>
                    <TableCell>{order.sales_orders?.so_number || "N/A"}</TableCell>
                    <TableCell>{order.sales_orders?.customers?.customer_name || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStageBadge(order.production_stages?.stage_name || "Not Started")}
                        <select
                          className="text-xs border border-input rounded px-2 py-1"
                          value={order.current_stage_id}
                          onChange={(e) => updateWorkOrderStage(order.wo_id, parseInt(e.target.value))}
                        >
                          {productionStages.map((stage) => (
                            <option key={stage.stage_id} value={stage.stage_id}>
                              {stage.stage_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.production_start_date ? new Date(order.production_start_date).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell>
                      {order.production_end_date ? new Date(order.production_end_date).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(order)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(order.wo_id)}
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
                No work orders found. Create a work order from an approved sales order.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Sales Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Available Sales Orders</CardTitle>
            <CardDescription>Convert approved sales orders to work orders</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SO Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableSalesOrders.map((order) => (
                  <TableRow key={order.so_id}>
                    <TableCell className="font-medium">{order.so_number}</TableCell>
                    <TableCell>{order.customers?.[0]?.customer_name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="default">{order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => createWorkOrderFromSO(order.so_id)}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}