"use client";
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/utils";
import { getToken, setToken, isTokenValid } from "@/utils/auth";
import { toast } from "react-hot-toast";

export const Appbar = () => {
  const { publicKey, signMessage } = useWallet();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const signAndSend = useCallback(async () => {
    if (!publicKey || !signMessage || isAuthenticating) {
      return;
    }

    // Check if user already has a valid token
    if (isTokenValid()) {
      return;
    }

    setIsAuthenticating(true);
    try {
      const message = new TextEncoder().encode("Sign into MechaWorks");
      const signature = await signMessage(message);

      const response = await axios.post(`${BACKEND_URL}/v1/user/signin`, {
        signature,
        publicKey: publicKey.toString(),
      });

      setToken(response.data.token);
      toast.success("Successfully authenticated! 🎉");
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Failed to authenticate. Please try again.");
    } finally {
      setIsAuthenticating(false);
    }
  }, [publicKey, signMessage, isAuthenticating]);

  useEffect(() => {
    signAndSend();
  }, [signAndSend]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-black/80 backdrop-blur-lg border-b border-violet-500/30 shadow-lg shadow-violet-500/10"
          : "bg-gradient-to-b from-black/50 to-transparent border-b border-violet-500/20"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-violet-600 to-purple-700 p-2 rounded-lg transform group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                MechaWorks
              </span>
              <span className="text-[10px] sm:text-xs text-violet-300/60 -mt-1 hidden sm:block">
                Decentralized Labeling
              </span>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-3">
            {isAuthenticating && (
              <div className="hidden sm:flex items-center space-x-2 text-violet-400 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-violet-400 border-t-transparent"></div>
                <span>Authenticating...</span>
              </div>
            )}
            <div className="wallet-adapter-button-trigger-wrapper">
              {publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
