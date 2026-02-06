import { useState, useEffect } from "react";
import { format, parse } from "date-fns";
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

interface RateChangeInput {
  id: string;
  date: Date;
  rate: number;
}

export interface LoanInputData {
  totalLoan: number;
  tenureYears: number;
  interestRate: number;
  startDate: Date;
  disbursals: DisbursalInput[];
  rateChanges: RateChangeInput[];
}

interface LoanInputsProps {
  onCalculate: (data: LoanInputData) => void;
  onSave?: (name: string) => void;
}

// Helper to handle manual date entry
const DateInput = ({ date, onChange, label }: { date: Date, onChange: (date: Date) => void, label?: string }) => {
  const [inputValue, setInputValue] = useState(format(date, "yyyy-MM-dd"));

  useEffect(() => {
    setInputValue(format(date, "yyyy-MM-dd"));
  }, [date]);

  const handleManualChange = (val: string) => {
    setInputValue(val);
    const parsed = parse(val, "yyyy-MM-dd", new Date());
    if (!isNaN(parsed.getTime())) {
      onChange(parsed);
    }
  };

  return (
    <div className="flex gap-1 flex-col w-full">
      {label && <Label className="text-xs text-muted-foreground">{label}</Label>}
      <div className="flex gap-2">
        <Input 
          type="date" 
          value={inputValue} 
          onChange={(e) => handleManualChange(e.target.value)}
          className="flex-1"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && onChange(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export function LoanInputs({ onCalculate, onSave }: LoanInputsProps) {
  const [totalLoan, setTotalLoan] = useState<string>("7500000");
  const [tenure, setTenure] = useState<string>("24");
  const [rate, setRate] = useState<string>("8.5");
  const [startDate, setStartDate] = useState<Date>(new Date(2026, 0, 1));
  
  const [disbursals, setDisbursals] = useState<DisbursalInput[]>([
    { id: '1', date: new Date(2026, 0, 1), amount: 750000 }
  ]);

  const [rateChanges, setRateChanges] = useState<RateChangeInput[]>([]);

  const [calculationName, setCalculationName] = useState("");

  useEffect(() => {
    handleCalculate();
  }, [totalLoan, tenure, rate, startDate, disbursals, rateChanges]);

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
      disbursals,
      rateChanges
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
        amount: 500000 
      }
    ]);
  };

  const addRateChange = () => {
    setRateChanges([
      ...rateChanges,
      { 
        id: Math.random().toString(36).substr(2, 9), 
        date: new Date(), 
        rate: parseFloat(rate) 
      }
    ]);
  };

  const removeDisbursal = (id: string) => {
    if (disbursals.length > 1) {
      setDisbursals(disbursals.filter(d => d.id !== id));
    }
  };

  const removeRateChange = (id: string) => {
    setRateChanges(rateChanges.filter(r => r.id !== id));
  };

  const updateDisbursal = (id: string, field: 'date' | 'amount', value: any) => {
    setDisbursals(disbursals.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const updateRateChange = (id: string, field: 'date' | 'rate', value: any) => {
    setRateChanges(rateChanges.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const loadSampleData = () => {
    setTotalLoan("7500000");
    setTenure("24");
    setRate("8.5");
    const baseDate = new Date(2026, 0, 1);
    setStartDate(baseDate);
    setDisbursals([
      { id: '1', date: baseDate, amount: 750000 },
      { id: '2', date: new Date(2026, 3, 8), amount: 500000 },
      { id: '3', date: new Date(2026, 8, 8), amount: 800000 },
    ]);
    setRateChanges([]);
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
            Sample Data
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
            <Label htmlFor="rate">Initial Rate (% p.a.)</Label>
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
            <DateInput date={startDate} onChange={setStartDate} />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-base font-semibold">Interest Rate Changes</Label>
            <Button variant="outline" size="sm" onClick={addRateChange} className="border-dashed border-primary/40 text-primary">
              <Plus className="w-4 h-4 mr-2" /> Add Change
            </Button>
          </div>
          <div className="space-y-3">
            {rateChanges.map((change) => (
              <div key={change.id} className="flex gap-3 items-end">
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <DateInput label="Date" date={change.date} onChange={(d) => updateRateChange(change.id, 'date', d)} />
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">New Rate (%)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={change.rate}
                      onChange={(e) => updateRateChange(change.id, 'rate', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeRateChange(change.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-base font-semibold">Disbursal Schedule</Label>
            <Button variant="outline" size="sm" onClick={addDisbursal} className="border-dashed border-primary/40 text-primary">
              <Plus className="w-4 h-4 mr-2" /> Add Phase
            </Button>
          </div>

          <div className="space-y-3">
            {disbursals.map((disbursal, index) => (
              <div key={disbursal.id} className="flex gap-3 items-end">
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <DateInput label={index === 0 ? "Date" : undefined} date={disbursal.date} onChange={(d) => updateDisbursal(disbursal.id, 'date', d)} />
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
      </CardContent>
    </Card>
  );
}
