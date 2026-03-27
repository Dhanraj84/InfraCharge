export default function Contact() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-bg overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-2xl w-full">
        <div className="group relative bg-white/10 dark:bg-white/5 backdrop-blur-lg p-8 md:p-10 rounded-2xl border border-white/20 dark:border-white/10 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] dark:hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] transition-all duration-300 overflow-hidden text-left">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-blue-500/10 dark:bg-green-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 dark:group-hover:bg-green-500/20 transition-all duration-500 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center mb-2 shadow-sm border border-white/20 dark:border-white/5">
              <span className="text-3xl">📧</span>
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
              Contact Us
            </h1>
            
            <p className="text-muted leading-relaxed opacity-90 max-w-md mx-auto">
              Have a question or need help? Reach out at <b className="text-text">support@infracharg.com</b>. We’ll get back within 24–48 hours.
            </p>
            
            <form className="w-full space-y-4 text-left mt-6">
              <div>
                <label className="block text-sm font-medium text-muted mb-1 ml-1 scale-95 origin-left">Your Name</label>
                <input 
                  className="w-full p-4 rounded-xl border border-white/20 dark:border-white/10 bg-white/5 dark:bg-black/20 text-text placeholder:text-muted focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none transition-all" 
                  placeholder="John Doe" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1 ml-1 scale-95 origin-left">Email Address</label>
                <input 
                  className="w-full p-4 rounded-xl border border-white/20 dark:border-white/10 bg-white/5 dark:bg-black/20 text-text placeholder:text-muted focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none transition-all" 
                  placeholder="john@example.com" 
                  type="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1 ml-1 scale-95 origin-left">Topic</label>
                <select className="w-full p-4 rounded-xl border border-white/20 dark:border-white/10 bg-white/5 dark:bg-black/20 text-text focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none transition-all appearance-none cursor-pointer">
                  <option className="bg-card text-text">Feedback</option>
                  <option className="bg-card text-text">Technical Issue</option>
                  <option className="bg-card text-text">Business Inquiry</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1 ml-1 scale-95 origin-left">Message</label>
                <textarea 
                  rows={4} 
                  className="w-full p-4 rounded-xl border border-white/20 dark:border-white/10 bg-white/5 dark:bg-black/20 text-text placeholder:text-muted focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none transition-all resize-none" 
                  placeholder="How can we help you?" 
                />
              </div>
              
              <div className="pt-2">
                <button type="submit" className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 hover:opacity-90 shadow-lg hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all active:scale-95">
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
