"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Users, UserPlus, Mail, Phone, Building, Calendar } from "lucide-react";

interface Customer {
  customer_id: number;
  customer_name: string;
  contact_person: string;
  email: string;
  phone_number: string;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const supabase = createClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    customer_name: "",
    contact_person: "",
    email: "",
    phone_number: ""
  });

  const fetchCustomers = useCallback(async () => {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order("customer_name");

    if (data) setCustomers(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCustomer) {
        // Update existing customer
        const { error } = await supabase
          .from("customers")
          .update(formData)
          .eq("customer_id", editingCustomer.customer_id);

        if (error) throw error;

        toast({
          title: "Customer updated",
          description: `${formData.customer_name} has been updated successfully.`,
        });
      } else {
        // Create new customer - exclude customer_id as it should auto-generate
        const { error } = await supabase
          .from("customers")
          .insert([{
            customer_name: formData.customer_name,
            contact_person: formData.contact_person,
            email: formData.email,
            phone_number: formData.phone_number
          }])
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Customer created",
          description: `${formData.customer_name} has been added successfully.`,
        });
      }

      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
      toast({
        title: "Error",
        description: "Failed to save customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      customer_name: customer.customer_name,
      contact_person: customer.contact_person,
      email: customer.email,
      phone_number: customer.phone_number
    });
    setShowForm(true);
  };

  const handleDelete = async (customerId: number) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        const { error } = await supabase
          .from("customers")
          .delete()
          .eq("customer_id", customerId);

        if (error) throw error;

        toast({
          title: "Customer deleted",
          description: "Customer has been removed successfully.",
        });

        fetchCustomers();
      } catch (error) {
        console.error("Error deleting customer:", error);
        toast({
          title: "Error",
          description: "Failed to delete customer. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: "",
      contact_person: "",
      email: "",
      phone_number: ""
    });
    setEditingCustomer(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading customers...</p>
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
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                  <p className="text-gray-600 text-sm">Manage customer information and contacts</p>
                </div>
              </div>
            </div>
            <Button onClick={() => setShowForm(true)} className="h-10 bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Customer
            </Button>
          </div>

        {/* Customer Form */}
        {showForm && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingCustomer ? "Edit Customer" : "Add New Customer"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {editingCustomer ? "Update customer information" : "Enter customer details"}
                  </p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name" className="text-gray-700">Customer Name *</Label>
                    <div className="mt-1">
                      <Input
                        id="customer_name"
                        required
                        value={formData.customer_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                        placeholder="Enter customer name"
                        className="border-gray-200"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contact_person" className="text-gray-700">Contact Person</Label>
                    <div className="mt-1">
                      <Input
                        id="contact_person"
                        value={formData.contact_person}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                        placeholder="Enter contact person name"
                        className="border-gray-200"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-700">Email</Label>
                    <div className="mt-1">
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email address"
                        className="border-gray-200"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone_number" className="text-gray-700">Phone Number</Label>
                    <div className="mt-1">
                      <Input
                        id="phone_number"
                        value={formData.phone_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                        placeholder="Enter phone number"
                        className="border-gray-200"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm} className="h-10 border-gray-200 hover:bg-gray-50">
                    Cancel
                  </Button>
                  <Button type="submit" className="h-10 bg-blue-600 hover:bg-blue-700">
                    {editingCustomer ? "Update Customer" : "Add Customer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Customers Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">Total</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
                <div className="text-sm text-gray-600">Total Customers</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-green-600" />
                </div>
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">Contact</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-900">{customers.filter(c => c.email).length}</div>
                <div className="text-sm text-gray-600">With Email</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5 text-purple-600" />
                </div>
                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">Phone</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-900">{customers.filter(c => c.phone_number).length}</div>
                <div className="text-sm text-gray-600">With Phone</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customers Table */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">All Customers</h3>
                <p className="text-sm text-gray-600">List of all registered customers in the system</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Building className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-gray-700">Customer Name</TableHead>
                    <TableHead className="text-gray-700">Contact Person</TableHead>
                    <TableHead className="text-gray-700">Email</TableHead>
                    <TableHead className="text-gray-700">Phone</TableHead>
                    <TableHead className="text-gray-700">Created</TableHead>
                    <TableHead className="text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.customer_id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          {customer.customer_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {customer.contact_person ? (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-gray-400" />
                            {customer.contact_person}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {customer.email ? (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {customer.email}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {customer.phone_number ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {customer.phone_number}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {new Date(customer.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(customer)}
                            className="h-8 border-gray-200 hover:bg-gray-50"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(customer.customer_id)}
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

              {customers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No customers found. Click &quot;Add Customer&quot; to get started.
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