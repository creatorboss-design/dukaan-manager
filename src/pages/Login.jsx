import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import BigButton from "../components/shared/BigButton";
import Input from "../components/shared/Input";
import { Wrench, Store, Users, ArrowLeft } from "lucide-react";

export default function Login() {
  const { login, registerOwner, registerStaff, resetPassword } = useAuth();
  const nav = useNavigate();
  
  // mode can be "login", "owner", or "staff"
  const [mode, setMode] = useState("login");
  
  const [form, setForm] = useState({ 
    email: "", 
    password: "", 
    name: "",
    shopName: "",
    shopId: ""
  });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); 
    setLoading(true);
    
    try {
      if (mode === "owner") {
        await registerOwner(form.email, form.password, form.name, form.shopName);
      } else if (mode === "staff") {
        await registerStaff(form.email, form.password, form.name, form.shopId);
      } else {
        await login(form.email, form.password);
      }
      nav("/dashboard");
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered.");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Incorrect email or password.");
      } else {
        setError(err.message);
      }
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(form.email);
      setResetSent(true);
    } catch (err) {
      if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        // Deliberately vague for auth/user-not-found and similar — same
        // reasoning Firebase's own guidance follows: don't reveal whether a
        // given email is registered, to avoid leaking account existence to
        // someone probing random addresses.
        setResetSent(true);
      }
    }
    setLoading(false);
  };

  if (mode === "select") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <button onClick={() => setMode("login")} className="flex items-center text-gray-500 mb-6 hover:text-blue-700 transition-colors">
            <ArrowLeft size={16} className="mr-1" /> Back to login
          </button>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Create an Account</h2>
          <p className="text-gray-500 mb-6">Choose how you want to use Dukaan Manager.</p>

          <button onClick={() => setMode("owner")} className="w-full bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm hover:border-blue-500 hover:shadow-md transition-all text-left flex items-start gap-4 group">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Store size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Shop Owner</h3>
              <p className="text-sm text-gray-500 mt-1">I want to create a new shop and manage my business.</p>
            </div>
          </button>

          <button onClick={() => setMode("staff")} className="w-full bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-green-500 hover:shadow-md transition-all text-left flex items-start gap-4 group">
            <div className="bg-green-50 text-green-600 p-3 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Staff Member</h3>
              <p className="text-sm text-gray-500 mt-1">I have a Shop Code and want to join an existing team.</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (mode === "forgot") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <button onClick={() => { setMode("login"); setResetSent(false); setError(""); }} className="flex items-center text-gray-500 mb-6 hover:text-blue-700 transition-colors -mt-2 -ml-2 p-2">
            <ArrowLeft size={16} className="mr-1" /> Back to login
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-700 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-200 mb-4">
              <Wrench size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
            <p className="text-gray-500 text-sm mt-1">Enter your email and we'll send you a reset link.</p>
          </div>

          {resetSent ? (
            <div className="text-center">
              <p className="text-green-700 bg-green-50 border border-green-100 rounded-xl p-4 text-sm mb-4">
                If an account exists for that email, a password reset link has been sent. Check your inbox (and spam folder).
              </p>
              <button onClick={() => { setMode("login"); setResetSent(false); }} className="text-blue-700 font-bold hover:underline">
                Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input label="Email Address" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required />
              {error && <p className="text-red-500 text-sm bg-red-50 border border-red-100 p-3 rounded-xl">{error}</p>}
              <BigButton type="submit" disabled={loading} className="w-full mt-2 py-4 text-lg">
                {loading ? "Sending..." : "Send Reset Link"}
              </BigButton>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        
        {mode !== "login" && (
          <button onClick={() => setMode("select")} className="flex items-center text-gray-500 mb-6 hover:text-blue-700 transition-colors -mt-2 -ml-2 p-2">
            <ArrowLeft size={16} className="mr-1" /> Back
          </button>
        )}

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-700 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-200 mb-4">
            <Wrench size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {mode === "login" ? "Welcome Back" : mode === "owner" ? "Create Your Shop" : "Join Your Team"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === "login" ? "Enter your credentials to access your shop." : "Fill in the details below to get started."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode !== "login" && (
            <Input label="Your Name" value={form.name} onChange={set("name")} placeholder="Full name" required />
          )}

          {mode === "owner" && (
            <Input label="Shop Name" value={form.shopName} onChange={set("shopName")} placeholder="e.g. Rahul Mobile Repair" required />
          )}

          {mode === "staff" && (
            <Input label="Shop Code" value={form.shopId} onChange={set("shopId")} placeholder="e.g. A1B2C3" required 
              className="uppercase tracking-widest text-center font-bold" />
          )}

          <Input label="Email Address" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required />
          <Input label="Password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••" required />

          {mode === "login" && (
            <button type="button" onClick={() => { setMode("forgot"); setError(""); }} className="text-sm text-blue-600 hover:underline -mt-2 mb-1 block">
              Forgot password?
            </button>
          )}

          {error && <p className="text-red-500 text-sm bg-red-50 border border-red-100 p-3 rounded-xl">{error}</p>}

          <BigButton type="submit" disabled={loading} className="w-full mt-2 py-4 text-lg">
            {loading ? "Loading..." : mode === "login" ? "Login to Shop" : "Create Account"}
          </BigButton>
        </form>

        {mode === "login" && (
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-500 text-sm">Don't have an account?</p>
            <button onClick={() => setMode("select")} className="text-blue-700 font-bold mt-1 hover:underline">
              Create a free account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
