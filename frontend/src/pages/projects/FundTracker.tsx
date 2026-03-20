import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useFunds } from '../../hooks/useFunds';
import { useFinancialRunway } from '../../hooks/useFinancialRunway';
import { formatDate } from '../../helpers';
import { formatCurrency } from '@/lib/presentation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FundTrackerProps {
  projectId: string;
  estimatedBudget?: number;
  startDate?: string;
}

const FundTracker: React.FC<FundTrackerProps> = ({ projectId, estimatedBudget, startDate }) => {
  const { summary, transactions, fetchFundSummary, fetchTransactions, createTransaction, loading, error } = useFunds();
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [type, setType] = useState<'Credit' | 'Expenditure'>('Credit');
  const runwayInfo = useFinancialRunway(summary, startDate);

  useEffect(() => {
    void fetchFundSummary(projectId);
    void fetchTransactions(projectId);
  }, [projectId, fetchFundSummary, fetchTransactions]);

  const handleAddTransaction = async () => {
    if (!amount || !purpose.trim()) {
      toast.error('Add the amount and purpose first.');
      return;
    }

    const result = await createTransaction(projectId, type, parseFloat(amount), purpose);
    if (result) {
      toast.success('Transaction recorded.');
      setAmount('');
      setPurpose('');
      void fetchFundSummary(projectId);
      void fetchTransactions(projectId);
    } else {
      toast.error('Unable to record the transaction.');
    }
  };

  const utilization = summary?.utilization_percent ?? 0;

  return (
    <div className="page-grid">
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Funding overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {estimatedBudget !== undefined && (
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Estimated budget</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(estimatedBudget)}</p>
            </div>
          )}
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Allocated</p>
            <p className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(summary?.Credit)}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Spent</p>
            <p className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(summary?.Expenditure)}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Utilization</p>
            <p className="mt-2 text-xl font-semibold text-foreground">{utilization}%</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Runway and new transaction</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Runway</p>
              <p className="mt-2 text-sm text-foreground">
                {runwayInfo && runwayInfo.daysLeft !== Infinity
                  ? `${runwayInfo.daysLeft} days remaining`
                  : 'Runway unavailable'}
              </p>
              {runwayInfo?.exhaustedDate && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Estimated depletion date: {formatDate(runwayInfo.exhaustedDate)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Utilization</span>
                <span>{utilization}%</span>
              </div>
              <Progress value={utilization} className="h-2" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(value) => setType(value as 'Credit' | 'Expenditure')}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit">Credit</SelectItem>
                    <SelectItem value="Expenditure">Expenditure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label>Purpose</Label>
                <Input value={purpose} onChange={(event) => setPurpose(event.target.value)} className="h-11 rounded-xl" />
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button onClick={handleAddTransaction} disabled={loading} className="rounded-xl">
              {loading ? 'Saving…' : 'Add transaction'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Transaction history</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-sm text-muted-foreground">
              No transactions have been recorded yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Purpose</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>{transaction.purpose}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FundTracker;
