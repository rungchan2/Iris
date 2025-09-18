import PaymentFailClient from './payment-fail-client';

export default async function PaymentFailPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams
  const code = (params.code as string) || undefined;
  const message = (params.message as string) || undefined;
  const orderId = (params.orderId as string) || undefined;

  return (
    <PaymentFailClient code={code} message={message} orderId={orderId} />
  );
}
