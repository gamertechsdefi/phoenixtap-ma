import localFont from "next/font/local";
import "./globals.css";

const spaceMono = localFont({
  src: "./fonts/SpaceMono-Regular.ttf",
  variable: "--font-space-mono",
  weight: "400 900",
});

export const metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={spaceMono.className}
      >
        {children}
      </body>
    </html>
  );
}
