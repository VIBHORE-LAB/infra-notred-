import React, { useEffect, useState } from 'react';
import { Typography, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import TextInput from '../../components/TextInput';
import Button from '../../components/Button';
import { useFunds } from '../../hooks/useFunds';
import { useFinancialRunway } from '../../hooks/useFinancialRunway';
import { formatDate } from '../../helpers';

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
  const [txSuccess, setTxSuccess] = useState(false);

  useEffect(() => {
    fetchFundSummary(projectId);
    fetchTransactions(projectId);
  }, [projectId, fetchFundSummary, fetchTransactions]);

  const handleAddTransaction = async () => {
    if (!amount || !purpose) return;
    setTxSuccess(false);

    const result = await createTransaction(projectId, type, parseFloat(amount), purpose);
    if (result) {
      setTxSuccess(true);
      setAmount('');
      setPurpose('');
      fetchFundSummary(projectId);
      fetchTransactions(projectId);
    }
  };

  const utilPercent = summary?.utilization_percent ?? 0;
  const barColor = utilPercent > 90 ? 'bg-rose-500' : utilPercent > 65 ? 'bg-amber-500' : 'bg-emerald-500';

  const runwayInfo = useFinancialRunway(summary, startDate);

  return (
    <section className="app-surface p-6 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <Typography variant="h6" className="font-semibold text-slate-900">
          Fund Allocation and Tracking
        </Typography>
        {runwayInfo && runwayInfo.daysLeft !== Infinity && (
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${runwayInfo.daysLeft < 30 ? 'bg-rose-50 border-rose-100' : 'bg-indigo-50 border-indigo-100'}`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${runwayInfo.daysLeft < 30 ? 'bg-rose-400' : 'bg-indigo-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${runwayInfo.daysLeft < 30 ? 'bg-rose-500' : 'bg-indigo-500'}`}></span>
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${runwayInfo.daysLeft < 30 ? 'text-rose-700' : 'text-indigo-700'}`}>
              Financial Runway: {runwayInfo.daysLeft} Days left
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {estimatedBudget && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <div className="text-xl font-bold text-slate-900">₹{estimatedBudget.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">Estimated Budget</div>
          </div>
        )}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
          <div className="text-xl font-bold text-blue-800">₹{(summary?.Credit ?? 0).toLocaleString()}</div>
          <div className="text-xs text-blue-700 mt-1">Total Allocated</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <div className="text-xl font-bold text-amber-800">₹{(summary?.Expenditure ?? 0).toLocaleString()}</div>
          <div className="text-xs text-amber-700 mt-1">Total Spent</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
          <div className="text-xl font-bold text-emerald-800">{utilPercent}%</div>
          <div className="text-xs text-emerald-700 mt-1">Utilization</div>
        </div>
      </div>

      {runwayInfo && runwayInfo.exhaustedDate && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between gap-4 overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Predictive Fund Exhaustion</p>
            <p className="text-lg font-semibold italic">"{runwayInfo.daysLeft < 60 ? 'Immediate capital injection advised.' : 'Spending velocity remains within nominal bounds.'}"</p>
          </div>
          <div className="text-right relative z-10">
            <p className="text-3xl font-bold text-emerald-400">{formatDate(runwayInfo.exhaustedDate)}</p>
            <p className="text-[10px] font-medium text-slate-400">Zero-Balance Forecast</p>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-[#0f5fa8]/20 to-transparent pointer-events-none"></div>
        </div>
      )}

      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Utilization Progress</span>
          <span>{utilPercent}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div className={`${barColor} h-2.5 transition-all duration-500`} style={{ width: `${Math.min(utilPercent, 100)}%` }}></div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <Typography variant="subtitle2" className="font-semibold text-slate-700 mb-3">
          Record Transaction
        </Typography>
        {txSuccess && <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-800">Transaction recorded successfully.</div>}
        {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">{error}</div>}

        <div className="flex gap-3 flex-wrap items-center">
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Type</InputLabel>
            <Select value={type} label="Type" onChange={(e) => setType(e.target.value as 'Credit' | 'Expenditure')}>
              <MenuItem value="Credit">Credit</MenuItem>
              <MenuItem value="Expenditure">Expenditure</MenuItem>
            </Select>
          </FormControl>

          <div className="min-w-52">
            <TextInput label="Amount (INR)" name="amount" type="number" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} />
          </div>
          <div className="min-w-72 flex-1">
            <TextInput label="Purpose" name="purpose" value={purpose} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPurpose(e.target.value)} />
          </div>

          <Button onClick={handleAddTransaction} variantType="primary" disabled={loading}>
            {loading ? 'Saving...' : 'Add Transaction'}
          </Button>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="overflow-x-auto">
          <Typography variant="subtitle2" className="font-semibold text-slate-700 mb-3">
            Transaction History
          </Typography>
          <table className="min-w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-2 px-3 text-left text-slate-600">Date</th>
                <th className="py-2 px-3 text-left text-slate-600">Type</th>
                <th className="py-2 px-3 text-left text-slate-600">Amount</th>
                <th className="py-2 px-3 text-left text-slate-600">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-700">{formatDate(txn.date)}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${txn.type === 'Credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                    >
                      {txn.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-900">₹{txn.amount.toLocaleString()}</td>
                  <td className="py-2 px-3 text-slate-700">{txn.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default FundTracker;
