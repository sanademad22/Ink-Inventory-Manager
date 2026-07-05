import { useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { 
  useCreateUser, 
  useUpdateUser, 
  useListUsers,
  getListUsersQueryKey
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
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  fullName: z.string().min(2, "Full name is required"),
  role: z.enum(['admin', 'staff']),
  password: z.string().optional(),
});

export default function UsersForm() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isNew = !params.id || params.id === "new";
  const id = isNew ? 0 : parseInt(params.id!);
  
  const queryClient = useQueryClient();
  const { data: users, isLoading: isLoadingUsers } = useListUsers({ query: { enabled: !isNew, queryKey: getListUsersQueryKey() } });
  
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      fullName: "",
      role: "staff",
      password: "",
    },
  });

  useEffect(() => {
    if (!isNew && users) {
      const u = users.find(u => u.id === id);
      if (u) {
        form.reset({
          username: u.username,
          fullName: u.fullName,
          role: u.role as 'admin' | 'staff',
          password: "",
        });
      }
    }
  }, [isNew, id, users, form]);

  const onSubmit = (data: z.infer<typeof userSchema>) => {
    if (isNew && (!data.password || data.password.length < 6)) {
      form.setError("password", { message: "Password must be at least 6 characters for new users" });
      return;
    }

    if (isNew) {
      createMutation.mutate({ data: data as any }, {
        onSuccess: () => {
          toast.success("User created successfully");
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          setLocation("/users");
        },
        onError: () => toast.error("Failed to create user (username might be taken)"),
      });
    } else {
      const updateData: any = { username: data.username, fullName: data.fullName, role: data.role };
      if (data.password) {
        updateData.password = data.password;
      }
      
      updateMutation.mutate({ id, data: updateData }, {
        onSuccess: () => {
          toast.success("User updated successfully");
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          setLocation("/users");
        },
        onError: () => toast.error("Failed to update user"),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isLoading = !isNew && isLoadingUsers;

  return (
    <Layout>
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/users">
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{isNew ? "Add User" : "Edit User"}</h1>
            <p className="text-sm text-muted-foreground">{isNew ? "Create a new system user" : "Update user details"}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>Enter the user's login and role information.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="jdoe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password {isNew ? "" : "(leave blank to keep current)"}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormDescription>
                          {isNew ? "Must be at least 6 characters." : "Only enter a new password if you want to change it."}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-4 pt-4 border-t">
                    <Link href="/users">
                      <Button variant="ghost" type="button">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={isPending} className="gap-2 bg-primary hover:bg-primary/90">
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {isNew ? "Create User" : "Save Changes"}
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
