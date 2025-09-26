"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Check,
  Eye,
  Edit,
  Trash2,
  Search,
  TrendingUp,
  Award,
  Shield,
  ClipboardCheck,
  FileText,
  Calendar,
  Users,
  Package
} from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
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

  const readyForQC = workOrders.filter(wo => wo.current_stage_id === 5);
  const inspectedWorkOrders = workOrders.filter(wo => wo.quality_control);

  // Calculate statistics
  const totalInspected = inspectedWorkOrders.length;
  const totalPassed = inspectedWorkOrders.reduce((sum, wo) => sum + (wo.quality_control?.quantity_passed || 0), 0);
  const totalRepaired = inspectedWorkOrders.reduce((sum, wo) => sum + (wo.quality_control?.quantity_repaired || 0), 0);
  const totalRejected = inspectedWorkOrders.reduce((sum, wo) => sum + (wo.quality_control?.quantity_rejected || 0), 0);
  const totalChecked = totalPassed + totalRepaired + totalRejected;

  const passRate = totalChecked > 0 ? (totalPassed / totalChecked) * 100 : 0;
  const repairRate = totalChecked > 0 ? (totalRepaired / totalChecked) * 100 : 0;
  const rejectionRate = totalChecked > 0 ? (totalRejected / totalChecked) * 100 : 0;

  const filteredQCRecords = qcRecords.filter(qc =>
    qc.work_orders?.wo_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qc.work_orders?.sales_orders?.customers?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingQC) {
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
          title: "QC Record Updated",
          description: "Quality inspection record has been updated successfully.",
        });
      } else {
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

        await supabase
          .from("work_orders")
          .update({ current_stage_id: 6 })
          .eq("wo_id", parseInt(qcData.wo_id));

        toast({
          title: "QC Inspection Completed",
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
    setActiveTab("inspection");
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
          title: "QC Record Deleted",
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
    setActiveTab("inspection");
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

  const getQualityBadge = (passed: number, repaired: number, rejected: number) => {
    const total = passed + repaired + rejected;
    if (total === 0) return <Badge variant="secondary">No Data</Badge>;

    const passPercentage = (passed / total) * 100;

    if (passPercentage >= 95) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (passPercentage >= 85) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (passPercentage >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quality control data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                Quality Control
              </h1>
              <p className="mt-2 text-gray-600">Monitor and manage quality inspection processes</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (readyForQC.length > 0) {
                    startInspection(readyForQC[0]);
                  } else {
                    toast({
                      title: "No Work Orders Available",
                      description: "There are no work orders ready for inspection at this time.",
                      variant: "destructive",
                    });
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ClipboardCheck className="h-4 w-4 mr-2" />
                New Inspection
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inspection">Inspection</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="queue">Queue</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ready for QC</CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{readyForQC.length}</div>
                  <p className="text-xs text-muted-foreground">Awaiting inspection</p>
                  <Progress value={(readyForQC.length / Math.max(workOrders.length, 1)) * 100} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Inspected</CardTitle>
                  <Check className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{totalInspected}</div>
                  <p className="text-xs text-muted-foreground">Inspections completed</p>
                  <Progress value={totalInspected > 0 ? 100 : 0} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-emerald-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                  <Award className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{passRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Quality performance</p>
                  <Progress value={passRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rejection Rate</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{rejectionRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Needs attention</p>
                  <Progress value={rejectionRate} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Quality Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Quality Distribution
                  </CardTitle>
                  <CardDescription>Overview of inspection results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Passed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{totalPassed}</span>
                        <span className="text-xs text-muted-foreground">({passRate.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <Progress value={passRate} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">Repaired</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{totalRepaired}</span>
                        <span className="text-xs text-muted-foreground">({repairRate.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <Progress value={repairRate} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Rejected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{totalRejected}</span>
                        <span className="text-xs text-muted-foreground">({rejectionRate.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <Progress value={rejectionRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest quality inspections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {qcRecords.slice(0, 5).map((qc) => (
                      <div key={qc.qc_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg">
                            <ClipboardCheck className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{qc.work_orders?.wo_number}</div>
                            <div className="text-xs text-muted-foreground">
                              {qc.work_orders?.sales_orders?.customers?.customer_name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {getQualityBadge(qc.quantity_passed, qc.quantity_repaired, qc.quantity_rejected)}
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(qc.check_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    {qcRecords.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        No recent inspections
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Inspection Tab */}
          <TabsContent value="inspection" className="space-y-6">
            {showQCForm ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    {editingQC ? "Edit QC Record" : "New Quality Inspection"}
                  </CardTitle>
                  <CardDescription>
                    {editingQC ? "Update quality inspection results" : "Record quality inspection results for work order"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleQCSubmit} className="space-y-6">
                    {!editingQC && (
                      <div>
                        <Label htmlFor="work_order">Work Order *</Label>
                        <Select
                          value={qcData.wo_id}
                          onValueChange={(value) => setQcData(prev => ({ ...prev, wo_id: value }))}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a work order" />
                          </SelectTrigger>
                          <SelectContent>
                            {readyForQC.map(wo => (
                              <SelectItem key={wo.wo_id} value={wo.wo_id.toString()}>
                                {wo.wo_number} - {wo.sales_orders?.customers?.customer_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="passed" className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Quantity Passed *
                        </Label>
                        <Input
                          id="passed"
                          type="number"
                          min="0"
                          required
                          value={qcData.quantity_passed}
                          onChange={(e) => setQcData(prev => ({ ...prev, quantity_passed: parseInt(e.target.value) || 0 }))}
                          className="border-green-200 focus:border-green-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="repaired" className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          Quantity Repaired
                        </Label>
                        <Input
                          id="repaired"
                          type="number"
                          min="0"
                          value={qcData.quantity_repaired}
                          onChange={(e) => setQcData(prev => ({ ...prev, quantity_repaired: parseInt(e.target.value) || 0 }))}
                          className="border-yellow-200 focus:border-yellow-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rejected" className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          Quantity Rejected
                        </Label>
                        <Input
                          id="rejected"
                          type="number"
                          min="0"
                          value={qcData.quantity_rejected}
                          onChange={(e) => setQcData(prev => ({ ...prev, quantity_rejected: parseInt(e.target.value) || 0 }))}
                          className="border-red-200 focus:border-red-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        QC Notes
                      </Label>
                      <textarea
                        id="notes"
                        rows={4}
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={qcData.qc_notes}
                        onChange={(e) => setQcData(prev => ({ ...prev, qc_notes: e.target.value }))}
                        placeholder="Enter detailed quality inspection notes, defects found, corrective actions taken..."
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
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ClipboardCheck className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Quality Inspection</h3>
                  <p className="text-gray-600 text-center mb-6">
                    Select a work order from the queue to begin quality inspection process
                  </p>
                  <Button
                    onClick={() => {
                      if (readyForQC.length > 0) {
                        startInspection(readyForQC[0]);
                      } else {
                        toast({
                          title: "No Work Orders Available",
                          description: "There are no work orders ready for inspection at this time.",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Start New Inspection
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Records Tab */}
          <TabsContent value="records" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  QC Records
                </CardTitle>
                <CardDescription>All quality inspection records and results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by WO number or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Work Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Quality Rating</TableHead>
                      <TableHead>Results</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQCRecords.map((qc) => {
                      const total = qc.quantity_passed + qc.quantity_repaired + qc.quantity_rejected;
                      return (
                        <TableRow key={qc.qc_id}>
                          <TableCell className="font-medium">{qc.work_orders?.wo_number || "N/A"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              {qc.work_orders?.sales_orders?.customers?.customer_name || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getQualityBadge(qc.quantity_passed, qc.quantity_repaired, qc.quantity_rejected)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <span>{qc.quantity_passed}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 text-yellow-600" />
                                <span>{qc.quantity_repaired}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <XCircle className="h-3 w-3 text-red-600" />
                                <span>{qc.quantity_rejected}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {new Date(qc.check_date).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setViewingDetails(qc.qc_id)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(qc)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(qc.qc_id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {filteredQCRecords.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? "No matching QC records found." : "No QC records found. Start inspection to record quality results."}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Queue Tab */}
          <TabsContent value="queue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Inspection Queue
                </CardTitle>
                <CardDescription>Work orders ready for quality inspection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {readyForQC.map((order) => (
                    <Card key={order.wo_id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                              <Package className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold">{order.wo_number}</div>
                              <div className="text-sm text-gray-600">{order.sales_orders?.so_number}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {order.sales_orders?.customers?.customer_name}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Current Stage</div>
                              <Badge variant="outline">{order.production_stages?.stage_name}</Badge>
                            </div>
                            <Button
                              onClick={() => startInspection(order)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <ClipboardCheck className="h-4 w-4 mr-2" />
                              Start Inspection
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {readyForQC.length === 0 && (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Empty Queue</h3>
                    <p className="text-gray-600">No work orders are currently ready for quality inspection.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* QC Details Modal */}
        {viewingDetails && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    QC Inspection Details
                  </CardTitle>
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
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-3xl font-bold text-blue-600">{qc.quantity_passed}</div>
                          <div className="text-sm text-blue-800 font-medium">Passed</div>
                          <CheckCircle className="h-6 w-6 text-blue-600 mx-auto mt-2" />
                        </CardContent>
                      </Card>
                      <Card className="bg-yellow-50 border-yellow-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-3xl font-bold text-yellow-600">{qc.quantity_repaired}</div>
                          <div className="text-sm text-yellow-800 font-medium">Repaired</div>
                          <AlertTriangle className="h-6 w-6 text-yellow-600 mx-auto mt-2" />
                        </CardContent>
                      </Card>
                      <Card className="bg-red-50 border-red-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-3xl font-bold text-red-600">{qc.quantity_rejected}</div>
                          <div className="text-sm text-red-800 font-medium">Rejected</div>
                          <XCircle className="h-6 w-6 text-red-600 mx-auto mt-2" />
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Work Order</Label>
                        <div className="text-lg font-semibold">{qc.work_orders?.wo_number || "N/A"}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Customer</Label>
                        <div className="text-lg">{qc.work_orders?.sales_orders?.customers?.customer_name || "N/A"}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Inspection Date</Label>
                        <div className="text-lg flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(qc.check_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Quality Rating</Label>
                        <div>{getQualityBadge(qc.quantity_passed, qc.quantity_repaired, qc.quantity_rejected)}</div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Inspection Notes</Label>
                      <div className="mt-2 p-4 bg-gray-50 rounded-md border">
                        {qc.qc_notes ? (
                          <p className="text-gray-700 whitespace-pre-wrap">{qc.qc_notes}</p>
                        ) : (
                          <p className="text-gray-500 italic">No inspection notes provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}