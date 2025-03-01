"use client";
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useCallback } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/utils";

export const Appbar = () => {
  const { publicKey, signMessage } = useWallet();

  const signAndSend = useCallback(async () => {
    if (!publicKey) {
      return;
    }
    const message = new TextEncoder().encode("Sign into mechanical turks");
    const signature = await signMessage?.(message);
    console.log(signature);
    console.log(publicKey);
    const response = await axios.post(`${BACKEND_URL}/v1/user/signin`, {
      signature,
      publicKey: publicKey?.toString(),
    });

    localStorage.setItem("token", response.data.token);
  }, [publicKey, signMessage]);

  useEffect(() => {
    signAndSend();
  }, [signAndSend]); // Now using the memoized function in the dependency array

  return (
    <div className="flex justify-between border-b border-violet-500 pb-2 pt-2 bg-black">
      <div className="text-2xl pl-4 flex justify-center pt-3 text-violet-400">
        MechaWorks
      </div>
      <div className="text-xl pr-4 pb-2">
        {publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />}
      </div>
    </div>
  );
};
