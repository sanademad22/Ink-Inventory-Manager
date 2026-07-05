import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        login();
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#0a0f1e] p-4">
      <Card className="w-full max-w-md bg-card border-card-border shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-6 bg-[#0a0f1e] p-4 rounded-xl flex items-center justify-center w-full">
            <img src="/elite-logo.png" alt="Elite Fire Protection Systems" className="h-20 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Elite Fire Protection Systems W.L.L.</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">Ink Inventory Management</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Username</label>
              <Input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className="bg-background border-border text-foreground"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
