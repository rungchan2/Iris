'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Plus, Loader2 } from 'lucide-react'
import { getPaymentsNeedingSettlement, createSettlementItems } from '@/lib/actions/settlements'
import { formatAmount } from '@/lib/payments/toss-client'
import { toast } from 'sonner'
import { paymentLogger } from '@/lib/logger'

interface Payment {
  id: string
  order_id: string
  amount: number
  paid_at: string
  buyer_name: string
  photographer?: {
    id: string
    name: string
    email: string
  }
}

export function SettlementCreateDialog() {
  const [open, setOpen] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedPayments, setSelectedPayments] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const loadPayments = async () => {
    setLoading(true)
    try {
      const result = await getPaymentsNeedingSettlement({ limit: 50 })
      if (result.success && result.data) {
        setPayments(result.data as any)
      } else {
        toast.error(result.error || '결제 내역을 불러오는데 실패했습니다')
      }
    } catch (error) {
      paymentLogger.error('Error loading payments for settlement:', error)
      toast.error('결제 내역을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadPayments()
      setSelectedPayments([])
    }
  }, [open])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPayments(payments.map(p => p.id))
    } else {
      setSelectedPayments([])
    }
  }

  const handleSelectPayment = (paymentId: string, checked: boolean) => {
    if (checked) {
      setSelectedPayments([...selectedPayments, paymentId])
    } else {
      setSelectedPayments(selectedPayments.filter(id => id !== paymentId))
    }
  }

  const handleCreateSettlements = async () => {
    if (selectedPayments.length === 0) {
      toast.error('정산 항목을 생성할 결제를 선택해주세요')
      return
    }

    setCreating(true)
    try {
      const result = await createSettlementItems(selectedPayments)
      if (result.success) {
        toast.success(result.message || '정산 항목이 생성되었습니다')
        setOpen(false)
        // Refresh parent component
        window.location.reload()
      } else {
        toast.error(result.error || '정산 항목 생성에 실패했습니다')
      }
    } catch (error) {
      paymentLogger.error('Error creating settlement items:', error)
      toast.error('정산 항목 생성 중 오류가 발생했습니다')
    } finally {
      setCreating(false)
    }
  }

  const totalAmount = payments
    .filter(p => selectedPayments.includes(p.id))
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          정산 생성
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>정산 항목 생성</DialogTitle>
          <p className="text-sm text-muted-foreground">
            정산 항목이 없는 완료된 결제 건들을 선택하여 정산 항목을 생성합니다
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">로딩 중...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            정산 대기 중인 결제 건이 없습니다
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedPayments.length === payments.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium">
                    전체 선택 ({selectedPayments.length}/{payments.length})
                  </Label>
                </div>
                {selectedPayments.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    선택 금액: <span className="font-semibold text-foreground">{formatAmount(totalAmount)}</span>
                  </div>
                )}
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>주문번호</TableHead>
                      <TableHead>작가</TableHead>
                      <TableHead>구매자</TableHead>
                      <TableHead>결제금액</TableHead>
                      <TableHead>결제일시</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPayments.includes(payment.id)}
                            onCheckedChange={(checked) =>
                              handleSelectPayment(payment.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{payment.order_id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.photographer?.name || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">{payment.photographer?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{payment.buyer_name}</TableCell>
                        <TableCell className="font-medium">{formatAmount(payment.amount)}</TableCell>
                        <TableCell>
                          {new Date(payment.paid_at).toLocaleString('ko-KR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={creating}
              >
                취소
              </Button>
              <Button
                onClick={handleCreateSettlements}
                disabled={selectedPayments.length === 0 || creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  `${selectedPayments.length}건 정산 항목 생성`
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
