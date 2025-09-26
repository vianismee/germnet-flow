"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  FileText,
  Package,
  ShieldCheck,
  Users,
  BarChart3,
  Menu,
  ChevronLeft,
  ChevronRight,
  Home
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Production overview"
  },
  {
    name: "Sales Orders",
    href: "/sales-orders",
    icon: FileText,
    description: "Customer order management"
  },
  {
    name: "Work Orders",
    href: "/work-orders",
    icon: Package,
    description: "Production tracking"
  },
  {
    name: "Quality Control",
    href: "/quality-control",
    icon: ShieldCheck,
    description: "Inspection results"
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
    description: "Client management"
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    description: "Analytics & exports"
  }
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "flex h-full max-h-screen flex-col gap-2",
      isCollapsed && "w-16",
      className
    )}>
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Home className="h-6 w-6 text-primary" />
            <span>GarmentFlow</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-8 w-8 p-0 lg:hidden"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                      isActive && "bg-muted text-primary"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && item.name}
                  </Link>
                );
              })}
        </nav>
      </div>
      <div className="mt-auto p-4">
        {!isCollapsed && (
          <div className="space-y-2">
            <Separator />
            <div className="text-xs text-muted-foreground">
              GarmentFlow Production Management System
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold"
            onClick={() => setOpen(false)}
          >
            <Home className="mr-2 h-6 w-6 text-blue-400" />
            <span className="font-bold">GarmentFlow</span>
          </Link>
        <nav className="grid gap-2 py-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                pathname === item.href && "bg-muted text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}