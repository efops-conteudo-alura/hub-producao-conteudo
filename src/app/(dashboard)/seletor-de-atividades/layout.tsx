import { AppProvider } from "@/context/AppContext";

export default function SeletorLayout({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
