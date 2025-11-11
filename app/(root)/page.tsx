"use client";
import { Appbar } from "@/components/Appbar";
import { Hero } from "@/components/Hero";
import { Upload } from "@/components/Upload";
import { Toaster } from "react-hot-toast";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <Appbar />
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "bg-gradient-to-br from-violet-950/90 to-purple-950/90 backdrop-blur-xl border border-violet-500/30 text-white",
          style: {
            background:
              "linear-gradient(135deg, rgba(109, 40, 217, 0.9) 0%, rgba(126, 34, 206, 0.9) 100%)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            backdropFilter: "blur(20px)",
          },
        }}
      />
      <Hero />
      <Upload />
    </main>
  );
}
