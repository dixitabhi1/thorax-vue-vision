import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("PULMONARY");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-heading text-xl font-bold text-foreground">
            NCG CT Thorax Study
          </h1>
          <p className="text-sm text-muted-foreground">
            Dectrocel SGPGIMS — Medical Imaging Platform
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-heading">
              {isRegister ? "Create Account" : "Sign In"}
            </CardTitle>
            <CardDescription>
              {isRegister
                ? "Register for access to the study platform"
                : "Enter your credentials to access the platform"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Dr. Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="DECTROCEL">Dectrocel</SelectItem>
                        <SelectItem value="RADIOLOGY">Radiology</SelectItem>
                        <SelectItem value="PULMONARY">Pulmonary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@sgpgims.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isRegister ? "Create Account" : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? "Already have an account? Sign in" : "Need an account? Register"}
              </button>
            </div>

            {!isRegister && (
              <div className="mt-4 rounded-md bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Demo Credentials:</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>admin@sgpgims.ac.in</span><span>admin123</span>
                  <span>dectrocel@sgpgims.ac.in</span><span>dect123</span>
                  <span>radiology@sgpgims.ac.in</span><span>rad123</span>
                  <span>pulmonary@sgpgims.ac.in</span><span>pulm123</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
