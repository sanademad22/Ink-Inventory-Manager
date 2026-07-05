import { useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Layout } from "@/components/layout";
import { 
  useCreateInkItem,
  useUpdateInkItem,
  useGetInkItem,
  getListInventoryQueryKey,
  getGetInkItemQueryKey,
  getGetLowStockItemsQueryKey,
  getGetDashboardSummaryQueryKey
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
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const inkSchema = z.object({
  inkModel: z.string().min(1, "Ink model name is required"),
  stockQuantity: z.coerce.number().min(0, "Stock quantity cannot be negative"),
  minThresholdLimit: z.coerce.number().min(0, "Threshold cannot be negative"),
});

type InkFormValues = z.infer<typeof inkSchema>;

export default function InventoryForm() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEditing = !!params.id;
  const inkId = isEditing ? parseInt(params.id as string, 10) : undefined;
  const queryClient = useQueryClient();

  const { data: inkItem, isLoading: isLoadingInk } = useGetInkItem(
    inkId as number,
    { query: { enabled: isEditing, queryKey: getGetInkItemQueryKey(inkId as number) } }
  );

  const createMutation = useCreateInkItem();
  const updateMutation = useUpdateInkItem();

  const form = useForm<InkFormValues>({
    resolver: zodResolver(inkSchema),
    defaultValues: {
      inkModel: "",
      stockQuantity: 0,
      minThresholdLimit: 5,
    },
  });

  useEffect(() => {
    if (inkItem && isEditing) {
      form.reset({
        inkModel: inkItem.inkModel,
        stockQuantity: inkItem.stockQuantity,
        minThresholdLimit: inkItem.minThresholdLimit,
      });
    }
  }, [inkItem, isEditing, form]);

  const onSubmit = (data: InkFormValues) => {
    if (isEditing && inkId) {
      updateMutation.mutate(
        { id: inkId, data },
        {
          onSuccess: () => {
            toast.success("Ink item updated successfully");
            queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetLowStockItemsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
            setLocation("/inventory");
          },
          onError: () => toast.error("Failed to update ink item"),
        }
      );
    } else {
      createMutation.mutate(
        { data },
        {
          onSuccess: () => {
            toast.success("Ink item added successfully");
            queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
            setLocation("/inventory");
          },
          onError: () => toast.error("Failed to create ink item"),
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/inventory">
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? "Edit Ink Model" : "New Ink Model"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing ? "Update inventory levels and thresholds" : "Add a new printer ink model to track"}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
            <CardDescription>Enter the specification and tracking rules.</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing && isLoadingInk ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="inkModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ink Model Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. HP 67 Black, Canon 902 XL" className="font-mono text-sm" {...field} />
                        </FormControl>
                        <FormDescription>
                          The exact model number printed on the cartridge.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="stockQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Stock Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormDescription>
                            Number of physical units currently in the supply closet.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="minThresholdLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Low Stock Threshold</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormDescription>
                            Alert triggers when stock hits or falls below this number.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t">
                    <Link href="/inventory">
                      <Button variant="ghost" type="button">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={isPending} className="gap-2">
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {isEditing ? "Save Changes" : "Create Item"}
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