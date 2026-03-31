import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Loader2, LockKeyhole } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in.";
      toast({
        title: "Sign-in failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-heading text-xl font-bold text-foreground">
            NCG CT Thorax Study
          </h1>
          <p className="text-sm text-muted-foreground">
            Dectrocel SGPGIMS medical imaging workflow
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-heading">Sign In</CardTitle>
            <CardDescription>
              Use your assigned SGPGI thorax platform credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="thorax.admin"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />}
                Sign In
              </Button>
            </form>

            <div className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
              The app now authenticates against the backend API through the local server proxy.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
