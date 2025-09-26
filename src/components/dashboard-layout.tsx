"use client";

import { ReactNode } from "react";
import { Sidebar, MobileSidebar } from "./sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r bg-background md:flex">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-col md:ml-64">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
          <MobileSidebar />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="font-semibold">GarmentFlow</h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}