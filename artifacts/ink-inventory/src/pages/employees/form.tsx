import { useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Layout } from "@/components/layout";
import { 
  useCreateEmployee,
  useUpdateEmployee,
  useGetEmployee,
  getListEmployeesQueryKey,
  getGetEmployeeQueryKey,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const employeeSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function EmployeeForm() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEditing = !!params.id;
  const employeeId = isEditing ? parseInt(params.id as string, 10) : undefined;
  const queryClient = useQueryClient();

  const { data: employee, isLoading: isLoadingEmployee } = useGetEmployee(
    employeeId as number,
    { query: { enabled: isEditing, queryKey: getGetEmployeeQueryKey(employeeId as number) } }
  );

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      fullName: "",
      jobTitle: "",
    },
  });

  useEffect(() => {
    if (employee && isEditing) {
      form.reset({
        fullName: employee.fullName,
        jobTitle: employee.jobTitle,
      });
    }
  }, [employee, isEditing, form]);

  const onSubmit = (data: EmployeeFormValues) => {
    if (isEditing && employeeId) {
      updateMutation.mutate(
        { id: employeeId, data },
        {
          onSuccess: () => {
            toast.success("Employee updated successfully");
            queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
            setLocation("/employees");
          },
          onError: () => toast.error("Failed to update employee"),
        }
      );
    } else {
      createMutation.mutate(
        { data },
        {
          onSuccess: () => {
            toast.success("Employee added successfully");
            queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
            setLocation("/employees");
          },
          onError: () => toast.error("Failed to add employee"),
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Layout>
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/employees">
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? "Edit Employee" : "Add Employee"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing ? "Update staff details" : "Register a new staff member"}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Details</CardTitle>
            <CardDescription>Enter the staff member's personal and job information.</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing && isLoadingEmployee ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title / Department</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Graphic Designer, Marketing Dept" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-4 pt-4 border-t">
                    <Link href="/employees">
                      <Button variant="ghost" type="button">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={isPending} className="gap-2">
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {isEditing ? "Save Changes" : "Add Employee"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}