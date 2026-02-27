import "./globals.css";
import { ThemeProvider } from "next-themes";
import Header from "./(components)/Header";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "InfraCharge",
  description: "EV tools for India",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <Header />

              <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:px-8">
                {children}
              </main>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}