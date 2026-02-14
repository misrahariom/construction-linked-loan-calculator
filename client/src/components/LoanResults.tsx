import { 
  Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { format } from "date-fns";
import { IndianRupee, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { CalculationResult } from "@/lib/calculator";

interface LoanResultsProps {
  data: CalculationResult | null;
  inputs?: {
    totalLoan: number;
    tenureYears: number;
    interestRate: number;
    startDate: Date;
    fullEmiAtStart: number;
    rateChanges: any[];
    extraPayments: any[];
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export function LoanResults({ data, inputs }: LoanResultsProps) {
  if (!data) {
    return (
      <Card className="h-full flex items-center justify-center bg-muted/20 border-dashed min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <IndianRupee className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-muted-foreground">Results will appear here</h3>
          <p className="text-sm text-muted-foreground/80">Enter loan details to see the calculation</p>
        </div>
      </Card>
    );
  }

  const { summary, phases, schedule } = data;

  const chartData = schedule.filter((_, i) => i % 6 === 0 || i === schedule.length - 1).map(item => ({
    date: format(item.date, "MMM yy"),
    principal: Math.round(item.openingPrincipal),
    emi: Math.round(item.emi),
  }));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 print:space-y-8">
      {/* Print-only Header with Inputs */}
      <div className="hidden print:block space-y-6">
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">FinCalc Report</h1>
            <p className="text-sm text-muted-foreground">Construction Linked Home Loan EMI Analysis</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            Generated on {format(new Date(), "PPP")}
          </div>
        </div>

        {inputs && (
          <div className="grid grid-cols-2 gap-8 text-sm border p-4 rounded-lg">
            <div className="space-y-2">
              <h3 className="font-bold border-b pb-1">Primary Loan Details</h3>
              <div className="flex justify-between"><span>Approved Loan:</span> <strong>{formatCurrency(inputs.totalLoan)}</strong></div>
              <div className="flex justify-between"><span>Tenure:</span> <strong>{inputs.tenureYears} Years</strong></div>
              <div className="flex justify-between"><span>Initial Interest Rate:</span> <strong>{inputs.interestRate}%</strong></div>
              <div className="flex justify-between"><span>Start Date:</span> <strong>{format(inputs.startDate, "PPP")}</strong></div>
              {inputs.fullEmiAtStart > 0 && (
                <div className="flex justify-between text-primary"><span>Target Monthly EMI:</span> <strong>{formatCurrency(inputs.fullEmiAtStart)}</strong></div>
              )}
            </div>
            <div className="space-y-4">
              {inputs.rateChanges.length > 0 && (
                <div className="space-y-1">
                  <h3 className="font-bold border-b pb-1">Interest Rate Changes</h3>
                  {inputs.rateChanges.map((rc, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span>{format(new Date(rc.date), "dd MMM yyyy")}:</span> <strong>{rc.rate}%</strong>
                    </div>
                  ))}
                </div>
              )}
              {inputs.extraPayments.length > 0 && (
                <div className="space-y-1">
                  <h3 className="font-bold border-b pb-1">Extra Principal Payments</h3>
                  {inputs.extraPayments.map((ep, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span>{format(new Date(ep.date), "dd MMM yyyy")}:</span> <strong>{formatCurrency(ep.amount)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-2 print:gap-4 print:break-inside-avoid">
        <Card className="bg-primary text-primary-foreground border-none shadow-lg shadow-primary/20 print:bg-white print:text-black print:border print:shadow-none">
          <CardContent className="pt-6 print:pt-4">
            <p className="text-sm opacity-80 mb-1 print:opacity-100">Total Amount Paid</p>
            <p className="text-2xl font-bold tracking-tight print:text-xl">{formatCurrency(summary.totalAmountPaid)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm print:shadow-none">
          <CardContent className="pt-6 print:pt-4">
            <p className="text-sm text-muted-foreground mb-1">Total Interest</p>
            <p className="text-2xl font-bold text-destructive print:text-xl">{formatCurrency(summary.totalInterest)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm print:shadow-none">
          <CardContent className="pt-6 print:pt-4">
            <p className="text-sm text-muted-foreground mb-1">Loan Disbursed</p>
            <p className="text-2xl font-bold text-accent print:text-xl">{formatCurrency(summary.totalDisbursed)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm print:shadow-none">
          <CardContent className="pt-6 print:pt-4">
            <p className="text-sm text-muted-foreground mb-1">Extra Principal Paid</p>
            <p className="text-2xl font-bold text-primary print:text-xl">{formatCurrency(summary.totalExtraPaid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* EMI Phases Table */}
      <Card className="print:border print:shadow-none print:break-inside-avoid">
        <CardHeader className="pb-3 px-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Disbursal Phases & EMI Timeline</CardTitle>
              <CardDescription className="print:hidden">How your EMI changes with each disbursal</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
              <Printer className="w-4 h-4 mr-2" /> Print Results
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4">
          <div className="rounded-md border print:border-none">
            <Table>
              <TableHeader className="bg-muted/50 print:bg-transparent">
                <TableRow>
                  <TableHead className="print:text-black">Phase</TableHead>
                  <TableHead className="print:text-black">Start Date</TableHead>
                  <TableHead className="text-right print:text-black">Principal (₹)</TableHead>
                  <TableHead className="text-right print:text-black">Disbursal (₹)</TableHead>
                  <TableHead className="text-center print:text-black">Tenure</TableHead>
                  <TableHead className="text-right font-bold text-primary print:text-black">EMI (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phases.map((phase, i) => (
                  <TableRow key={i} className="hover:bg-muted/5 print:border-b print:border-gray-200">
                    <TableCell><Badge variant="outline" className="print:border-none print:p-0">Phase {i + 1}</Badge></TableCell>
                    <TableCell>{format(phase.startDate, "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-right">{formatCurrency(phase.principalAtStart)}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium print:text-black">+{formatCurrency(phase.disbursalAdded)}</TableCell>
                    <TableCell className="text-center text-muted-foreground print:text-black">{Math.round(phase.remainingTenureMonths)} mo</TableCell>
                    <TableCell className="text-right font-bold text-primary text-lg print:text-black print:text-base">{formatCurrency(phase.emi)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="print:break-before-page"></div>

      {/* Amortization Schedule (Visible for Print) */}
      <div className="print:block hidden pt-4">
        <div className="flex justify-between items-end border-b pb-2 mb-4">
          <h3 className="text-xl font-bold">Amortization Schedule</h3>
          <p className="text-xs text-muted-foreground">Detailed month-by-month breakdown</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="py-2">Month</TableHead>
              <TableHead className="text-right py-2">Opening (₹)</TableHead>
              <TableHead className="text-right py-2">EMI (₹)</TableHead>
              <TableHead className="text-right py-2">Interest (₹)</TableHead>
              <TableHead className="text-right py-2">Extra (₹)</TableHead>
              <TableHead className="text-right py-2">Closing (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule.map((row) => (
              <TableRow key={row.month} className="text-[9pt] border-b border-gray-100 h-8">
                <TableCell className="py-1">{format(row.date, "MMM yyyy")}</TableCell>
                <TableCell className="text-right py-1">{formatCurrency(row.openingPrincipal)}</TableCell>
                <TableCell className="text-right font-medium py-1">{formatCurrency(row.emi)}</TableCell>
                <TableCell className="text-right text-destructive/80 py-1">{formatCurrency(row.interest)}</TableCell>
                <TableCell className="text-right text-primary py-1">{formatCurrency(row.extraPaid)}</TableCell>
                <TableCell className="text-right font-medium py-1">{formatCurrency(row.closingPrincipal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* UI Charts (Hidden for Print) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
        <Card>
          <CardHeader><CardTitle className="text-base">Principal Repayment</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{fontSize: 12}} axisLine={false} tickLine={false} minTickGap={30} />
                <YAxis hide={true} domain={['auto', 'auto']} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="principal" stroke="hsl(var(--primary))" fill="url(#colorPrincipal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">EMI Progression</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{fontSize: 12}} axisLine={false} tickLine={false} minTickGap={30} />
                <YAxis hide={true} domain={['dataMin - 1000', 'dataMax + 1000']}/>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line type="stepAfter" dataKey="emi" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Accordion type="single" collapsible className="w-full print:hidden">
        <AccordionItem value="schedule" className="border rounded-lg bg-card px-4">
          <AccordionTrigger className="hover:no-underline"><span className="text-lg font-semibold">Full Amortization Schedule</span></AccordionTrigger>
          <AccordionContent>
            <div className="rounded-md border mt-2 overflow-hidden">
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-[80px]">#</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Opening (₹)</TableHead>
                      <TableHead className="text-right">EMI (₹)</TableHead>
                      <TableHead className="text-right">Extra (₹)</TableHead>
                      <TableHead className="text-right">Principal (₹)</TableHead>
                      <TableHead className="text-right">Closing (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule.map((row) => (
                      <TableRow key={row.month} className={row.month % 12 === 0 ? "bg-muted/10" : ""}>
                        <TableCell className="font-mono text-muted-foreground">{row.month}</TableCell>
                        <TableCell>{format(row.date, "MMM yyyy")}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(row.openingPrincipal)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.emi)}</TableCell>
                        <TableCell className="text-right text-primary font-medium">{formatCurrency(row.extraPaid)}</TableCell>
                        <TableCell className="text-right text-accent">{formatCurrency(row.principalPaid)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.closingPrincipal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
