"use client";
import { Appbar } from "@/components/Appbar";
import { Hero } from "@/components/Hero";
import { Upload } from "@/components/Upload";
import { UploadImage } from "@/components/UploadImage";
import Image from "next/image";
import { useState } from "react";
import { Toaster } from "react-hot-toast";

export default function Home() {

  return (
    <main>
      <Appbar />
      <Hero />
      <Toaster position="top-right" />
      <Upload />
    </main>
  );
}
