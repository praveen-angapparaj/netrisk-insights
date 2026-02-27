import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ProfileDropdown = () => {
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [joinedAt, setJoinedAt] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email || "");
        setFullName(data.user.user_metadata?.full_name || "Officer");
        setJoinedAt(data.user.created_at || "");
      }
    });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = fullName
    ? fullName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : userEmail.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/auth");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 rounded-xl hover:bg-secondary px-2.5 py-1.5 transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
          {initials}
        </div>
        <div className="text-left hidden md:block">
          <p className="text-sm font-medium text-foreground leading-tight">{fullName || "Officer"}</p>
          <p className="text-[10px] text-muted-foreground">Fraud Analyst</p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-border bg-card card-shadow-lg overflow-hidden">
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Role</span>
                <span className="text-foreground font-medium">Fraud Analyst</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Joined</span>
                <span className="text-foreground font-medium">
                  {joinedAt ? new Date(joinedAt).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
