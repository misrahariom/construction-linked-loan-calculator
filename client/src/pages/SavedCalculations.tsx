import { Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Trash2, Calendar, FileText, ChevronRight } from "lucide-react";
import { useCalculations, useDeleteCalculation } from "@/hooks/use-calculations";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SavedCalculations() {
  const { data: calculations, isLoading } = useCalculations();
  const { mutate: deleteCalc, isPending: isDeleting } = useDeleteCalculation();

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur px-8 h-16 flex items-center">
        <div className="container mx-auto flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="-ml-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold font-display">Saved Plans</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : !calculations || calculations.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">No saved plans yet</h2>
            <p className="text-muted-foreground mt-2 mb-8">
              Save your calculation scenarios to compare them later.
            </p>
            <Link href="/">
              <Button size="lg">Create New Calculation</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {calculations.map((calc) => (
              <Card key={calc.id} className="group hover:shadow-lg transition-all border-l-4 border-l-primary/0 hover:border-l-primary">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {calc.name}
                        </h3>
                        <Badge variant="secondary" className="font-normal">
                          {calc.loanTenureYears} Years
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold tracking-tight text-foreground/80">
                        ₹ {parseInt(calc.totalLoanAmount).toLocaleString('en-IN')}
                        <span className="text-sm font-normal text-muted-foreground ml-2">@ {calc.interestRate}%</span>
                      </p>
                      <div className="flex items-center text-sm text-muted-foreground gap-4 mt-2">
                        <span className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          Starts {format(new Date(calc.startDate), 'MMM yyyy')}
                        </span>
                        <span>•</span>
                        <span>{(calc.disbursals as any[]).length} Phases</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this calculation?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the saved calculation.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteCalc(calc.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      <Button variant="outline" size="sm" className="hidden sm:flex">
                        Load <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
