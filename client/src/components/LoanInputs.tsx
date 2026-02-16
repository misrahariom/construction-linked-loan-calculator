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

interface ExtraPaymentInput {
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
  rateChanges: RateChangeInput[];
  extraPayments: ExtraPaymentInput[];
  fullEmiAtStart: number;
}

interface LoanInputsProps {
  onCalculate: (data: LoanInputData) => void;
  onSave?: (name: string) => void;
}

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
      <div className="flex gap-1 items-center">
        <Input 
          type="date" 
          value={inputValue} 
          onChange={(e) => handleManualChange(e.target.value)}
          className="flex-1 min-w-0 px-2"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 h-9 w-9">
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
  const [totalLoan, setTotalLoan] = useState<string>("3760000");
  const [tenure, setTenure] = useState<string>("15");
  const [rate, setRate] = useState<string>("8.65");
  const [fullEmiAtStart, setFullEmiAtStart] = useState<string>("37400");
  const [startDate, setStartDate] = useState<Date>(new Date(2023, 4, 31));
  
  const [disbursals, setDisbursals] = useState<DisbursalInput[]>([
    { id: '1', date: new Date(2023, 4, 31), amount: 666600 },
    { id: '2', date: new Date(2023, 8, 18), amount: 444400 },
    { id: '3', date: new Date(2024, 0, 16), amount: 444400 },
    { id: '4', date: new Date(2024, 2, 30), amount: 444400 },
    { id: '5', date: new Date(2024, 8, 3), amount: 222000 },
    { id: '6', date: new Date(2025, 2, 26), amount: 444600 },
  ]);

  const [rateChanges, setRateChanges] = useState<RateChangeInput[]>([
    { id: 'r1', date: new Date(2025, 1, 15), rate: 8.4 },
    { id: 'r2', date: new Date(2025, 3, 15), rate: 8.15 },
    { id: 'r3', date: new Date(2025, 5, 15), rate: 7.65 },
  ]);
  const [extraPayments, setExtraPayments] = useState<ExtraPaymentInput[]>([]);

  const [calculationName, setCalculationName] = useState("");

  useEffect(() => {
    handleCalculate();
  }, [totalLoan, tenure, rate, fullEmiAtStart, startDate, disbursals, rateChanges, extraPayments]);

  const handleCalculate = () => {
    const loanAmount = parseFloat(totalLoan);
    const tenureYears = parseFloat(tenure);
    const interestRate = parseFloat(rate);
    const targetEmi = parseFloat(fullEmiAtStart) || 0;

    if (!loanAmount || !tenureYears || !interestRate || disbursals.length === 0) return;

    onCalculate({
      totalLoan: loanAmount,
      tenureYears,
      interestRate,
      startDate,
      disbursals,
      rateChanges,
      extraPayments,
      fullEmiAtStart: targetEmi
    });
  };

  const addDisbursal = () => {
    const lastDisbursal = disbursals[disbursals.length - 1];
    const newDate = lastDisbursal ? new Date(lastDisbursal.date.getFullYear(), lastDisbursal.date.getMonth() + 3, 1) : new Date();
    setDisbursals([...disbursals, { id: Math.random().toString(36).substr(2, 9), date: newDate, amount: 500000 }]);
  };

  const addRateChange = () => {
    setRateChanges([...rateChanges, { id: Math.random().toString(36).substr(2, 9), date: new Date(), rate: parseFloat(rate) }]);
  };

  const addExtraPayment = () => {
    setExtraPayments([...extraPayments, { id: Math.random().toString(36).substr(2, 9), date: new Date(), amount: 100000 }]);
  };

  return (
    <Card className="border-0 shadow-lg shadow-primary/5">
      <CardHeader className="bg-primary/5 pb-4 px-4">
        <div className="flex justify-between items-center gap-2">
          <div>
            <CardTitle className="text-xl font-bold text-primary">Loan Details</CardTitle>
            <CardDescription>Configure your construction linked plan</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => {
            setTotalLoan("3760000");
            setTenure("15");
            setRate("8.65");
            setFullEmiAtStart("37400");
            const baseDate = new Date(2023, 4, 31);
            setStartDate(baseDate);
            setDisbursals([
              { id: '1', date: baseDate, amount: 666600 },
              { id: '2', date: new Date(2023, 8, 18), amount: 444400 },
              { id: '3', date: new Date(2024, 0, 16), amount: 444400 },
              { id: '4', date: new Date(2024, 2, 30), amount: 444400 },
              { id: '5', date: new Date(2024, 8, 3), amount: 222000 },
              { id: '6', date: new Date(2025, 2, 26), amount: 444600 },
            ]);
            setRateChanges([
              { id: 'r1', date: new Date(2025, 1, 15), rate: 8.4 },
              { id: 'r2', date: new Date(2025, 3, 15), rate: 8.15 },
              { id: 'r3', date: new Date(2025, 5, 15), rate: 7.65 },
            ]);
            setExtraPayments([]);
          }} className="text-primary h-8 px-2">
            <RotateCcw className="w-4 h-4 mr-1" />
            Sample
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-4 px-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="totalLoan">Approved Loan (₹)</Label>
            <Input id="totalLoan" type="number" value={totalLoan} onChange={(e) => setTotalLoan(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tenure">Tenure (Years)</Label>
            <Input id="tenure" type="number" value={tenure} onChange={(e) => setTenure(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rate">Initial Rate (%)</Label>
            <Input id="rate" type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="targetEmi">Full EMI to pay (₹)</Label>
            <Input id="targetEmi" type="number" value={fullEmiAtStart} onChange={(e) => setFullEmiAtStart(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label>Start Date</Label>
            <DateInput date={startDate} onChange={setStartDate} />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="font-semibold text-sm">Interest Rate Changes</Label>
            <Button variant="outline" size="sm" onClick={addRateChange} className="h-7 px-2 border-dashed border-primary/40 text-primary text-xs">
              <Plus className="w-3 h-3 mr-1" /> Rate Change
            </Button>
          </div>
          <div className="space-y-2">
            {rateChanges.map((change) => (
              <div key={change.id} className="flex gap-2 items-end">
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <DateInput date={change.date} onChange={(d) => setRateChanges(rateChanges.map(r => r.id === change.id ? { ...r, date: d } : r))} />
                  <Input type="number" step="0.01" value={change.rate} onChange={(e) => setRateChanges(rateChanges.map(r => r.id === change.id ? { ...r, rate: parseFloat(e.target.value) } : r))} className="h-9" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => setRateChanges(rateChanges.filter(r => r.id !== change.id))} className="h-9 w-9 text-muted-foreground"><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="font-semibold text-sm">Extra Principal Payments</Label>
            <Button variant="outline" size="sm" onClick={addExtraPayment} className="h-7 px-2 border-dashed border-primary/40 text-primary text-xs">
              <Plus className="w-3 h-3 mr-1" /> Extra Pay
            </Button>
          </div>
          <div className="space-y-2">
            {extraPayments.map((payment) => (
              <div key={payment.id} className="flex gap-2 items-end">
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <DateInput date={payment.date} onChange={(d) => setExtraPayments(extraPayments.map(p => p.id === payment.id ? { ...p, date: d } : p))} />
                  <Input type="number" value={payment.amount} onChange={(e) => setExtraPayments(extraPayments.map(p => p.id === payment.id ? { ...p, amount: parseFloat(e.target.value) } : p))} className="h-9" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => setExtraPayments(extraPayments.filter(p => p.id !== payment.id))} className="h-9 w-9 text-muted-foreground"><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="font-semibold text-sm">Disbursal Phases</Label>
            <Button variant="outline" size="sm" onClick={addDisbursal} className="h-7 px-2 border-dashed border-primary/40 text-primary text-xs">
              <Plus className="w-3 h-3 mr-1" /> Add Phase
            </Button>
          </div>
          <div className="space-y-2">
            {disbursals.map((disbursal, index) => (
              <div key={disbursal.id} className="flex gap-2 items-end">
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <DateInput label={index === 0 ? "Date" : undefined} date={disbursal.date} onChange={(d) => setDisbursals(disbursals.map(di => di.id === disbursal.id ? { ...di, date: d } : di))} />
                  <div className="flex flex-col gap-1">
                    {index === 0 && <Label className="text-xs text-muted-foreground">Amount</Label>}
                    <Input type="number" value={disbursal.amount} onChange={(e) => setDisbursals(disbursals.map(di => di.id === disbursal.id ? { ...di, amount: parseFloat(e.target.value) } : di))} className="h-9" />
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setDisbursals(disbursals.filter(di => di.id !== disbursal.id))} disabled={disbursals.length === 1} className="h-9 w-9 text-muted-foreground"><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
