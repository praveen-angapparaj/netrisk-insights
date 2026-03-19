import { useState } from "react";
import logoImg from "@/assets/logo.webp";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, EyeOff, Loader2, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";

const AuthPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [accessCode, setAccessCode] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let codeValid = false;
      const localCode = import.meta.env.VITE_NETRISK_ACCESS_CODE;

      if (localCode) {
        codeValid = accessCode === localCode;
      } else {
        const { data: codeResult, error: codeError } = await supabase.functions.invoke("verify-access-code", {
          body: { code: accessCode },
        });
        codeValid = !codeError && codeResult?.valid;
      }

      if (!codeValid) {
        throw new Error("Invalid access code. Contact your administrator.");
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      toast.success("Account created. Check your email to verify your account.");
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-xl hover:bg-secondary transition-colors"
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5 text-warning" />
        ) : (
          <Moon className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground card-shadow-lg">
            <Shield className="h-8 w-8" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">NetRisk AI Platform</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mt-1">
              Cross-Channel Mule Detection
            </p>
          </div>
        </div>

        <Card className="border-border card-shadow-lg rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{isLogin ? "Welcome back" : "Request Access"}</CardTitle>
            <CardDescription>
              {isLogin
                ? "Enter your credentials to access the platform"
                : "Register with your organization access code"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Officer Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="rounded-xl"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="officer@organization.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="accessCode">Organization Access Code</Label>
                  <Input
                    id="accessCode"
                    type="password"
                    placeholder="Enter access code"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    required
                    className="rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    Provided by your department administrator
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full rounded-xl h-11" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isLogin ? "Sign In" : "Request Access"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin ? "Need an account? Request access" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Restricted access. Authorized personnel only.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
