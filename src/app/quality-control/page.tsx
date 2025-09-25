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
  quality_control?: {
    qc_id: number;
    quantity_passed: number;
    quantity_repaired: number;
    quantity_rejected: number;
    qc_notes: string;
    check_date: string;
  };
}

interface QCRecord {
  qc_id: number;
  wo_id: number;
  quantity_passed: number;
  quantity_repaired: number;
  quantity_rejected: number;
  qc_notes: string;
  check_date: string;
  work_orders?: {
    wo_number: string;
    sales_orders?: {
      customers?: {
        customer_name: string;
      };
    };
  };
}

export default function QualityControlPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [qcRecords, setQcRecords] = useState<QCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQCForm, setShowQCForm] = useState(false);
  const [editingQC, setEditingQC] = useState<QCRecord | null>(null);
  const [viewingDetails, setViewingDetails] = useState<number | null>(null);
  const supabase = createClient();
  const { toast } = useToast();

  const [qcData, setQcData] = useState({
    wo_id: "",
    quantity_passed: 0,
    quantity_repaired: 0,
    quantity_rejected: 0,
    qc_notes: ""
  });

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, qcRes] = await Promise.all([
        supabase
          .from("work_orders")
          .select(`
            *,
            sales_orders (
              so_number,
              customers (
                customer_name
              )
            ),
            production_stages (*),
            quality_control (*)
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("quality_control")
          .select(`
            *,
            work_orders (
              wo_number,
              sales_orders (
                customers (
                  customer_name
                )
              )
            )
          `)
          .order("check_date", { ascending: false })
      ]);

      if (ordersRes.data) setWorkOrders(ordersRes.data);
      if (qcRes.data) setQcRecords(qcRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const readyForQC = workOrders.filter(wo => wo.current_stage_id === 5); // Finishing stage
  const inspectedWorkOrders = workOrders.filter(wo => wo.quality_control);

  const handleQCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingQC) {
        // Update existing QC record
        const { error } = await supabase
          .from("quality_control")
          .update({
            quantity_passed: qcData.quantity_passed,
            quantity_repaired: qcData.quantity_repaired,
            quantity_rejected: qcData.quantity_rejected,
            qc_notes: qcData.qc_notes
          })
          .eq("qc_id", editingQC.qc_id);

        if (error) throw error;

        toast({
          title: "QC record updated",
          description: "Quality inspection record has been updated successfully.",
        });
      } else {
        // Create new QC record
        const { error } = await supabase
          .from("quality_control")
          .insert([{
            wo_id: parseInt(qcData.wo_id),
            quantity_passed: qcData.quantity_passed,
            quantity_repaired: qcData.quantity_repaired,
            quantity_rejected: qcData.quantity_rejected,
            qc_notes: qcData.qc_notes
          }]);

        if (error) throw error;

        // Update work order stage to QC
        await supabase
          .from("work_orders")
          .update({ current_stage_id: 6 }) // QC stage
          .eq("wo_id", parseInt(qcData.wo_id));

        toast({
          title: "QC record created",
          description: "Quality inspection has been recorded successfully.",
        });
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving QC record:", error);
      toast({
        title: "Error",
        description: "Failed to save QC record. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (qcRecord: QCRecord) => {
    setEditingQC(qcRecord);
    setQcData({
      wo_id: qcRecord.wo_id.toString(),
      quantity_passed: qcRecord.quantity_passed,
      quantity_repaired: qcRecord.quantity_repaired,
      quantity_rejected: qcRecord.quantity_rejected,
      qc_notes: qcRecord.qc_notes
    });
    setShowQCForm(true);
  };

  const handleDelete = async (qcId: number) => {
    if (confirm("Are you sure you want to delete this QC record?")) {
      try {
        const { error } = await supabase
          .from("quality_control")
          .delete()
          .eq("qc_id", qcId);

        if (error) throw error;

        toast({
          title: "QC record deleted",
          description: "Quality inspection record has been removed successfully.",
        });

        fetchData();
      } catch (error) {
        console.error("Error deleting QC record:", error);
        toast({
          title: "Error",
          description: "Failed to delete QC record. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const startInspection = (wo: WorkOrder) => {
    setEditingQC(null);
    setQcData({
      wo_id: wo.wo_id.toString(),
      quantity_passed: 0,
      quantity_repaired: 0,
      quantity_rejected: 0,
      qc_notes: ""
    });
    setShowQCForm(true);
  };

  const resetForm = () => {
    setQcData({
      wo_id: "",
      quantity_passed: 0,
      quantity_repaired: 0,
      quantity_rejected: 0,
      qc_notes: ""
    });
    setEditingQC(null);
    setShowQCForm(false);
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
          <div className="text-center">Loading quality control data...</div>
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quality Control</h1>
              <p className="mt-2 text-gray-600">Record and track quality inspection results</p>
            </div>
            <Button onClick={() => {
              if (readyForQC.length > 0) {
                startInspection(readyForQC[0]);
              } else {
                toast({
                  title: "No work orders available",
                  description: "There are no work orders ready for inspection at this time.",
                  variant: "destructive",
                });
              }
            }}>
              New Inspection
            </Button>
          </div>
        </div>

        {/* QC Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready for QC</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">⏳</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{readyForQC.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting inspection</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inspected</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">✓</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inspectedWorkOrders.length}</div>
              <p className="text-xs text-muted-foreground">Inspection completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📊</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {inspectedWorkOrders.length > 0
                  ? `${Math.round((inspectedWorkOrders.reduce((sum, wo) =>
                      sum + (wo.quality_control?.quantity_passed || 0), 0) /
                      inspectedWorkOrders.reduce((sum, wo) =>
                      sum + (wo.quality_control?.quantity_passed || 0) +
                      (wo.quality_control?.quantity_repaired || 0) +
                      (wo.quality_control?.quantity_rejected || 0), 0)) * 100)}%`
                  : "0%"}
              </div>
              <p className="text-xs text-muted-foreground">Quality performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejection Rate</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">❌</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {inspectedWorkOrders.length > 0
                  ? `${Math.round((inspectedWorkOrders.reduce((sum, wo) =>
                      sum + (wo.quality_control?.quantity_rejected || 0), 0) /
                      inspectedWorkOrders.reduce((sum, wo) =>
                      sum + (wo.quality_control?.quantity_passed || 0) +
                      (wo.quality_control?.quantity_repaired || 0) +
                      (wo.quality_control?.quantity_rejected || 0), 0)) * 100)}%`
                  : "0%"}
              </div>
              <p className="text-xs text-muted-foreground">Need improvement</p>
            </CardContent>
          </Card>
        </div>

        {/* QC Form */}
        {showQCForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingQC ? "Edit QC Record" : "New Quality Inspection"}</CardTitle>
              <CardDescription>
                {editingQC ? "Update quality inspection results" : "Record quality inspection results for work order"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQCSubmit} className="space-y-4">
                {!editingQC && (
                  <div>
                    <Label htmlFor="work_order">Work Order *</Label>
                    <select
                      id="work_order"
                      required
                      className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={qcData.wo_id}
                      onChange={(e) => setQcData(prev => ({ ...prev, wo_id: e.target.value }))}
                    >
                      <option value="">Select a work order</option>
                      {readyForQC.map(wo => (
                        <option key={wo.wo_id} value={wo.wo_id}>
                          {wo.wo_number} - {wo.sales_orders?.customers?.customer_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="passed">Quantity Passed *</Label>
                    <Input
                      id="passed"
                      type="number"
                      min="0"
                      required
                      value={qcData.quantity_passed}
                      onChange={(e) => setQcData(prev => ({ ...prev, quantity_passed: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="repaired">Quantity Repaired</Label>
                    <Input
                      id="repaired"
                      type="number"
                      min="0"
                      value={qcData.quantity_repaired}
                      onChange={(e) => setQcData(prev => ({ ...prev, quantity_repaired: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rejected">Quantity Rejected</Label>
                    <Input
                      id="rejected"
                      type="number"
                      min="0"
                      value={qcData.quantity_rejected}
                      onChange={(e) => setQcData(prev => ({ ...prev, quantity_rejected: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">QC Notes</Label>
                  <textarea
                    id="notes"
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={qcData.qc_notes}
                    onChange={(e) => setQcData(prev => ({ ...prev, qc_notes: e.target.value }))}
                    placeholder="Enter quality inspection notes..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingQC ? "Update QC Record" : "Submit QC Results"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* QC Records Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>QC Records</CardTitle>
            <CardDescription>All quality inspection records and results</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>WO Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Passed</TableHead>
                  <TableHead>Repaired</TableHead>
                  <TableHead>Rejected</TableHead>
                  <TableHead>Inspection Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qcRecords.map((qc) => (
                  <TableRow key={qc.qc_id}>
                    <TableCell className="font-medium">{qc.work_orders?.wo_number || "N/A"}</TableCell>
                    <TableCell>{qc.work_orders?.sales_orders?.customers?.customer_name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {qc.quantity_passed}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {qc.quantity_repaired}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="bg-red-100 text-red-800">
                        {qc.quantity_rejected}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(qc.check_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingDetails(qc.qc_id)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(qc)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(qc.qc_id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {qcRecords.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No QC records found. Start inspection to record quality results.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Work Orders Ready for QC */}
        <Card>
          <CardHeader>
            <CardTitle>Work Orders Ready for Inspection</CardTitle>
            <CardDescription>Work orders that have completed finishing stage and await quality inspection</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>WO Number</TableHead>
                  <TableHead>SO Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Current Stage</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readyForQC.map((order) => (
                  <TableRow key={order.wo_id}>
                    <TableCell className="font-medium">{order.wo_number}</TableCell>
                    <TableCell>{order.sales_orders?.so_number || "N/A"}</TableCell>
                    <TableCell>{order.sales_orders?.customers?.customer_name || "N/A"}</TableCell>
                    <TableCell>{getStageBadge(order.production_stages?.stage_name || "Not Started")}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => startInspection(order)}
                        size="sm"
                      >
                        Start Inspection
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {readyForQC.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No work orders ready for inspection at this time.
              </div>
            )}
          </CardContent>
        </Card>

        {/* QC Details Modal */}
        {viewingDetails && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>QC Details</CardTitle>
                  <CardDescription>Detailed quality inspection information</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setViewingDetails(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const qc = qcRecords.find(q => q.qc_id === viewingDetails);
                if (!qc) return null;

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Work Order</Label>
                        <div className="text-lg font-semibold">{qc.work_orders?.wo_number || "N/A"}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Customer</Label>
                        <div className="text-lg">{qc.work_orders?.sales_orders?.customers?.customer_name || "N/A"}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Inspection Date</Label>
                        <div className="text-lg">{new Date(qc.check_date).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{qc.quantity_passed}</div>
                        <div className="text-sm text-gray-600">Passed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-600">{qc.quantity_repaired}</div>
                        <div className="text-sm text-gray-600">Repaired</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">{qc.quantity_rejected}</div>
                        <div className="text-sm text-gray-600">Rejected</div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">QC Notes</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                        {qc.qc_notes || "No notes provided"}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}