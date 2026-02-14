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
  
  const maxMonths = 600; // Increased safety limit for very long terms or small extra payments
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

    // Recalculate minimum EMI if principal changed OR rate changed
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
         emi: Math.max(currentEmi, fullEmiAtStart),
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
    
    // User wants to pay at least fullEmiAtStart if provided, or the calculated currentEmi
    let emiToPay = Math.max(currentEmi, fullEmiAtStart);
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
    
    // Total extra is manual extra + whatever extra from fullEmiAtStart over currentEmi
    let systemicExtra = 0;
    if (fullEmiAtStart > currentEmi && currentEmi > 0) {
      systemicExtra = fullEmiAtStart - currentEmi;
    }

    let totalPrincipalReduction = principalPaid + manualExtraAmount;
    
    if (totalPrincipalReduction > currentPrincipal) {
      totalPrincipalReduction = currentPrincipal;
      // Adjust principalPaid vs extra for reporting
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
      emi: emiToPay,
      interest,
      principalPaid,
      extraPaid: manualExtraAmount + (emiToPay > currentEmi ? (emiToPay - Math.max(currentEmi, interest)) : 0),
      closingPrincipal,
      phase: currentPhaseIndex,
      rate: currentInterestRate
    });

    totalInterest += interest;
    totalExtraPaid += schedule[schedule.length - 1].extraPaid;
    currentPrincipal = closingPrincipal;
    currentDate = monthEndDate;

    // After principal reduction, standard behavior is to keep EMI and reduce term.
    // If we wanted to keep term, we'd recalculate currentEmi here. 
    // The user's request "reduce the term" implies we should NOT recalculate minimum EMI to keep the end date,
    // but rather keep the EMI higher and let it finish early.
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
