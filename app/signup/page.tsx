export default function Signup() {
  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-3xl font-bold">Create Your InfraCharge Account</h1>
      <p className="opacity-80">Join the EV community and unlock powerful tools like EV route planning, cost estimation, charging suggestions, and personalized insights.</p>
      <input className="w-full p-3 rounded-xl border border-white/20 bg-transparent" placeholder="Full Name" />
      <input className="w-full p-3 rounded-xl border border-white/20 bg-transparent" placeholder="Email Address" />
      <input className="w-full p-3 rounded-xl border border-white/20 bg-transparent" placeholder="Phone Number" />
      <input type="password" className="w-full p-3 rounded-xl border border-white/20 bg-transparent" placeholder="Password" />
      <input type="password" className="w-full p-3 rounded-xl border border-white/20 bg-transparent" placeholder="Confirm Password" />
      <label className="flex items-center gap-2 text-sm opacity-80"><input type="checkbox" /> I agree to Terms & Privacy Policy</label>
      <button className="btn btn-primary w-full">Create Account</button>
      <p className="text-sm opacity-80">Already have an account? <a href="/login" className="underline">Login</a></p>
    </div>
  );
}
