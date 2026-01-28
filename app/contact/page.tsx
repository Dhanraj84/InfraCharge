export default function Contact() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p>Have a question or need help?<br/>Reach out at <b>support@infrachrg.com</b><br/>We’ll get back within 24–48 hours.</p>
      <form className="space-y-3">
        <input className="w-full p-3 rounded-xl border border-white/20 bg-transparent" placeholder="Your Name" />
        <input className="w-full p-3 rounded-xl border border-white/20 bg-transparent" placeholder="Email" />
        <select className="w-full p-3 rounded-xl border border-white/20 bg-transparent">
          <option>Feedback</option><option>Technical Issue</option><option>Business Inquiry</option>
        </select>
        <textarea rows={5} className="w-full p-3 rounded-xl border border-white/20 bg-transparent" placeholder="Your message..." />
        <button className="btn btn-primary">Send Message</button>
      </form>
    </div>
  );
}
