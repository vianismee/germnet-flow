"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateInput } from "@/components/ui/date-input";
import { addDays } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Customer {
  customer_id: number;
  customer_name: string;
  contact_person: string;
  email: string;
  phone_number: string;
}

interface SalesOrder {
  so_id: number;
  so_number: string;
  customer_id: number;
  order_date: string;
  target_delivery_date: string;
  status: string;
  customers?: Customer;
}

interface OrderItem {
  so_item_id: number;
  product_name: string;
  quantity: number;
  size: string;
  color: string;
}

export default function SalesOrdersPage() {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
  const [viewingOrderItems, setViewingOrderItems] = useState<number | null>(null);
  const supabase = createClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    customer_id: "",
    order_date: new Date(),
    target_delivery_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: "Draft",
    items: [{ product_name: "", quantity: "", size: "", color: "" }]
  });

  
  // Date validation functions
  const isValidOrderDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxOrderDate = addDays(today, 7); // Allow orders up to 7 days in the future for planning
    const minOrderDate = new Date("2020-01-01");
    return date >= minOrderDate && date <= maxOrderDate;
  };

  const isValidDeliveryDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minDeliveryDate = addDays(today, 1); // At least tomorrow
    const maxDeliveryDate = addDays(today, 365); // Up to 1 year in the future

    // Also ensure delivery date is after order date
    const orderDate = formData.order_date;
    const minDeliveryFromOrder = orderDate ? addDays(orderDate, 1) : minDeliveryDate;

    return date >= (minDeliveryFromOrder > minDeliveryDate ? minDeliveryFromOrder : minDeliveryDate) && date <= maxDeliveryDate;
  };

  const fetchData = useCallback(async () => {
    const [ordersRes, customersRes] = await Promise.all([
      supabase.from("sales_orders").select("*, customers(*)").order("created_at", { ascending: false }),
      supabase.from("customers").select("*").order("customer_name")
    ]);

    if (ordersRes.data) setSalesOrders(ordersRes.data);
    if (customersRes.data) setCustomers(customersRes.data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchOrderItems = async (soId: number) => {
    const { data } = await supabase
      .from("so_items")
      .select("*")
      .eq("so_id", soId);

    if (data) setOrderItems(data);
    setViewingOrderItems(soId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Convert Date objects to ISO strings for database
      const submitData = {
        ...formData,
        order_date: formData.order_date instanceof Date
          ? formData.order_date.toISOString().split('T')[0]
          : formData.order_date,
        target_delivery_date: formData.target_delivery_date instanceof Date
          ? formData.target_delivery_date.toISOString().split('T')[0]
          : formData.target_delivery_date
      };

      if (editingOrder) {
        // Update existing order
        const { error } = await supabase
          .from("sales_orders")
          .update({
            customer_id: parseInt(formData.customer_id),
            order_date: submitData.order_date,
            target_delivery_date: submitData.target_delivery_date,
            status: formData.status
          })
          .eq("so_id", editingOrder.so_id);

        if (error) throw error;

        toast({
          title: "Sales order updated",
          description: "Order has been updated successfully.",
        });
      } else {
        // Create new order - generate unique SO number
        const currentYear = new Date().getFullYear();
        const { data: maxOrder, error: maxError } = await supabase
          .from("sales_orders")
          .select("so_number")
          .like("so_number", `SO-${currentYear}-%`)
          .order("so_number", { ascending: false })
          .limit(1)
          .single();

        let nextNumber = 1;
        if (maxOrder?.so_number) {
          const match = maxOrder.so_number.match(/SO-(\d{4})-(\d{3})$/);
          if (match) {
            nextNumber = parseInt(match[2]) + 1;
          }
        }

        const soNumber = `SO-${currentYear}-${String(nextNumber).padStart(3, '0')}`;

        const { data: newOrder, error } = await supabase
          .from("sales_orders")
          .insert([{
            so_number: soNumber,
            customer_id: parseInt(formData.customer_id),
            order_date: submitData.order_date,
            target_delivery_date: submitData.target_delivery_date,
            status: formData.status
          }])
          .select()
          .single();

        if (error) throw error;

        // Insert order items
        const itemsToInsert = formData.items.map(item => ({
          so_id: newOrder.so_id,
          product_name: item.product_name,
          quantity: parseInt(item.quantity),
          size: item.size,
          color: item.color
        }));

        await supabase.from("so_items").insert(itemsToInsert);

        toast({
          title: "Sales order created",
          description: `Order ${soNumber} has been created successfully.`,
        });
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving sales order:", error);
      toast({
        title: "Error",
        description: "Failed to save sales order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (order: SalesOrder) => {
    setEditingOrder(order);
    setFormData({
      customer_id: order.customer_id.toString(),
      order_date: new Date(order.order_date),
      target_delivery_date: new Date(order.target_delivery_date),
      status: order.status,
      items: [{ product_name: "", quantity: "", size: "", color: "" }]
    });
    setShowForm(true);
  };

  const handleDelete = async (soId: number) => {
    if (confirm("Are you sure you want to delete this sales order? This will also delete all associated items.")) {
      try {
        const { error } = await supabase
          .from("sales_orders")
          .delete()
          .eq("so_id", soId);

        if (error) throw error;

        toast({
          title: "Sales order deleted",
          description: "Order and its items have been removed successfully.",
        });

        fetchData();
      } catch (error) {
        console.error("Error deleting sales order:", error);
        toast({
          title: "Error",
          description: "Failed to delete sales order. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_name: "", quantity: "", size: "", color: "" }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      order_date: new Date(),
      target_delivery_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "Draft",
      items: [{ product_name: "", quantity: "", size: "", color: "" }]
    });
    setEditingOrder(null);
    setShowForm(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      "Draft": "secondary",
      "Approved": "default",
      "Converted to WO": "outline",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sales orders...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Orders</h1>
            <p className="mt-2 text-gray-600">Create and manage customer sales orders</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            Create Sales Order
          </Button>
        </div>

        {/* Sales Order Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingOrder ? "Edit Sales Order" : "Create New Sales Order"}</CardTitle>
              <CardDescription>
                {editingOrder ? "Update sales order information" : "Enter order details and items"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="customer">Customer *</Label>
                    <Select value={formData.customer_id} onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.customer_id} value={customer.customer_id.toString()}>
                            {customer.customer_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="order_date">Order Date *</Label>
                    <DateInput
                      id="order_date"
                      value={formData.order_date}
                      onChange={(date) => {
                        if (date && isValidOrderDate(date)) {
                          // Set default delivery date to 30 days after order date if not already set
                          const defaultDeliveryDate = addDays(date, 30);
                          setFormData(prev => ({
                            ...prev,
                            order_date: date,
                            target_delivery_date: prev.target_delivery_date || defaultDeliveryDate
                          }));
                        }
                      }}
                      placeholder="Select order date"
                      minDate={new Date("2020-01-01")}
                      maxDate={addDays(new Date(), 7)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Order date can be up to 7 days in the future
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="target_delivery_date">Target Delivery Date *</Label>
                    <DateInput
                      id="target_delivery_date"
                      value={formData.target_delivery_date}
                      onChange={(date) => {
                        if (date && isValidDeliveryDate(date)) {
                          setFormData(prev => ({ ...prev, target_delivery_date: date }));
                        }
                      }}
                      placeholder="Select delivery date"
                      minDate={formData.order_date ? addDays(formData.order_date, 1) : addDays(new Date(), 1)}
                      maxDate={addDays(new Date(), 365)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Delivery date must be at least tomorrow and within 1 year
                    </p>
                  </div>
                </div>

                {!editingOrder && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-sm font-medium">Order Items</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        Add Item
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                          <Input
                            placeholder="Product Name"
                            required
                            value={item.product_name}
                            onChange={(e) => updateItem(index, "product_name", e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Quantity"
                            required
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", e.target.value)}
                          />
                          <Input
                            placeholder="Size"
                            value={item.size}
                            onChange={(e) => updateItem(index, "size", e.target.value)}
                          />
                          <Input
                            placeholder="Color"
                            value={item.color}
                            onChange={(e) => updateItem(index, "color", e.target.value)}
                          />
                          {formData.items.length > 1 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeItem(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {editingOrder && (
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Approved">Approved</option>
                      <option value="Converted to WO">Converted to WO</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingOrder ? "Update Order" : "Create Order"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Order Items Modal */}
        {viewingOrderItems && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Order Items</CardTitle>
                  <CardDescription>Items for sales order</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setViewingOrderItems(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Color</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item) => (
                    <TableRow key={item.so_item_id}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.size || "-"}</TableCell>
                      <TableCell>{item.color || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Sales Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Sales Orders</CardTitle>
            <CardDescription>List of all sales orders in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SO Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Target Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesOrders.map((order) => (
                  <TableRow key={order.so_id}>
                    <TableCell className="font-medium">{order.so_number}</TableCell>
                    <TableCell>{order.customers?.customer_name || "N/A"}</TableCell>
                    <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(order.target_delivery_date).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchOrderItems(order.so_id)}
                        >
                          View Items
                        </Button>
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
                          onClick={() => handleDelete(order.so_id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {salesOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No sales orders found. Click &ldquo;Create Sales Order&rdquo; to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}