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
  emi: number; // Actual payment made
  theoreticalEmi: number; // The "Current EMI" based on balance/tenure
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
  extraPayments: ExtraPayment[] = [],
  fullEmiAtStart: number = 0
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
  
  const maxMonths = 600; 
  let currentMinEmi = 0;
  
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

    // Recalculate minimum EMI if principal changed OR rate changed
    if (principalChanged || rateChanged) {
       const daysRemaining = differenceInDays(loanEndDate, monthStartDate);
       const monthsRemaining = Math.max(1, daysRemaining / 30.4375);
       const monthlyRate = currentInterestRate / 12 / 100;
       
       if (currentPrincipal > 0 && monthsRemaining > 0) {
         if (monthlyRate === 0) {
           currentMinEmi = currentPrincipal / monthsRemaining;
         } else {
           const n = monthsRemaining;
           const r = monthlyRate;
           const numerator = currentPrincipal * r * Math.pow(1 + r, n);
           const denominator = Math.pow(1 + r, n) - 1;
           currentMinEmi = numerator / denominator;
         }
       } else {
         currentMinEmi = 0;
       }

       phases.push({
         phaseIndex: currentPhaseIndex++,
         startDate: monthStartDate,
         endDate: null,
         principalAtStart: currentPrincipal,
         disbursalAdded: newDisbursalAmount,
         remainingTenureMonths: monthsRemaining,
         emi: Math.max(currentMinEmi, fullEmiAtStart),
         rate: currentInterestRate
       });
       
       if (phases.length > 1) {
         phases[phases.length - 2].endDate = monthStartDate;
       }
    }

    // Stop if loan is closed
    if (currentPrincipal <= 0.01 && totalDisbursed > 0 && sortedDisbursals.every(d => processedDisbursals.has(d.date.getTime()))) {
      break;
    }

    const monthlyRate = currentInterestRate / 12 / 100;
    const interest = currentPrincipal * monthlyRate;
    
    let emiToPay = Math.max(currentMinEmi, fullEmiAtStart);
    let principalPaid = emiToPay - interest;
    
    // Check for explicit extra payments this month
    const monthExtraPayments = sortedExtraPayments.filter(p => 
      p.date.getTime() >= monthStartDate.getTime() && 
      p.date.getTime() < monthEndDate.getTime() &&
      !processedExtraPayments.has(p.date.getTime())
    );

    let manualExtraAmount = 0;
    monthExtraPayments.forEach(p => {
      manualExtraAmount += p.amount;
      processedExtraPayments.add(p.date.getTime());
    });

    if (principalPaid < 0) principalPaid = 0;
    
    let totalPrincipalReduction = principalPaid + manualExtraAmount;
    
    if (totalPrincipalReduction > currentPrincipal) {
      totalPrincipalReduction = currentPrincipal;
      if (manualExtraAmount > currentPrincipal) {
        manualExtraAmount = currentPrincipal;
        principalPaid = 0;
      } else {
        principalPaid = currentPrincipal - manualExtraAmount;
      }
      emiToPay = principalPaid + interest;
    }

    const closingPrincipal = currentPrincipal - totalPrincipalReduction;

    schedule.push({
      month,
      date: monthStartDate,
      openingPrincipal: currentPrincipal,
      theoreticalEmi: currentMinEmi,
      emi: emiToPay,
      interest,
      principalPaid,
      extraPaid: manualExtraAmount + (emiToPay > currentMinEmi ? (emiToPay - Math.max(currentMinEmi, interest)) : 0),
      closingPrincipal,
      phase: currentPhaseIndex,
      rate: currentInterestRate
    });

    currentPrincipal = closingPrincipal;
    totalInterest += interest;
    totalExtraPaid += schedule[schedule.length - 1].extraPaid;
    currentDate = monthEndDate;

    // Recalculate theoretical minimum EMI for next month based on reduction
    const daysRemaining = differenceInDays(loanEndDate, monthEndDate);
    const monthsRemaining = Math.max(0, daysRemaining / 30.4375);
    const r = currentInterestRate / 12 / 100;
    
    if (currentPrincipal > 0 && monthsRemaining > 0) {
      if (r === 0) {
        currentMinEmi = currentPrincipal / monthsRemaining;
      } else {
        const n = monthsRemaining;
        const numerator = currentPrincipal * r * Math.pow(1 + r, n);
        const denominator = Math.pow(1 + r, n) - 1;
        currentMinEmi = numerator / denominator;
      }
    } else if (currentPrincipal > 0) {
      currentMinEmi = currentPrincipal;
    } else {
      currentMinEmi = 0;
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
      totalAmountPaid: totalDisbursed + totalInterest,
      totalDisbursed,
      totalExtraPaid,
      closureDate: currentDate
    }
  };
}
