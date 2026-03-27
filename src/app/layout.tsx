import type { Metadata } from "next";
import { Roboto_Flex, JetBrains_Mono, Encode_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const robotoFlex = Roboto_Flex({
  variable: "--font-roboto-flex",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const encodeSans = Encode_Sans({
  variable: "--font-encode-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hub de Produção de Conteúdo",
  description: "Ferramentas para coordenadores de conteúdo da Alura — do planejamento à entrega.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${robotoFlex.variable} ${jetbrainsMono.variable} ${encodeSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
