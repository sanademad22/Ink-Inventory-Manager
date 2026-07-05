import { useMemo } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { 
  useGetDashboardSummary, 
  useGetRecentTransactions, 
  useGetConsumptionByEmployee,
  useGetConsumptionByInk,
} from "@workspace/api-client-react";
import { 
  Package, 
  AlertTriangle, 
  ArrowRightLeft, 
  Users,
  TrendingUp,
  Droplet
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PIE_COLORS = [
  "hsl(var(--chart-1))", 
  "hsl(var(--chart-2))", 
  "hsl(var(--chart-3))", 
  "hsl(var(--chart-4))", 
  "hsl(var(--chart-5))"
];

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: recentTransactions, isLoading: isLoadingRecent } = useGetRecentTransactions();
  const { data: consumptionByEmployee, isLoading: isLoadingEmployeeChart } = useGetConsumptionByEmployee();
  const { data: consumptionByInk, isLoading: isLoadingInkChart } = useGetConsumptionByInk();

  const employeeChartData = useMemo(() => {
    if (!consumptionByEmployee) return [];
    return [...consumptionByEmployee]
      .sort((a, b) => b.totalWithdrawn - a.totalWithdrawn)
      .slice(0, 5)
      .map(item => ({
        name: item.employeeName,
        amount: item.totalWithdrawn
      }));
  }, [consumptionByEmployee]);

  const inkChartData = useMemo(() => {
    if (!consumptionByInk) return [];
    return [...consumptionByInk]
      .sort((a, b) => b.totalWithdrawn - a.totalWithdrawn)
      .slice(0, 5)
      .map(item => ({
        name: item.inkModel,
        amount: item.totalWithdrawn
      }));
  }, [consumptionByInk]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of inventory health and issuance activity.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock Units</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{summary?.totalStockUnits || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Across all models</p>
            </CardContent>
          </Card>
          
          <Card className={summary?.lowStockCount ? "border-destructive/50 bg-destructive/5" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <AlertTriangle className={cn("h-4 w-4", summary?.lowStockCount ? "text-destructive" : "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className={cn("text-2xl font-bold", summary?.lowStockCount ? "text-destructive" : "")}>
                  {summary?.lowStockCount || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Items below threshold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{summary?.totalTransactions || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Issuances recorded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{summary?.totalEmployees || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Registered staff</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Consumers (Employees)</CardTitle>
                <CardDescription>Highest ink consumption by staff member</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingEmployeeChart ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : employeeChartData.length === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">No data available</div>
                ) : (
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={employeeChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={100} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                          cursor={{ fill: 'hsl(var(--muted))' }}
                        />
                        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Issued Ink Models</CardTitle>
                <CardDescription>Consumption volume by ink type</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingInkChart ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : inkChartData.length === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">No data available</div>
                ) : (
                  <div className="h-[250px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={inkChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="amount"
                        >
                          {inkChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col justify-center gap-2 pl-4">
                      {inkChartData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                          <span className="font-medium">{entry.name}</span>
                          <span className="text-muted-foreground ml-auto">{entry.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                <div>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest issuances</CardDescription>
                </div>
                <Link href="/transactions">
                  <Button variant="ghost" size="sm" className="h-8 text-xs">View All</Button>
                </Link>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                {isLoadingRecent ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentTransactions?.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No recent transactions found.
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentTransactions?.map((txn) => (
                      <div key={txn.id} className="p-4 hover:bg-muted/50 transition-colors flex items-start gap-4">
                        <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0 mt-0.5">
                          <Droplet className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">
                            {txn.employeeName}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono bg-muted px-1 rounded text-[10px] border">
                              {txn.inkModel}
                            </span>
                            <span>&times; {txn.quantityWithdrawn}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">
                            {format(new Date(txn.transactionTimestamp), "MMM d, h:mm a")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Ensure cn is imported and defined locally if needed or import from utils
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}