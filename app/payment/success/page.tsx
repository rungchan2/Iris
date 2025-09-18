import PaymentSuccessClient from './payment-success-client';

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams
  const paymentKey = (params.paymentKey as string) || undefined;
  const orderId = (params.orderId as string) || undefined;
  const amount = (params.amount as string) || undefined;

  return (
    <PaymentSuccessClient paymentKey={paymentKey} orderId={orderId} amount={amount} />
  );
}
