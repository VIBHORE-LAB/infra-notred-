import { useState, useCallback } from "react";
import instance from "../api/api";

export interface FundSummary {
  Credit: number;
  Expenditure: number;
  utilization_percent: number;
}

export interface FundTransaction {
  id: string;
  projectId: string;
  type: "Credit" | "Expenditure";
  amount: number;
  purpose: string;
  date: string;
}

function getHeaders() {
  const companyCode = localStorage.getItem("companyCode") ?? "";
  return { "x-company-code": companyCode };
}

export const useFunds = () => {
  const [summary, setSummary] = useState<FundSummary | null>(null);
  const [transactions, setTransactions] = useState<FundTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFundSummary = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await instance.get(`/funds/fund_summary/${projectId}`, { headers: getHeaders() });
      const data = res.data?.data as FundSummary;
      setSummary(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to fetch fund summary");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await instance.get(`/funds/funds_project/${projectId}`, { headers: getHeaders() });
      const txns = res.data?.data?.transactions as FundTransaction[];
      setTransactions(txns);
      return txns;
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to fetch transactions");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTransaction = useCallback(async (projectId: string, type: "Credit" | "Expenditure", amount: number, purpose: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await instance.post(
        "/funds/create",
        {
          req: { signature: "create_fund_transaction" },
          payload: { projectId, type, amount, purpose }
        },
        { headers: getHeaders() }
      );
      return res.data?.data;
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to create transaction");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { summary, transactions, loading, error, fetchFundSummary, fetchTransactions, createTransaction };
};
