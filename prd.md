---

### **Product Requirements Document: Production Process Tracking System (GarmentFlow)**

**Version:** 1.0
**Date:** September 25, 2025
**Author:** Gemini
**Status:** Draft

---

### **1. Introduction and Purpose**

**GarmentFlow** is a web-based information system designed to digitize and track the entire production workflow in the garment industry. This system monitors the movement of an order from its initial creation by the Sales team, through planning by PPIC, execution in the Warehouse & Production floor, inspection by Quality Control (QC), storage, and final delivery.

The primary objective of this system is to provide **full transparency**, **improve operational efficiency**, and **deliver accurate, real-time data** to all stakeholders involved in the production lifecycle.

### **2. Problem Statement**

Currently, order tracking processes in the garment industry are often manual (using paper forms, spreadsheets, or verbal communication). This leads to several significant problems:

- **Lack of Visibility:** Management finds it difficult to know the precise status of an order without directly contacting each department head.
- **Information Delays:** Status updates do not occur in real-time, causing potential miscommunication and slow decision-making.
- **Difficulty in Tracking Bottlenecks:** It is challenging to identify which department is causing a delay in an order's progress.
- **Risk of Human Error:** Manual data entry can lead to errors in production, material calculation, and shipping.
- **Slow Report Generation:** Compiling production performance reports is time-consuming as data is scattered across multiple sources.

### **3. Goals & Objectives**

- **Increase Transparency:** Provide a centralized dashboard that displays the real-time status of all orders.
- **Improve Efficiency:** Reduce the time spent on manual communication and data retrieval by up to 40%.
- **Reduce Production Cycle Time:** Identify and resolve bottlenecks faster to decrease the average order completion time.
- **Minimize Errors:** Lower the rate of data and production errors caused by manual record-keeping.
- **Accelerate Reporting:** Enable management to generate production performance reports in minutes instead of days.

### **4. User Personas**

The system will be used by various roles within the company:

1.  **System Admin:** Manages user accounts, access rights, and core system settings.
2.  **Sales Staff:** Creates and manages Sales Orders (SOs) from customers.
3.  **PPIC Staff:** Converts SOs into Work Orders (WOs), plans material requirements and production schedules.
4.  **Warehouse Staff (Raw Materials & Finished Goods):** Manages material preparation and finished goods storage.
5.  **Production Head:** Updates the status of production stages (Cutting, Sewing, Finishing).
6.  **QC Staff:** Records the results of product quality inspections.
7.  **Delivery Staff:** Manages the shipping process and updates delivery statuses.
8.  **Management/Owner:** Views dashboards, monitors progress, and analyzes reports.

### **5. Features & Requirements**

#### **Module 1: Main Dashboard**

- **1.1. Order Status Summary:** Display the number of orders in each primary status (e.g., "New," "In Production," "Ready for Delivery," "Completed").
- **1.2. Delay Alerts:** Highlight orders that are approaching or have passed their target delivery date.
- **1.3. Performance Charts:** Simple data visualizations for weekly/monthly production output.

#### **Module 2: Order & Planning Management**

- **2.1. Sales Order (SO) Creation:**
  - An input form for customer data, order item details, quantity, price, and target delivery date.
  - Feature to upload design files or tech packs.
  - Each SO will be assigned a unique number automatically.
- **2.2. Work Order (WO) Creation:**
  - PPIC staff can convert an approved SO into a WO.
  - Data from the SO is auto-populated. PPIC adds technical details, Bill of Materials (BOM), and production line allocation.
  - Each WO will have a unique number linked to the original SO.

#### **Module 3: Production Tracking**

- **3.1. Centralized Tracking View:**
  - A page displaying all WOs in a table or Kanban board format (To-Do, In Progress, Done).
  - Each WO will show its current status (e.g., `With PPIC`, `Awaiting Materials`, `In Cutting`, `In Sewing`, `In QC`, `Ready to Ship`).
  - Filter and search functionality by WO number, customer name, or date.
- **3.2. Simple Status Updates:**
  - Each department head (Warehouse, Production, QC, Delivery) can easily change an order's status via a button or dropdown menu.
  - Every status change will be recorded in an order history log, complete with the timestamp and the user who made the change.

#### **Module 4: Quality Control (QC) Module**

- **4.1. QC Result Input:**
  - QC staff selects a WO that has completed production.
  - A simple form to enter the quantity of products that **Passed**, need **Repair**, or are **Rejected**.
  - A notes field to provide reasons for rejection.

#### **Module 5: Delivery Module**

- **5.1. Delivery Order Generation:**
  - The system can automatically generate a Delivery Order document from the data of a WO that has passed QC.
- **5.2. Shipping Status Updates:**
  - Delivery staff changes the status to "Shipped" and later to "Delivered."

#### **Module 6: Reporting**

- **6.1. Production Cycle Time Report:** Analyzes the average time taken to complete an order from start to finish.
- **6.2. Quality Performance Report:** Displays the percentage of products that Passed, were Repaired, or Rejected.
- **6.3. On-Time Delivery Report:** Tracks the percentage of orders shipped on schedule.
- **6.4. Data Export:** All reports can be exported to Excel or PDF format.

### **6. User Flow**

1.  **Sales:** Login -> Create a new Sales Order -> Fill in details -> Save. Order status: `New Order`.
2.  **PPIC:** Login -> View new SOs -> Open an SO -> Convert it to a Work Order (WO) -> Complete technical details & schedule -> Save. Order status: `In Planning`.
3.  **Raw Materials Warehouse:** Login -> View WOs requiring materials -> Prepare materials -> Update status. Order status: `Material Ready`.
4.  **Production Head:** Login -> View WOs ready for production -> Update status sequentially: `In Cutting` -> `In Sewing` -> `In Finishing`.
5.  **QC Staff:** Login -> View WOs that have finished production -> Perform inspection -> Input QC results. Order status: `QC Passed`.
6.  **Finished Goods Warehouse:** Login -> Receive goods from QC -> Pack and store -> Update status. Order status: `Ready for Delivery`.
7.  **Delivery Staff:** Login -> View orders ready for dispatch -> Create Delivery Order -> Ship goods -> Update status: `Shipped` -> `Delivered`.

### **7. Non-Functional Requirements**

- **Security:** The system must have user authentication and role-based access control.
- **Performance:** Pages should load quickly (< 3 seconds) to maintain user productivity.
- **Usability:** The interface must be intuitive and easy to use, even for staff less familiar with technology.
- **Scalability:** The system must be able to handle a growing number of orders and users as the company expands.

### **8. Success Metrics**

- A 15% reduction in the average order cycle time within the first 6 months.
- A 5% reduction in the product rejection rate due to faster issue identification.
- 90% user adoption rate across all relevant departments within 3 months.
- Time to generate monthly production reports reduced from days to minutes.

### **9. Out of Scope (for v1.0)**

- Full integration with accounting or financial systems.
- Advanced raw material inventory management (including procurement and supplier management).
- A customer-facing portal for self-service order tracking.
- A native mobile application (the initial version will be web-responsive).

### **10. Data Model / Database Schema**

This section outlines the database tables required to support the GarmentFlow system. The structure is designed to be relational to ensure data integrity.

---

#### **1. `users`**

Stores data for all users who can access the system.

| Column Name     | Data Type      | Description                               |
| --------------- | -------------- | ----------------------------------------- |
| `user_id`       | `INT`          | **PRIMARY KEY**, Unique ID for each user. |
| `username`      | `VARCHAR(50)`  | Username for login (must be unique).      |
| `password_hash` | `VARCHAR(255)` | Hashed password for security.             |
| `full_name`     | `VARCHAR(100)` | User's full name.                         |
| `role_id`       | `INT`          | **FOREIGN KEY** to the `roles` table.     |
| `created_at`    | `TIMESTAMP`    | Timestamp of account creation.            |

#### **2. `roles`**

Defines user roles and permissions.

| Column Name | Data Type     | Description                                        |
| ----------- | ------------- | -------------------------------------------------- |
| `role_id`   | `INT`         | **PRIMARY KEY**, Unique ID for each role.          |
| `role_name` | `VARCHAR(50)` | Name of the role (e.g., 'Sales', 'PPIC', 'Admin'). |

#### **3. `customers`**

Stores information about clients.

| Column Name      | Data Type      | Description                                   |
| ---------------- | -------------- | --------------------------------------------- |
| `customer_id`    | `INT`          | **PRIMARY KEY**, Unique ID for each customer. |
| `customer_name`  | `VARCHAR(100)` | Customer's name.                              |
| `contact_person` | `VARCHAR(100)` | Name of the contact person.                   |
| `email`          | `VARCHAR(100)` | Email address.                                |
| `phone_number`   | `VARCHAR(20)`  | Phone number.                                 |

#### **4. `sales_orders` (SO)**

The core table for recording customer orders.

| Column Name            | Data Type     | Description                                                      |
| ---------------------- | ------------- | ---------------------------------------------------------------- |
| `so_id`                | `INT`         | **PRIMARY KEY**, Unique ID for each SO.                          |
| `so_number`            | `VARCHAR(50)` | Unique SO number (e.g., SO-2025-001).                            |
| `customer_id`          | `INT`         | **FOREIGN KEY** to the `customers` table.                        |
| `order_date`           | `DATE`        | Date the order was created.                                      |
| `target_delivery_date` | `DATE`        | Target delivery date for the customer.                           |
| `status`               | `VARCHAR(50)` | Status of the SO (e.g., 'Draft', 'Approved', 'Converted to WO'). |
| `created_by_user_id`   | `INT`         | **FOREIGN KEY** to `users` (Sales staff who created it).         |

#### **5. `so_items`**

Stores the line items for each Sales Order.

| Column Name        | Data Type      | Description                                  |
| ------------------ | -------------- | -------------------------------------------- |
| `so_item_id`       | `INT`          | **PRIMARY KEY**.                             |
| `so_id`            | `INT`          | **FOREIGN KEY** to the `sales_orders` table. |
| `product_name`     | `VARCHAR(100)` | Name of the ordered product/item.            |
| `quantity`         | `INT`          | Ordered quantity.                            |
| `size`             | `VARCHAR(10)`  | Size (e.g., 'S', 'M', 'L').                  |
| `color`            | `VARCHAR(50)`  | Product color.                               |
| `design_file_path` | `VARCHAR(255)` | Path to the stored design file (if any).     |

#### **6. `work_orders` (WO)**

The primary table for production tracking, derived from an approved SO.

| Column Name             | Data Type     | Description                                              |
| ----------------------- | ------------- | -------------------------------------------------------- |
| `wo_id`                 | `INT`         | **PRIMARY KEY**, Unique ID for each WO.                  |
| `wo_number`             | `VARCHAR(50)` | Unique WO number (e.g., WO-2025-001).                    |
| `so_id`                 | `INT`         | **FOREIGN KEY** to the `sales_orders` table.             |
| `production_start_date` | `DATE`        | Planned production start date.                           |
| `production_end_date`   | `DATE`        | Planned production end date.                             |
| `current_stage_id`      | `INT`         | **FOREIGN KEY** to `production_stages` (current status). |
| `created_by_user_id`    | `INT`         | **FOREIGN KEY** to `users` (PPIC staff who created it).  |

#### **7. `production_stages`**

A master table defining all stages in the production workflow.

| Column Name      | Data Type     | Description                                                         |
| ---------------- | ------------- | ------------------------------------------------------------------- |
| `stage_id`       | `INT`         | **PRIMARY KEY**.                                                    |
| `stage_name`     | `VARCHAR(50)` | Name of the stage (e.g., 'PPIC', 'Material Prep', 'Cutting', 'QC'). |
| `sequence_order` | `INT`         | The sequence of the stage in the workflow.                          |

#### **8. `production_logs`**

A critical table that tracks the history of each Work Order.

| Column Name | Data Type   | Description                                                      |
| ----------- | ----------- | ---------------------------------------------------------------- |
| `log_id`    | `INT`       | **PRIMARY KEY**.                                                 |
| `wo_id`     | `INT`       | **FOREIGN KEY** to the `work_orders` table.                      |
| `stage_id`  | `INT`       | **FOREIGN KEY** to `production_stages` (the stage being logged). |
| `user_id`   | `INT`       | **FOREIGN KEY** to `users` (the user who updated the status).    |
| `timestamp` | `TIMESTAMP` | The exact time the status was changed.                           |
| `notes`     | `TEXT`      | Optional notes for the log entry.                                |

#### **9. `quality_control`**

Records the results of quality inspection for each WO.

| Column Name          | Data Type   | Description                                 |
| -------------------- | ----------- | ------------------------------------------- |
| `qc_id`              | `INT`       | **PRIMARY KEY**.                            |
| `wo_id`              | `INT`       | **FOREIGN KEY** to the `work_orders` table. |
| `quantity_passed`    | `INT`       | Quantity of items that passed QC.           |
| `quantity_repaired`  | `INT`       | Quantity of items needing repair.           |
| `quantity_rejected`  | `INT`       | Quantity of items that were rejected.       |
| `qc_notes`           | `TEXT`      | Notes from the QC team.                     |
| `checked_by_user_id` | `INT`       | **FOREIGN KEY** to `users` (the QC staff).  |
| `check_date`         | `TIMESTAMP` | Timestamp of the inspection.                |

#### **10. `deliveries`**

Records shipping information for finished goods.

| Column Name             | Data Type     | Description                                             |
| ----------------------- | ------------- | ------------------------------------------------------- |
| `delivery_id`           | `INT`         | **PRIMARY KEY**.                                        |
| `wo_id`                 | `INT`         | **FOREIGN KEY** to the `work_orders` table.             |
| `delivery_order_number` | `VARCHAR(50)` | The delivery order or shipping number.                  |
| `shipping_date`         | `DATE`        | The date the goods were shipped.                        |
| `status`                | `VARCHAR(50)` | Delivery status ('Shipped', 'In Transit', 'Delivered'). |
| `handled_by_user_id`    | `INT`         | **FOREIGN KEY** to `users` (the Delivery staff).        |

Excellent choice! That's a modern and powerful stack perfectly suited for building the **GarmentFlow** system as outlined in the PRD. Here’s how each part of your chosen technology fits into the project.

### ## Supabase: Your Backend and Database 🚀

Supabase will handle everything described in the **Data Model / Database Schema** section of the PRD and more.

- **PostgreSQL Database:** You can create the tables (`users`, `sales_orders`, `work_orders`, `production_logs`, etc.) exactly as designed in the PRD directly within the Supabase dashboard.
- **Authentication:** Use Supabase Auth to manage user logins. This directly implements the `users` and `roles` tables. You can easily handle sign-ups, logins, and password resets.
- **Row Level Security (RLS):** This is a killer feature for this project. You can implement the access rules from the "User Personas" section directly in the database. For example, you can create a policy that says "Only users with the 'Sales' role can create new rows in the `sales_orders` table."
- **Realtime Subscriptions:** This is perfect for the **Main Dashboard** and **Production Tracking** modules. You can subscribe to changes in the `work_orders` table so that when a Production Head updates a status, the change is reflected instantly on the manager's dashboard without needing to refresh the page.
- **Instant APIs:** Supabase automatically generates a RESTful API for your database. Your Next.js frontend can securely fetch and update data using the Supabase client library, saving you from writing a traditional backend.

### ## Next.js with TypeScript: Your Application Framework 💻

Next.js will be the core of your application, rendering the UI and handling all user interactions.

- **App Router:** You can structure your application's pages and layouts logically based on the PRD modules. For example:
  - `/dashboard`
  - `/sales-orders`
  - `/work-orders`
  - `/qc`
  - `/delivery`
- **Server Components & Server Actions:** You can fetch data directly in Server Components for fast page loads, which is great for the reporting pages. Use Server Actions to handle form submissions (like creating a new Sales Order or updating a production status), which simplifies the code and improves security.
- **TypeScript:** This is crucial for a data-heavy application. It ensures that the data you send to and receive from Supabase matches the types you expect, catching errors during development rather than in production.

### ## shadcn/ui: Your UI Components Library ✨

shadcn/ui will help you build a clean, professional, and highly functional user interface quickly, directly addressing the "Usability" non-functional requirement.

- **Component Implementation:** You can map shadcn/ui components directly to the features in the PRD:
  - **`Table`:** For displaying lists of sales orders, work orders, and reports.
  - **`Card`:** To build the summary widgets on the **Main Dashboard**.
  - **`Form`:** For creating new SOs and WOs, with validation using `zod`.
  - **`Button`:** For all actions, like "Create Order" or "Update Status."
  - **`DatePicker`:** For selecting `order_date` and `target_delivery_date`.
  - **`Dialog` / `Sheet`:** To show order details or update forms without leaving the main view.
  - **`Badge`:** To visually represent the status of an order (e.g., "In Production", "QC Passed").

Your chosen stack is a fantastic combination that enables rapid development, scalability, and a great user experience. Good luck with the project! 👍

# LOGIN SYSTEM LOGIC Using Supabase Authentification on Client Side

```ustils/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,

  );
}

```

```ustils/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Tentukan skema berdasarkan environment variable

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, // Tetap gunakan ANON_KEY
    {
      cookies: {
        // ... (kode cookies tidak berubah)
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

```

```ustils/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, // Tetap gunakan ANON_KEY
    {
      cookies: {
        // ... (kode cookies tidak berubah)
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

```
