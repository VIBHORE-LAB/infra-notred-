import { useMemo } from 'react';

export interface RunwayInfo {
    daysLeft: number;
    exhaustedDate: Date | null;
    burnRatePerDay: number;
}

export const useFinancialRunway = (summary: any, startDate?: string): RunwayInfo | null => {
    return useMemo(() => {
        if (!summary || !summary.Expenditure || !startDate) return null;

        const start = new Date(startDate);
        const now = new Date();
        const daysElapsed = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

        const burnRatePerDay = summary.Expenditure / daysElapsed;
        const remainingFunds = (summary.Credit || 0) - summary.Expenditure;

        if (burnRatePerDay <= 0) return { daysLeft: Infinity, exhaustedDate: null, burnRatePerDay: 0 };

        const daysLeft = Math.floor(remainingFunds / burnRatePerDay);
        const exhaustedDate = new Date();
        exhaustedDate.setDate(now.getDate() + daysLeft);

        return { daysLeft, exhaustedDate, burnRatePerDay };
    }, [summary, startDate]);
};
