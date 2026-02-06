import { addMonths, differenceInDays, addDays, format } from "date-fns";

export interface Disbursal {
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
  closingPrincipal: number;
  phase?: number;
}

export interface PhaseInfo {
  phaseIndex: number;
  startDate: Date;
  endDate: Date | null;
  principalAtStart: number;
  disbursalAdded: number;
  remainingTenureMonths: number;
  emi: number;
}

export interface CalculationResult {
  schedule: EMIPayment[];
  phases: PhaseInfo[];
  summary: {
    totalInterest: number;
    totalAmountPaid: number;
    totalDisbursed: number;
    closureDate: Date;
  };
}

export function calculateLoan(
  totalLoanApproved: number,
  loanTenureYears: number,
  interestRateAnnual: number,
  startDate: Date,
  disbursals: Disbursal[]
): CalculationResult {
  const sortedDisbursals = [...disbursals].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // Core params
  const monthlyRate = interestRateAnnual / 12 / 100;
  // Loan end date is fixed from start date
  const loanEndDate = addMonths(startDate, loanTenureYears * 12);
  
  let currentDate = new Date(startDate);
  let currentPrincipal = 0;
  let currentPhaseIndex = 0;
  
  const schedule: EMIPayment[] = [];
  const phases: PhaseInfo[] = [];

  // Helper to find next disbursal after a given date
  const getNextDisbursal = (afterDate: Date) => {
    return sortedDisbursals.find(d => d.date.getTime() > afterDate.getTime());
  };

  // We iterate month by month until loan is paid off or we hit a safety limit (e.g. 50 years)
  // Or simply until loan end date if strictly following tenure
  
  // Actually, standard logic: iterate month by month.
  // Before calculating EMI for the month, check if a disbursal happened.
  
  let totalInterest = 0;
  let totalDisbursed = 0;
  
  // Initialize with first disbursal if it exists at start date
  // Usually disbursals happen on specific dates.
  // We'll advance time month by month.
  
  const maxMonths = loanTenureYears * 12 + 120; // Safety buffer
  
  let currentEmi = 0;
  
  // Track processed disbursals to avoid double counting
  const processedDisbursals = new Set<number>();

  for (let month = 1; month <= maxMonths; month++) {
    const monthStartDate = currentDate;
    const monthEndDate = addMonths(monthStartDate, 1);
    
    // Check for disbursals in this month window (inclusive start, exclusive end)
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

    // Recalculate EMI if principal changed or it's the very first month
    if (principalChanged) {
       // Calculate remaining tenure from NOW until loanEndDate
       const daysRemaining = differenceInDays(loanEndDate, monthStartDate);
       const monthsRemaining = Math.max(1, daysRemaining / 30.4375); // Approx days per month
       
       if (currentPrincipal > 0) {
         // Standard EMI Formula: P * r * (1+r)^n / ((1+r)^n - 1)
         const r = monthlyRate;
         const n = monthsRemaining;
         
         if (r === 0) {
           currentEmi = currentPrincipal / n;
         } else {
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
         endDate: null, // Will update when next phase starts
         principalAtStart: currentPrincipal,
         disbursalAdded: newDisbursalAmount,
         remainingTenureMonths: monthsRemaining,
         emi: currentEmi
       });
       
       // Close previous phase
       if (phases.length > 1) {
         phases[phases.length - 2].endDate = monthStartDate;
       }
    }

    if (currentPrincipal <= 10 && totalDisbursed > 0 && sortedDisbursals.every(d => processedDisbursals.has(d.date.getTime()))) {
      // Loan closed
      break;
    }

    // Monthly Calculation
    const interest = currentPrincipal * monthlyRate;
    let principalPaid = currentEmi - interest;
    
    // Safety check: last payment adjustment
    if (principalPaid > currentPrincipal) {
      principalPaid = currentPrincipal;
      // Adjust EMI for last month
      currentEmi = principalPaid + interest; 
    }

    const closingPrincipal = currentPrincipal - principalPaid;

    schedule.push({
      month,
      date: monthStartDate,
      openingPrincipal: currentPrincipal,
      emi: currentEmi,
      interest,
      principalPaid,
      closingPrincipal,
      phase: currentPhaseIndex
    });

    totalInterest += interest;
    currentPrincipal = closingPrincipal;
    currentDate = monthEndDate;
  }

  // Close the last phase
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
      closureDate: currentDate
    }
  };
}
