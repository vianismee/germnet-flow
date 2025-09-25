"use client";

import { useState, useEffect, useCallback } from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading customers...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="mt-2 text-gray-600">Manage customer information and contacts</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            Add Customer
          </Button>
        </div>

        {/* Customer Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</CardTitle>
              <CardDescription>
                {editingCustomer ? "Update customer information" : "Enter customer details"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">Customer Name *</Label>
                    <Input
                      id="customer_name"
                      required
                      value={formData.customer_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                      placeholder="Enter contact person name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCustomer ? "Update Customer" : "Add Customer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Customers</CardTitle>
            <CardDescription>
              List of all registered customers in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.customer_id}>
                    <TableCell className="font-medium">{customer.customer_name}</TableCell>
                    <TableCell>{customer.contact_person || "-"}</TableCell>
                    <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell>{customer.phone_number || "-"}</TableCell>
                    <TableCell>
                      {new Date(customer.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(customer)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(customer.customer_id)}
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
                No customers found. Click &ldquo;Add Customer&rdquo; to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}