import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface DisbursalInput {
  id: string;
  date: Date;
  amount: number;
}

export interface LoanInputData {
  totalLoan: number;
  tenureYears: number;
  interestRate: number;
  startDate: Date;
  disbursals: DisbursalInput[];
}

interface LoanInputsProps {
  onCalculate: (data: LoanInputData) => void;
  onSave?: (name: string) => void;
}

export function LoanInputs({ onCalculate, onSave }: LoanInputsProps) {
  const [totalLoan, setTotalLoan] = useState<string>("7500000");
  const [tenure, setTenure] = useState<string>("20");
  const [rate, setRate] = useState<string>("8.5");
  const [startDate, setStartDate] = useState<Date>(new Date());
  
  const [disbursals, setDisbursals] = useState<DisbursalInput[]>([
    { id: '1', date: new Date(), amount: 1500000 }
  ]);

  const [calculationName, setCalculationName] = useState("");

  // Auto-calculate on changes (debounced could be better but this is fine for local calc)
  useEffect(() => {
    handleCalculate();
  }, [totalLoan, tenure, rate, startDate, disbursals]);

  const handleCalculate = () => {
    const loanAmount = parseFloat(totalLoan);
    const tenureYears = parseFloat(tenure);
    const interestRate = parseFloat(rate);

    if (!loanAmount || !tenureYears || !interestRate || disbursals.length === 0) return;

    onCalculate({
      totalLoan: loanAmount,
      tenureYears,
      interestRate,
      startDate,
      disbursals
    });
  };

  const addDisbursal = () => {
    const lastDisbursal = disbursals[disbursals.length - 1];
    const newDate = lastDisbursal ? new Date(lastDisbursal.date.getFullYear(), lastDisbursal.date.getMonth() + 3, 1) : new Date();
    
    setDisbursals([
      ...disbursals,
      { 
        id: Math.random().toString(36).substr(2, 9), 
        date: newDate, 
        amount: 1000000 
      }
    ]);
  };

  const removeDisbursal = (id: string) => {
    if (disbursals.length > 1) {
      setDisbursals(disbursals.filter(d => d.id !== id));
    }
  };

  const updateDisbursal = (id: string, field: 'date' | 'amount', value: any) => {
    setDisbursals(disbursals.map(d => {
      if (d.id === id) {
        return { ...d, [field]: value };
      }
      return d;
    }));
  };

  const loadSampleData = () => {
    setTotalLoan("7500000");
    setTenure("24");
    setRate("8.5");
    const baseDate = new Date();
    setStartDate(baseDate);
    setDisbursals([
      { id: '1', date: baseDate, amount: 1500000 },
      { id: '2', date: new Date(baseDate.getFullYear(), baseDate.getMonth() + 6, 1), amount: 2500000 },
      { id: '3', date: new Date(baseDate.getFullYear() + 1, baseDate.getMonth(), 1), amount: 2000000 },
      { id: '4', date: new Date(baseDate.getFullYear() + 1, baseDate.getMonth() + 6, 1), amount: 1500000 },
    ]);
  };

  return (
    <Card className="border-0 shadow-lg shadow-primary/5">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold text-primary">Loan Details</CardTitle>
            <CardDescription>Configure your construction linked plan</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={loadSampleData} className="text-primary hover:text-primary hover:bg-primary/10">
            <RotateCcw className="w-4 h-4 mr-2" />
            Load Sample
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="totalLoan">Total Approved Loan (₹)</Label>
            <Input 
              id="totalLoan" 
              type="number" 
              value={totalLoan} 
              onChange={(e) => setTotalLoan(e.target.value)}
              className="text-lg font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenure">Tenure (Years)</Label>
            <Input 
              id="tenure" 
              type="number" 
              value={tenure} 
              onChange={(e) => setTenure(e.target.value)}
              className="text-lg font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">Interest Rate (% p.a.)</Label>
            <Input 
              id="rate" 
              type="number" 
              step="0.01"
              value={rate} 
              onChange={(e) => setRate(e.target.value)}
              className="text-lg font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label>Loan Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal h-11",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-base font-semibold">Disbursal Schedule</Label>
            <Button variant="outline" size="sm" onClick={addDisbursal} className="border-dashed border-primary/40 text-primary hover:border-primary">
              <Plus className="w-4 h-4 mr-2" /> Add Phase
            </Button>
          </div>

          <div className="space-y-3">
            {disbursals.map((disbursal, index) => (
              <div key={disbursal.id} className="flex gap-3 items-end animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <div className="space-y-1">
                    {index === 0 && <Label className="text-xs text-muted-foreground">Date</Label>}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !disbursal.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                          {disbursal.date ? format(disbursal.date, "dd MMM yyyy") : <span>Pick date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={disbursal.date}
                          onSelect={(date) => date && updateDisbursal(disbursal.id, 'date', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    {index === 0 && <Label className="text-xs text-muted-foreground">Amount (₹)</Label>}
                    <Input 
                      type="number" 
                      value={disbursal.amount}
                      onChange={(e) => updateDisbursal(disbursal.id, 'amount', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeDisbursal(disbursal.id)}
                  disabled={disbursals.length === 1}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {onSave && (
          <div className="pt-4 border-t flex gap-2">
            <Input 
              placeholder="Calculation Name (e.g. My Dream Home)" 
              value={calculationName}
              onChange={(e) => setCalculationName(e.target.value)}
            />
            <Button onClick={() => onSave(calculationName)} disabled={!calculationName}>
              Save
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
