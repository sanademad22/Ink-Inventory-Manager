import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { 
  useListTransactions,
} from "@workspace/api-client-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Download, PlusCircle, Droplet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { generateVoucherPDF } from "@/lib/pdf";
import { Badge } from "@/components/ui/badge";

export default function TransactionList() {
  const [search, setSearch] = useState("");
  const { data: transactions, isLoading } = useListTransactions();

  const filteredTransactions = transactions?.filter(txn => 
    txn.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    txn.inkModel.toLowerCase().includes(search.toLowerCase()) ||
    String(txn.id).includes(search)
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
            <p className="text-muted-foreground mt-1">Complete history of ink issuances.</p>
          </div>
          <Link href="/transactions/new">
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="h-4 w-4" />
              Issue Ink
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search ID, employee, or model..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
        </div>

        <div className="border rounded-md bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-24">Txn ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Ink Model</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Voucher</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredTransactions?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    {search ? "No transactions found matching your search." : "No transactions recorded yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions?.map((txn) => (
                  <TableRow key={txn.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      TRX-{String(txn.id).padStart(5, '0')}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="font-medium text-foreground">
                        {format(new Date(txn.transactionTimestamp), "MMM d, yyyy")}
                      </span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {format(new Date(txn.transactionTimestamp), "HH:mm")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/employees/${txn.employeeId}`} className="font-medium hover:underline text-primary">
                        {txn.employeeName}
                      </Link>
                      <div className="text-xs text-muted-foreground">{txn.employeeJobTitle}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono bg-card">
                        <Droplet className="w-3 h-3 mr-1 text-primary" />
                        {txn.inkModel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {txn.quantityWithdrawn}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-1.5 border-border hover:bg-muted"
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
                        <span className="text-xs">PDF</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}