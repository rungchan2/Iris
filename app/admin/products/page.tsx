import { getProducts, getApprovedPhotographers } from '@/lib/actions/products'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'
import ProductsManagementClient from '@/components/admin/products/products-management-client'

export default async function ProductsPage() {
  // Fetch data on the server
  const [productsResult, photographersResult] = await Promise.all([
    getProducts(),
    getApprovedPhotographers(),
  ])

  const initialProducts = productsResult.success ? productsResult.data || [] : []
  const initialPhotographers = photographersResult.success ? photographersResult.data || [] : []

  return (
    <div className="space-y-6">
      <AdminBreadcrumb />
      <ProductsManagementClient
        initialProducts={initialProducts}
        initialPhotographers={initialPhotographers}
      />
    </div>
  )
}
