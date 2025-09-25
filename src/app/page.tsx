import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              GarmentFlow
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Production Process Tracking System
            </p>
            <p className="text-lg mb-12 max-w-3xl mx-auto text-blue-50">
              Digitize and track your entire garment production workflow from sales order to final delivery.
              Gain real-time visibility, improve efficiency, and make data-driven decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  View Dashboard
                </Button>
              </Link>
              <Link href="/sales-orders">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  Create Sales Order
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Complete Production Workflow Management
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Streamline your garment production with our comprehensive tracking system
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📋 Sales Order Management
                </CardTitle>
                <CardDescription>
                  Create and manage customer orders with detailed specifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Customer information management</li>
                  <li>• Product specifications tracking</li>
                  <li>• Order status monitoring</li>
                  <li>• Delivery date planning</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🏭 Production Tracking
                </CardTitle>
                <CardDescription>
                  Monitor work orders through each production stage in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Stage-by-stage progress tracking</li>
                  <li>• Real-time status updates</li>
                  <li>• Production timeline monitoring</li>
                  <li>• Bottleneck identification</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔍 Quality Control
                </CardTitle>
                <CardDescription>
                  Record and analyze quality inspection results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Pass/Repair/Reject tracking</li>
                  <li>• Quality metrics analysis</li>
                  <li>• Inspection history logging</li>
                  <li>• Performance reporting</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Analytics & Reports
                </CardTitle>
                <CardDescription>
                  Generate comprehensive production performance reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Production cycle time analysis</li>
                  <li>• Quality performance metrics</li>
                  <li>• On-time delivery tracking</li>
                  <li>• CSV export capabilities</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  👥 Role-Based Access
                </CardTitle>
                <CardDescription>
                  Manage user permissions by department and role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Sales, PPIC, Production roles</li>
                  <li>• Warehouse and QC access</li>
                  <li>• Management dashboards</li>
                  <li>• Secure data management</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🚀 Real-Time Updates
                </CardTitle>
                <CardDescription>
                  Live status updates and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Live order status tracking</li>
                  <li>• Production stage updates</li>
                  <li>• Instant notifications</li>
                  <li>• Real-time analytics</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Production Stages */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Production Workflow Stages
            </h2>
            <p className="text-lg text-gray-600">
              Track every step of your garment production process
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {[
              { stage: "PPIC", icon: "📝", color: "bg-blue-100 text-blue-800" },
              { stage: "Material Prep", icon: "🧵", color: "bg-purple-100 text-purple-800" },
              { stage: "Cutting", icon: "✂️", color: "bg-green-100 text-green-800" },
              { stage: "Sewing", icon: "🧵", color: "bg-yellow-100 text-yellow-800" },
              { stage: "Finishing", icon: "🎨", color: "bg-orange-100 text-orange-800" },
              { stage: "QC", icon: "🔍", color: "bg-red-100 text-red-800" },
              { stage: "Ready", icon: "📦", color: "bg-indigo-100 text-indigo-800" },
              { stage: "Delivered", icon: "🚚", color: "bg-gray-100 text-gray-800" },
            ].map((item, index) => (
              <div key={item.stage} className="text-center">
                <div className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center text-2xl ${item.color}`}>
                  {item.icon}
                </div>
                <div className="text-sm font-medium text-gray-900">{item.stage}</div>
                <div className="text-xs text-gray-500">Stage {index + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Production Process?
          </h2>
          <p className="text-lg mb-8 text-gray-300">
            Get started with GarmentFlow today and experience the power of digital production tracking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sales-orders">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 GarmentFlow. Production Process Tracking System.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
