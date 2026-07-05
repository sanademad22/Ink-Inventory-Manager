import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { 
  useListEmployees,
  useDeleteEmployee,
  getListEmployeesQueryKey,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2, Eye, Search, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

export default function EmployeeList() {
  const [search, setSearch] = useState("");
  const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useListEmployees();
  const deleteMutation = useDeleteEmployee();

  const filteredEmployees = employees?.filter(emp => 
    emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
    emp.jobTitle.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = () => {
    if (!employeeToDelete) return;
    
    deleteMutation.mutate(
      { id: employeeToDelete },
      {
        onSuccess: () => {
          toast.success("Employee deleted successfully");
          queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          setEmployeeToDelete(null);
        },
        onError: () => {
          toast.error("Failed to delete employee. They might have transaction history.");
          setEmployeeToDelete(null);
        }
      }
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
            <p className="text-muted-foreground mt-1">Manage staff eligible for ink issuance.</p>
          </div>
          <Link href="/employees/new">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Employee
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or title..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
        </div>

        <div className="border rounded-md bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredEmployees?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    {search ? "No employees found matching your search." : "No employees found. Add one to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees?.map((employee) => (
                  <TableRow key={employee.id} className="group">
                    <TableCell className="font-medium text-foreground">
                      <Link href={`/employees/${employee.id}`} className="hover:underline">
                        {employee.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5" />
                        {employee.jobTitle}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(employee.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/employees/${employee.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                        </Link>
                        <Link href={`/employees/${employee.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setEmployeeToDelete(employee.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!employeeToDelete} onOpenChange={(open) => !open && setEmployeeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the employee from the system.
              If they have transaction history, you may not be able to delete them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}