import "./globals.css";
import { ThemeProvider } from "next-themes";
import Header from "./(components)/Header";
import IntroVideo from "./(components)/IntroVideo";

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
          <IntroVideo />
          <Header />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-8">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
