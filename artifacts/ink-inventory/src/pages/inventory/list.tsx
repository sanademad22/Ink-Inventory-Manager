import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { 
  useListInventory,
  useDeleteInkItem,
  getListInventoryQueryKey,
  getGetLowStockItemsQueryKey,
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
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Pencil, Trash2, AlertTriangle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
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

export default function InventoryList() {
  const [search, setSearch] = useState("");
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: inventory, isLoading } = useListInventory();
  const deleteMutation = useDeleteInkItem();

  const filteredInventory = inventory?.filter(item => 
    item.inkModel.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = () => {
    if (!itemToDelete) return;
    
    deleteMutation.mutate(
      { id: itemToDelete },
      {
        onSuccess: () => {
          toast.success("Inventory item deleted successfully");
          queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetLowStockItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          setItemToDelete(null);
        },
        onError: () => {
          toast.error("Failed to delete item. It might have existing transactions.");
          setItemToDelete(null);
        }
      }
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
            <p className="text-muted-foreground mt-1">Manage printer ink stock levels.</p>
          </div>
          <Link href="/inventory/new">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Ink Item
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search ink models..." 
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
                <TableHead>Model</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredInventory?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    {search ? "No ink models found matching your search." : "No inventory items found. Add one to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventory?.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell className="font-mono font-medium">{item.inkModel}</TableCell>
                    <TableCell>
                      <span className={item.isLowStock ? "text-destructive font-bold" : "font-medium"}>
                        {item.stockQuantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.minThresholdLimit}
                    </TableCell>
                    <TableCell>
                      {item.isLowStock ? (
                        <Badge variant="destructive" className="flex w-fit items-center gap-1 pr-2">
                          <AlertTriangle className="h-3 w-3" />
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200 dark:border-green-900 dark:text-green-400">
                          Adequate
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/inventory/${item.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setItemToDelete(item.id)}
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

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the ink item from the database.
              If there are transactions associated with this ink, the deletion might fail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Item"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}