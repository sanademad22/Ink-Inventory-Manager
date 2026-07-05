import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout";
import { 
  useCreateTransaction,
  useListEmployees,
  useListInventory,
  getListTransactionsQueryKey,
  getGetDashboardSummaryQueryKey,
  getListInventoryQueryKey,
  getGetRecentTransactionsQueryKey,
  getGetConsumptionByEmployeeQueryKey,
  getGetConsumptionByInkQueryKey,
  getGetLowStockItemsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ArrowLeft, Loader2, ArrowRightLeft, CheckCircle2, Printer, Download } from "lucide-react";
import { toast } from "sonner";
import { generateVoucherPDF, printVoucher } from "@/lib/pdf";
import { useState } from "react";

const transactionSchema = z.object({
  employeeId: z.coerce.number().min(1, "Please select an employee"),
  inkId: z.coerce.number().min(1, "Please select an ink model"),
  quantityWithdrawn: z.coerce.number().min(1, "Quantity must be at least 1"),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export default function TransactionForm() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [successData, setSuccessData] = useState<any | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const { data: employees, isLoading: isLoadingEmployees } = useListEmployees();
  const { data: inventory, isLoading: isLoadingInventory } = useListInventory();
  
  const createMutation = useCreateTransaction();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      employeeId: 0,
      inkId: 0,
      quantityWithdrawn: 1,
    },
  });

  const onSubmit = (data: TransactionFormValues) => {
    createMutation.mutate(
      { data },
      {
        onSuccess: async (response) => {
          queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentTransactionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetLowStockItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetConsumptionByEmployeeQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetConsumptionByInkQueryKey() });

          setSuccessData(response);
          setIsGeneratingPDF(true);
          
          try {
            const emp = employees?.find(e => e.id === response.employeeId);
            const ink = inventory?.find(i => i.id === response.inkId);
            
            await generateVoucherPDF({
              transactionId: response.id,
              employeeName: response.employeeName || emp?.fullName || "Unknown",
              employeeJobTitle: response.employeeJobTitle || emp?.jobTitle || "",
              inkModel: response.inkModel || ink?.inkModel || "Unknown",
              quantityWithdrawn: response.quantityWithdrawn,
              transactionTimestamp: response.transactionTimestamp
            });
            toast.success("Ink issued successfully — voucher downloaded");
          } catch (err) {
            toast.error("Ink issued, but failed to generate PDF automatically.");
          } finally {
            setIsGeneratingPDF(false);
          }
        },
        onError: () => toast.error("Failed to record transaction. Check if enough stock is available."),
      }
    );
  };

  const handlePrint = async () => {
    if (!successData) return;
    try {
      const emp = employees?.find(e => e.id === successData.employeeId);
      const ink = inventory?.find(i => i.id === successData.inkId);
      
      await printVoucher({
        transactionId: successData.id,
        employeeName: successData.employeeName || emp?.fullName || "Unknown",
        employeeJobTitle: successData.employeeJobTitle || emp?.jobTitle || "",
        inkModel: successData.inkModel || ink?.inkModel || "Unknown",
        quantityWithdrawn: successData.quantityWithdrawn,
        transactionTimestamp: successData.transactionTimestamp
      });
    } catch (err) {
      toast.error("Failed to print voucher.");
    }
  };

  const handleDownload = async () => {
    if (!successData) return;
    try {
      const emp = employees?.find(e => e.id === successData.employeeId);
      const ink = inventory?.find(i => i.id === successData.inkId);
      
      await generateVoucherPDF({
        transactionId: successData.id,
        employeeName: successData.employeeName || emp?.fullName || "Unknown",
        employeeJobTitle: successData.employeeJobTitle || emp?.jobTitle || "",
        inkModel: successData.inkModel || ink?.inkModel || "Unknown",
        quantityWithdrawn: successData.quantityWithdrawn,
        transactionTimestamp: successData.transactionTimestamp
      });
    } catch (err) {
      toast.error("Failed to download voucher.");
    }
  };

  const isPending = createMutation.isPending;

  return (
    <Layout>
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/transactions">
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Issue Ink</h1>
            <p className="text-sm text-muted-foreground">Record a new ink withdrawal from inventory.</p>
          </div>
        </div>

        {successData ? (
          <Card className="border-green-500/20 bg-green-500/5 shadow-none">
            <CardContent className="pt-6 pb-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-green-700">Transaction Successful</h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Transaction TRX-{String(successData.id).padStart(6, "0")} has been recorded. 
                {isGeneratingPDF ? " Preparing voucher..." : " The voucher has been downloaded."}
              </p>
              
              <div className="flex justify-center gap-3 pt-4">
                <Button onClick={handlePrint} variant="outline" className="gap-2">
                  <Printer className="w-4 h-4" />
                  Print Voucher
                </Button>
                <Button onClick={handleDownload} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download Again
                </Button>
              </div>
              <div className="pt-4 border-t border-green-500/10 mt-4">
                <Button onClick={() => { setSuccessData(null); form.reset(); }} variant="ghost" className="w-full">
                  Issue Another
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Issuance Form</CardTitle>
              <CardDescription>Select the employee, ink model, and quantity.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value ? String(field.value) : undefined}
                        >
                          <FormControl>
                            <SelectTrigger disabled={isLoadingEmployees}>
                              <SelectValue placeholder="Select an employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees?.map((emp) => (
                              <SelectItem key={emp.id} value={String(emp.id)}>
                                {emp.fullName} ({emp.jobTitle})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inkId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ink Model</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value ? String(field.value) : undefined}
                        >
                          <FormControl>
                            <SelectTrigger disabled={isLoadingInventory}>
                              <SelectValue placeholder="Select an ink model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {inventory?.map((ink) => (
                              <SelectItem key={ink.id} value={String(ink.id)} disabled={ink.stockQuantity <= 0}>
                                {ink.inkModel} - {ink.stockQuantity} in stock
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantityWithdrawn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormDescription>
                          Number of cartridges being issued.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-4 pt-4 border-t">
                    <Link href="/transactions">
                      <Button variant="ghost" type="button">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={isPending} className="gap-2 bg-primary hover:bg-primary/90">
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                      Record Issuance
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
