"use client";

import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { UploadImage } from "@/components/UploadImage";
import { BACKEND_URL } from "@/utils";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';

export const Upload = () => {
    const [images, setImages] = useState<string[]>([]);
    const [title, setTitle] = useState("");
    const [txSignature, setTxSignature] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const router = useRouter();

    async function onSubmit() {
        if (!title.trim()) {
            toast.error("Please enter a task title");
            return;
        }

        if (images.length === 0) {
            toast.error("Please add at least one image");
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Authentication token not found");
            }

            const response = await axios.post(`${BACKEND_URL}/v1/user/task`, {
                options: images.map(image => ({
                    imageUrl: image,
                })),
                title,
                signature: txSignature
            }, {
                headers: {
                    "Authorization": token
                }
            });

            toast.success("Task created successfully!");
            router.push(`/task/${response.data.id}`);
        } catch (error) {
            console.error("Error submitting task:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create task");
        } finally {
            setIsLoading(false);
        }
    }

    async function makePayment() {
        if (!publicKey) {
            toast.error("Please connect your wallet first");
            return;
        }

        setIsLoading(true);
        try {
            // Check balance
            const balance = await connection.getBalance(publicKey);
            if (balance < 100000000 + 5000) { // Amount + fees
                throw new Error("Insufficient balance for transaction");
            }

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new PublicKey("9isxjm1LY96pK8veLHYkHG72edjQ85A1qTbQjSFsfLC8"),
                    lamports: 100000000,
                })
            );

            const {
                context: { slot: minContextSlot },
                value: { blockhash, lastValidBlockHeight }
            } = await connection.getLatestBlockhashAndContext();

            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            const signature = await sendTransaction(transaction, connection, { 
                minContextSlot,
                skipPreflight: false,
                preflightCommitment: 'confirmed',
                maxRetries: 5
            });

            await connection.confirmTransaction({ 
                blockhash, 
                lastValidBlockHeight, 
                signature 
            }, 'confirmed');

            setTxSignature(signature);
            toast.success("Payment successful!");
        } catch (error) {
            console.error("Payment error:", error);
            toast.error(error instanceof Error ? error.message : "Payment failed");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex justify-center bg-black min-h-screen">
            <div className="max-w-screen-lg w-full">
                <div className="text-3xl text-violet-400 pt-20 w-full pl-4 font-bold">
                    Create a task
                </div>

                <label className="pl-4 block mt-4 text-md font-medium text-violet-200">
                    Task details
                </label>

                <input 
                    onChange={(e) => setTitle(e.target.value)}
                    type="text"
                    id="first_name"
                    className="ml-4 mt-2 bg-black border border-violet-500 text-violet-100 text-sm rounded-lg focus:ring-violet-500 focus:border-violet-500 block w-full p-3"
                    placeholder="What is your task?"
                    required
                    value={title}
                />

                <label className="pl-4 block mt-8 text-md font-medium text-violet-200">
                    Add Images
                </label>
                
                <div className="grid grid-cols-3 gap-4 p-4 max-w-screen-lg">
                    {images.map((image, index) => (
                        <UploadImage 
                            key={index}
                            image={image}
                            onImageAdded={(imageUrl) => {
                                setImages(prev => [...prev, imageUrl]);
                            }}
                        />
                    ))}
                </div>

                <div className="ml-4 pt-2 flex justify-center">
                    <UploadImage 
                        onImageAdded={(imageUrl) => {
                            setImages(prev => [...prev, imageUrl]);
                        }}
                    />
                </div>

                <div className="flex justify-center">
                    <button 
                        onClick={txSignature ? onSubmit : makePayment}
                        disabled={isLoading}
                        type="button"
                        className={`mt-6 text-white bg-violet-700 hover:bg-violet-800 focus:outline-none focus:ring-4 focus:ring-violet-500 font-medium rounded-full text-sm px-8 py-3 me-2 mb-2 transition-all duration-200 ${
                            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                        }`}
                    >
                        {isLoading 
                            ? "Processing..." 
                            : txSignature 
                                ? "Submit Task" 
                                : "Pay 0.1 SOL"
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};