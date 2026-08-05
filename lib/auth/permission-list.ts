export type PermissionCategory =
  | "MENU"
  | "ACTION";

export interface PermissionItem {
  name: string;
  displayName: string;
  module: string;
  category: PermissionCategory;
  description?: string;
}

export const PERMISSIONS: PermissionItem[] = [
  /**
   * Dashboard
   */

  {
    name: "dashboard.view",
    displayName: "Dashboard",
    module: "Dashboard",
    category: "MENU",
  },

  /**
   * Products
   */

  {
    name: "products.view",
    displayName: "Products",
    module: "Products",
    category: "MENU",
  },

  {
    name: "product.create",
    displayName: "Create Product",
    module: "Products",
    category: "ACTION",
  },

  {
    name: "product.edit",
    displayName: "Edit Product",
    module: "Products",
    category: "ACTION",
  },

  {
    name: "product.delete",
    displayName: "Delete Product",
    module: "Products",
    category: "ACTION",
  },

  {
    name: "product.stock",
    displayName: "Manage Stock",
    module: "Products",
    category: "ACTION",
  },

  /**
   * Categories
   */

  {
    name: "categories.view",
    displayName: "Categories",
    module: "Categories",
    category: "MENU",
  },

  {
    name: "category.create",
    displayName: "Create Category",
    module: "Categories",
    category: "ACTION",
  },

  {
    name: "category.edit",
    displayName: "Edit Category",
    module: "Categories",
    category: "ACTION",
  },

  {
    name: "category.delete",
    displayName: "Delete Category",
    module: "Categories",
    category: "ACTION",
  },

  /**
   * Orders
   */

  {
    name: "orders.view",
    displayName: "Orders",
    module: "Orders",
    category: "MENU",
  },

  {
    name: "order.view",
    displayName: "View Orders",
    module: "Orders",
    category: "ACTION",
  },

  {
    name: "order.edit",
    displayName: "Edit Orders",
    module: "Orders",
    category: "ACTION",
  },

  {
    name: "order.cancel",
    displayName: "Cancel Orders",
    module: "Orders",
    category: "ACTION",
  },

  /**
   * Customers
   */

  {
    name: "customers.view",
    displayName: "Customers",
    module: "Customers",
    category: "MENU",
  },

  {
    name: "customer.view",
    displayName: "View Customer",
    module: "Customers",
    category: "ACTION",
  },

  {
    name: "customer.edit",
    displayName: "Edit Customer",
    module: "Customers",
    category: "ACTION",
  },

  /**
   * Partners
   */

  {
    name: "partners.view",
    displayName: "Partners",
    module: "Partners",
    category: "MENU",
  },

  {
    name: "partner.create",
    displayName: "Create Partner",
    module: "Partners",
    category: "ACTION",
  },

  {
    name: "partner.edit",
    displayName: "Edit Partner",
    module: "Partners",
    category: "ACTION",
  },

  {
    name: "partner.approve",
    displayName: "Approve Partner",
    module: "Partners",
    category: "ACTION",
  },

  {
    name: "partner.reject",
    displayName: "Reject Partner",
    module: "Partners",
    category: "ACTION",
  },

  {
    name: "partner.permissions",
    displayName: "Manage Permissions",
    module: "Partners",
    category: "ACTION",
  },

  /**
   * Reports
   */

  {
    name: "reports.view",
    displayName: "Reports",
    module: "Reports",
    category: "MENU",
  },

  {
    name: "report.sales",
    displayName: "Sales Report",
    module: "Reports",
    category: "ACTION",
  },

  {
    name: "report.products",
    displayName: "Product Report",
    module: "Reports",
    category: "ACTION",
  },

  /**
   * Settings
   */

  {
    name: "settings.view",
    displayName: "Settings",
    module: "Settings",
    category: "MENU",
  },

  {
    name: "settings.general",
    displayName: "General Settings",
    module: "Settings",
    category: "ACTION",
  },

  {
    name: "settings.payment",
    displayName: "Payment Settings",
    module: "Settings",
    category: "ACTION",
  },

  {
    name: "settings.contact",
    displayName: "Contact Settings",
    module: "Settings",
    category: "ACTION",
  },

  /**
   * Email Templates
   */

  {
    name: "email_templates.view",
    displayName: "Email Templates",
    module: "Email Templates",
    category: "MENU",
  },

  {
    name: "email_template.create",
    displayName: "Create Email Template",
    module: "Email Templates",
    category: "ACTION",
  },

  {
    name: "email_template.edit",
    displayName: "Edit Email Template",
    module: "Email Templates",
    category: "ACTION",
  },

  {
    name: "email_template.delete",
    displayName: "Delete Email Template",
    module: "Email Templates",
    category: "ACTION",
  },

  /**
   * Finance
   */

  {
    name: "finance.view",
    displayName: "Finance",
    module: "Finance",
    category: "MENU",
  },

  {
    name: "finance.manage",
    displayName: "Manage Expenses",
    module: "Finance",
    category: "ACTION",
  },

  {
    name: "transaction_charges.view",
    displayName: "Transaction Charges",
    module: "Finance",
    category: "MENU",
  },

  {
    name: "transaction_charges.create",
    displayName: "Create Charge Rule",
    module: "Finance",
    category: "ACTION",
  },

  {
    name: "transaction_charges.edit",
    displayName: "Edit Charge Rule",
    module: "Finance",
    category: "ACTION",
  },

  {
    name: "transaction_charges.delete",
    displayName: "Delete Charge Rule",
    module: "Finance",
    category: "ACTION",
  },

  /**
   * Returns
   */

  {
    name: "returns.view",
    displayName: "Returns",
    module: "Returns",
    category: "MENU",
  },

  {
    name: "return.manage",
    displayName: "Manage Returns",
    module: "Returns",
    category: "ACTION",
  },

  /**
   * Replacements
   */

  {
    name: "replacements.view",
    displayName: "Replacements",
    module: "Replacements",
    category: "MENU",
  },

  {
    name: "replacement.manage",
    displayName: "Manage Replacements",
    module: "Replacements",
    category: "ACTION",
  },

  /**
   * Balance Sheet
   */

  {
    name: "balance_sheet.view",
    displayName: "Balance Sheet",
    module: "Balance Sheet",
    category: "MENU",
  },

  {
    name: "balance_sheet.download",
    displayName: "Download Balance Sheet",
    module: "Balance Sheet",
    category: "ACTION",
  },

  /**
   * Admin Only
   */

  {
    name: "admin.permissions",
    displayName: "Manage Permissions",
    module: "Administration",
    category: "ACTION",
  },

  {
    name: "admin.approval",
    displayName: "Approve Users",
    module: "Administration",
    category: "ACTION",
  },
];