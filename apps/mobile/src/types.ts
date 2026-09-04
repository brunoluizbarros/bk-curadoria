// Espelha as respostas JSON de apps/web/src/app/api/mobile/*
// Datas chegam como string ISO (serializadas pelo NextResponse.json), não Date.

export type OrderStatus = "draft" | "sent" | "returned" | "paid" | "cancelled";

export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface OrderCustomerSummary {
  id: string;
  name: string;
  phone: string;
}

export interface OrderListItem {
  id: string;
  customerId: string;
  addressId: string | null;
  status: OrderStatus;
  soldAt: string;
  paidAt: string | null;
  discountCents: number;
  shippingCents: number;
  creditAppliedCents: number;
  notes: string | null;
  customer: OrderCustomerSummary;
  total: number;
  itemCount: number;
}

export interface OrdersResponse {
  items: OrderListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  document: string | null;
  notes: string | null;
}

export interface Address {
  id: string;
  label: string | null;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
}

export interface OrderItemProduct {
  id: string;
  name: string;
  color: string;
  firstImage: { url: string } | null;
}

export interface OrderItem {
  id: string;
  productId: string;
  unitPriceCents: number;
  discountCents: number;
  quantity: number;
  status: "kept" | "returned";
  product: OrderItemProduct;
}

export type PaymentMethod = "pix" | "credit_card" | "debit_card" | "cash" | "transfer";

export interface Payment {
  id: string;
  method: PaymentMethod;
  brand: string | null;
  installments: number;
  grossCents: number;
  feeCents: number;
  netCents: number;
  paidAt: string;
  settledAt: string | null;
}

export interface OrderDetail extends Omit<OrderListItem, "customer" | "itemCount"> {
  customer: Customer;
  address: Address | null;
  items: OrderItem[];
  payments: Payment[];
}

export interface DREMonth {
  year: number;
  month: number;
  revenue: {
    totalGrossCents: number;
    byMethod: Record<string, number>;
  };
  cardFeesCents: number;
  expenses: {
    totalCents: number;
    byCategory: { name: string; totalCents: number }[];
  };
  resultCents: number;
}
