import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountView } from "@/features/account/components/account-view";
import { listCustomerOrders } from "@/features/account/queries";
import { getCustomer } from "@/lib/auth/customer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const customer = await getCustomer();
  if (!customer) redirect("/account/sign-in?next=/account");

  const orders = await listCustomerOrders(customer.email);

  return (
    <AccountView name={customer.name} email={customer.email} orders={orders} />
  );
}
