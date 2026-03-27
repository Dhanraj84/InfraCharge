import "./globals.css";
import { ThemeProvider } from "next-themes";
import Navbar from "./(components)/Navbar";
import { AuthProvider } from "@/context/AuthContext";

import MainWrapper from "./(components)/MainWrapper";

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
              <Navbar />
              <MainWrapper>
                {children}
              </MainWrapper>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}