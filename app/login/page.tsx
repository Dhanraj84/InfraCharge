export default function Login() {
  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-3xl font-bold">Welcome Back</h1>
      <p className="opacity-80">Login to continue accessing personalized EV insights, route planning, charging tools, and your saved preferences.</p>
      <input className="w-full p-3 rounded-xl border border-white/20 bg-transparent" placeholder="Email / Mobile Number" />
      <input type="password" className="w-full p-3 rounded-xl border border-white/20 bg-transparent" placeholder="Password" />
      <button className="btn btn-primary w-full">Login</button>
      <div className="flex justify-between text-sm opacity-80">
        <a href="#">Forgot Password?</a>
        <a href="/signup">Create one now</a>
      </div>
    </div>
  );
}
