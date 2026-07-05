import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { 
  useGetEmployee, 
  useGetEmployeeTransactions 
} from "@workspace/api-client-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Briefcase, Calendar, Download, Droplet } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { generateVoucherPDF } from "@/lib/pdf";

export default function EmployeeDetail() {
  const params = useParams();
  const employeeId = parseInt(params.id as string, 10);

  const { data: employee, isLoading: isLoadingEmployee } = useGetEmployee(employeeId, {
    query: { enabled: !!employeeId, queryKey: ["employee", employeeId] }
  });

  const { data: transactions, isLoading: isLoadingTransactions } = useGetEmployeeTransactions(employeeId, {
    query: { enabled: !!employeeId, queryKey: ["employeeTransactions", employeeId] }
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/employees">
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            {isLoadingEmployee ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              <h1 className="text-3xl font-bold tracking-tight">{employee?.fullName}</h1>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingEmployee ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Job Title</p>
                      <p className="font-medium text-foreground">{employee?.jobTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Added On</p>
                      <p className="font-medium text-foreground">
                        {employee?.createdAt ? format(new Date(employee.createdAt), "PPP") : ""}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Issuance History</CardTitle>
              <CardDescription>Log of all ink withdrawn by this employee</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Ink Model</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Voucher</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingTransactions ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : transactions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        No transactions recorded for this employee.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions?.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {format(new Date(txn.transactionTimestamp), "MMM d, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Droplet className="h-3 w-3 text-primary" />
                            <span className="font-mono text-sm">{txn.inkModel}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {txn.quantityWithdrawn}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 gap-1"
                            onClick={() => generateVoucherPDF({
                              transactionId: txn.id,
                              employeeName: txn.employeeName,
                              employeeJobTitle: txn.employeeJobTitle,
                              inkModel: txn.inkModel,
                              quantityWithdrawn: txn.quantityWithdrawn,
                              transactionTimestamp: txn.transactionTimestamp
                            })}
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:inline-block text-xs">PDF</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}