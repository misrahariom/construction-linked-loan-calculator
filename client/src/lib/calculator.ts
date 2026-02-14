import { addMonths, differenceInDays, addDays, format, isBefore, isSameDay } from "date-fns";

export interface Disbursal {
  date: Date;
  amount: number;
}

export interface InterestRateChange {
  date: Date;
  rate: number;
}

export interface ExtraPayment {
  date: Date;
  amount: number;
}

export interface EMIPayment {
  month: number;
  date: Date;
  openingPrincipal: number;
  emi: number;
  interest: number;
  principalPaid: number;
  extraPaid: number;
  closingPrincipal: number;
  phase?: number;
  rate?: number;
}

export interface PhaseInfo {
  phaseIndex: number;
  startDate: Date;
  endDate: Date | null;
  principalAtStart: number;
  disbursalAdded: number;
  remainingTenureMonths: number;
  emi: number;
  rate: number;
}

export interface CalculationResult {
  schedule: EMIPayment[];
  phases: PhaseInfo[];
  summary: {
    totalInterest: number;
    totalAmountPaid: number;
    totalDisbursed: number;
    totalExtraPaid: number;
    closureDate: Date;
  };
}

export function calculateLoan(
  totalLoanApproved: number,
  loanTenureYears: number,
  initialInterestRate: number,
  startDate: Date,
  disbursals: Disbursal[],
  interestRateChanges: InterestRateChange[] = [],
  extraPayments: ExtraPayment[] = []
): CalculationResult {
  const sortedDisbursals = [...disbursals].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const sortedRateChanges = [...interestRateChanges].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const sortedExtraPayments = [...extraPayments].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const loanEndDate = addMonths(startDate, loanTenureYears * 12);
  
  let currentDate = new Date(startDate);
  let currentPrincipal = 0;
  let currentPhaseIndex = 0;
  let currentInterestRate = initialInterestRate;
  
  const schedule: EMIPayment[] = [];
  const phases: PhaseInfo[] = [];

  let totalInterest = 0;
  let totalDisbursed = 0;
  let totalExtraPaid = 0;
  
  const maxMonths = loanTenureYears * 12 + 120;
  let currentEmi = 0;
  
  const processedDisbursals = new Set<number>();
  const processedRateChanges = new Set<number>();
  const processedExtraPayments = new Set<number>();

  for (let month = 1; month <= maxMonths; month++) {
    const monthStartDate = currentDate;
    const monthEndDate = addMonths(monthStartDate, 1);
    
    // Check for rate changes
    const monthRateChanges = sortedRateChanges.filter(r => 
      r.date.getTime() >= monthStartDate.getTime() && 
      r.date.getTime() < monthEndDate.getTime() &&
      !processedRateChanges.has(r.date.getTime())
    );

    let rateChanged = false;
    if (monthRateChanges.length > 0) {
      const lastChange = monthRateChanges[monthRateChanges.length - 1];
      currentInterestRate = lastChange.rate;
      monthRateChanges.forEach(r => processedRateChanges.add(r.date.getTime()));
      rateChanged = true;
    }

    // Check for disbursals
    const monthDisbursals = sortedDisbursals.filter(d => 
      d.date.getTime() >= monthStartDate.getTime() && 
      d.date.getTime() < monthEndDate.getTime() &&
      !processedDisbursals.has(d.date.getTime())
    );

    let principalChanged = false;
    let newDisbursalAmount = 0;

    if (monthDisbursals.length > 0) {
      monthDisbursals.forEach(d => {
        currentPrincipal += d.amount;
        totalDisbursed += d.amount;
        newDisbursalAmount += d.amount;
        processedDisbursals.add(d.date.getTime());
      });
      principalChanged = true;
    }

    // Recalculate EMI if principal changed OR rate changed
    if (principalChanged || rateChanged) {
       const daysRemaining = differenceInDays(loanEndDate, monthStartDate);
       const monthsRemaining = Math.max(1, daysRemaining / 30.4375);
       const monthlyRate = currentInterestRate / 12 / 100;
       
       if (currentPrincipal > 0 && monthsRemaining > 0) {
         if (monthlyRate === 0) {
           currentEmi = currentPrincipal / monthsRemaining;
         } else {
           const n = monthsRemaining;
           const r = monthlyRate;
           const numerator = currentPrincipal * r * Math.pow(1 + r, n);
           const denominator = Math.pow(1 + r, n) - 1;
           currentEmi = numerator / denominator;
         }
       } else {
         currentEmi = 0;
       }

       phases.push({
         phaseIndex: currentPhaseIndex++,
         startDate: monthStartDate,
         endDate: null,
         principalAtStart: currentPrincipal,
         disbursalAdded: newDisbursalAmount,
         remainingTenureMonths: monthsRemaining,
         emi: currentEmi,
         rate: currentInterestRate
       });
       
       if (phases.length > 1) {
         phases[phases.length - 2].endDate = monthStartDate;
       }
    }

    // Stop if loan is closed
    if (currentPrincipal <= 10 && totalDisbursed > 0 && sortedDisbursals.every(d => processedDisbursals.has(d.date.getTime()))) {
      break;
    }

    const monthlyRate = currentInterestRate / 12 / 100;
    const interest = currentPrincipal * monthlyRate;
    let principalPaid = currentEmi - interest;
    
    // Check for extra payments this month
    const monthExtraPayments = sortedExtraPayments.filter(p => 
      p.date.getTime() >= monthStartDate.getTime() && 
      p.date.getTime() < monthEndDate.getTime() &&
      !processedExtraPayments.has(p.date.getTime())
    );

    let monthExtraAmount = 0;
    monthExtraPayments.forEach(p => {
      monthExtraAmount += p.amount;
      processedExtraPayments.add(p.date.getTime());
    });

    if (principalPaid < 0) principalPaid = 0;
    
    let totalPrincipalReduction = principalPaid + monthExtraAmount;
    
    if (totalPrincipalReduction > currentPrincipal) {
      totalPrincipalReduction = currentPrincipal;
      // Adjust EMI/Interest split if needed, but for extra payments we mostly care about principal reduction
      if (monthExtraAmount > currentPrincipal) {
        monthExtraAmount = currentPrincipal;
        principalPaid = 0;
      } else {
        principalPaid = currentPrincipal - monthExtraAmount;
      }
      currentEmi = principalPaid + interest;
    }

    const closingPrincipal = currentPrincipal - totalPrincipalReduction;

    schedule.push({
      month,
      date: monthStartDate,
      openingPrincipal: currentPrincipal,
      emi: currentEmi,
      interest,
      principalPaid,
      extraPaid: monthExtraAmount,
      closingPrincipal,
      phase: currentPhaseIndex,
      rate: currentInterestRate
    });

    totalInterest += interest;
    totalExtraPaid += monthExtraAmount;
    currentPrincipal = closingPrincipal;
    currentDate = monthEndDate;

    // After an extra payment, the EMI might need recalculation if we want to maintain tenure,
    // but standard behavior is usually to maintain EMI and reduce tenure.
    // However, the rule says "EMI is calculated on outstanding principal".
    // If we want to maintain the loan end date, we MUST recalculate EMI after extra payment too.
    if (monthExtraAmount > 0) {
      const daysRemaining = differenceInDays(loanEndDate, monthEndDate);
      const monthsRemaining = Math.max(0, daysRemaining / 30.4375);
      const r = currentInterestRate / 12 / 100;
      
      if (currentPrincipal > 0 && monthsRemaining > 0) {
        if (r === 0) {
          currentEmi = currentPrincipal / monthsRemaining;
        } else {
          const n = monthsRemaining;
          const numerator = currentPrincipal * r * Math.pow(1 + r, n);
          const denominator = Math.pow(1 + r, n) - 1;
          currentEmi = numerator / denominator;
        }
      } else if (currentPrincipal > 0) {
        currentEmi = currentPrincipal; // Pay off in last fraction
      } else {
        currentEmi = 0;
      }
    }
  }

  if (phases.length > 0) {
    phases[phases.length - 1].endDate = currentDate;
  }

  return {
    schedule,
    phases,
    summary: {
      totalInterest,
      totalAmountPaid: totalDisbursed + totalInterest + totalExtraPaid,
      totalDisbursed,
      totalExtraPaid,
      closureDate: currentDate
    }
  };
}
