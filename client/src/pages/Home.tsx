import { useState } from "react";
import { Link } from "wouter";
import { Calculator, History, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoanInputs, type LoanInputData } from "@/components/LoanInputs";
import { LoanResults } from "@/components/LoanResults";
import { calculateLoan, type CalculationResult } from "@/lib/calculator";
import { useCreateCalculation } from "@/hooks/use-calculations";

export default function Home() {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const { mutate: saveCalculation } = useCreateCalculation();

  const handleCalculate = (data: LoanInputData) => {
    const calcResult = calculateLoan(
      data.totalLoan,
      data.tenureYears,
      data.interestRate,
      data.startDate,
      data.disbursals,
      data.rateChanges,
      data.extraPayments,
      data.fullEmiAtStart
    );
    setResult(calcResult);
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/10">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0 mx-auto px-4 sm:px-8">
          <div className="flex gap-2 items-center text-primary">
            <Calculator className="h-6 w-6" />
            <span className="text-xl font-bold font-display tracking-tight">FinCalc</span>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-1">
              <Link href="/saved">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <History className="w-4 h-4 mr-2" /> Saved Calculations
                </Button>
              </Link>
              <Button size="icon" variant="ghost" className="sm:hidden">
                <History className="w-5 h-5" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-8 py-8">
        <div className="mb-8 text-center sm:text-left space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-display">
            Construction Linked EMI Calculator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Plan your home loan payments smartly. See how your EMI changes as the bank disburses your loan and as interest rates fluctuate.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-4 space-y-6">
            <LoanInputs onCalculate={handleCalculate} />
            
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50 flex gap-3 text-sm text-blue-800 dark:text-blue-200">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Pro Tip:</strong> Paying a "Full EMI" even during the construction phase significantly reduces your principal and total interest, helping you close the loan much faster.
              </p>
            </div>
          </div>

          <div className="xl:col-span-8">
            <LoanResults data={result} />
          </div>
        </div>
      </main>
    </div>
  );
}
