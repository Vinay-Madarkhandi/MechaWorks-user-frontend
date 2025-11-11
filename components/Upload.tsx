"use client";

import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { UploadImage } from "@/components/UploadImage";
import { BACKEND_URL, PAYMENT_WALLET_ADDRESS } from "@/utils";
import { getToken } from "@/utils/auth";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { toast } from "react-hot-toast";

const MAX_IMAGES = 10;
const MAX_TITLE_LENGTH = 200;
const PAYMENT_AMOUNT = 100000000; // 0.1 SOL in lamports

export const Upload = () => {
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [txSignature, setTxSignature] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();

  // Load saved state from localStorage on mount
  useEffect(() => {
    const savedTx = localStorage.getItem("pendingTxSignature");
    const savedTitle = localStorage.getItem("pendingTaskTitle");
    const savedImages = localStorage.getItem("pendingTaskImages");

    if (savedTx) {
      setTxSignature(savedTx);
      toast.success("Previous payment found. You can now submit your task!");
    }
    if (savedTitle) setTitle(savedTitle);
    if (savedImages) {
      try {
        setImages(JSON.parse(savedImages));
      } catch (e) {
        console.error("Failed to parse saved images");
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (txSignature) {
      localStorage.setItem("pendingTxSignature", txSignature);
    }
    if (title) {
      localStorage.setItem("pendingTaskTitle", title);
    }
    if (images.length > 0) {
      localStorage.setItem("pendingTaskImages", JSON.stringify(images));
    }
  }, [txSignature, title, images]);

  async function onSubmit() {
    if (!title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    if (title.length > MAX_TITLE_LENGTH) {
      toast.error(`Title must be less than ${MAX_TITLE_LENGTH} characters`);
      return;
    }

    if (images.length === 0) {
      toast.error("Please add at least one image");
      return;
    }

    if (!txSignature) {
      toast.error("Please complete payment first");
      return;
    }

    setIsLoading(true);
    try {
      const token = getToken();
      if (!token) {
        throw new Error("Please connect your wallet and sign in");
      }

      const response = await axios.post(
        `${BACKEND_URL}/v1/user/task`,
        {
          options: images.map((image) => ({
            imageUrl: image,
          })),
          title,
          signature: txSignature,
        },
        {
          headers: {
            Authorization: token,
          },
        }
      );

      // Clear saved state on success
      localStorage.removeItem("pendingTxSignature");
      localStorage.removeItem("pendingTaskTitle");
      localStorage.removeItem("pendingTaskImages");

      toast.success("Task created successfully!");
      router.push(`/task/${response.data.id}`);
    } catch (error) {
      console.error("Error submitting task:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create task";
      toast.error(errorMessage);

      // If it's an auth error, keep the tx signature for retry
      if (axios.isAxiosError(error) && error.response?.status !== 401) {
        // Keep the payment info for retry
        toast.error("Your payment is saved. Please try submitting again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function makePayment() {
    if (!publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a task title before payment");
      return;
    }

    if (images.length === 0) {
      toast.error("Please add at least one image before payment");
      return;
    }

    setIsLoading(true);
    try {
      // Check balance with dynamic fee estimation
      const balance = await connection.getBalance(publicKey);

      // Use a more reliable fee estimation (5000 lamports is standard for simple transfers)
      const estimatedFee = 10000; // ~0.00001 SOL, generous estimate for transaction fees

      if (balance < PAYMENT_AMOUNT + estimatedFee) {
        throw new Error(
          `Insufficient balance. Need at least ${
            (PAYMENT_AMOUNT + estimatedFee) / 1e9
          } SOL`
        );
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(PAYMENT_WALLET_ADDRESS),
          lamports: PAYMENT_AMOUNT,
        })
      );

      const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight },
      } = await connection.getLatestBlockhashAndContext();

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection, {
        minContextSlot,
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 5,
      });

      toast.success("Transaction sent! Waiting for confirmation...");

      // Use WebSocket for real-time confirmation instead of polling
      const confirmationPromise = new Promise((resolve, reject) => {
        const subscriptionId = connection.onSignature(
          signature,
          (result, context) => {
            if (result.err) {
              reject(new Error("Transaction failed"));
            } else {
              resolve(result);
            }
          },
          "finalized"
        );

        // Set a timeout in case WebSocket doesn't respond
        setTimeout(() => {
          connection.removeSignatureListener(subscriptionId);
          reject(new Error("Transaction confirmation timeout"));
        }, 60000); // 60 second timeout
      });

      await confirmationPromise;

      // Small additional wait for backend indexing
      toast.success("Payment finalized! Processing...");
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Just 3 seconds now

      setTxSignature(signature);
      toast.success("Payment successful! You can now submit your task.");
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Payment failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  function handleAddImage(imageUrl: string) {
    if (images.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    setImages((prev) => [...prev, imageUrl]);
  }

  function handleRemoveImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    toast.success("Image removed");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-violet-950/20 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header with animation */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent mb-4">
            Create a Task
          </h2>
          <p className="text-violet-300/70 text-sm sm:text-base">
            Upload images and get them labeled by our community
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-gradient-to-br from-violet-950/40 to-purple-950/40 backdrop-blur-xl rounded-3xl border border-violet-500/20 shadow-2xl shadow-violet-500/10 overflow-hidden">
          {/* Progress indicator */}
          <div className="bg-black/30 px-6 py-4 border-b border-violet-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div
                  className={`flex items-center space-x-2 ${
                    title.trim() ? "text-green-400" : "text-violet-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      title.trim()
                        ? "bg-green-500/20 border-green-400"
                        : "bg-violet-500/20 border-violet-400"
                    }`}
                  >
                    {title.trim() ? "✓" : "1"}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">
                    Task Details
                  </span>
                </div>
                <div className="w-12 h-px bg-violet-500/30"></div>
                <div
                  className={`flex items-center space-x-2 ${
                    images.length > 0 ? "text-green-400" : "text-violet-400/50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      images.length > 0
                        ? "bg-green-500/20 border-green-400"
                        : "bg-violet-500/10 border-violet-400/50"
                    }`}
                  >
                    {images.length > 0 ? "✓" : "2"}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">
                    Upload Images
                  </span>
                </div>
                <div className="w-12 h-px bg-violet-500/30"></div>
                <div
                  className={`flex items-center space-x-2 ${
                    txSignature ? "text-green-400" : "text-violet-400/50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      txSignature
                        ? "bg-green-500/20 border-green-400"
                        : "bg-violet-500/10 border-violet-400/50"
                    }`}
                  >
                    {txSignature ? "✓" : "3"}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">
                    Payment
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* Task Title Section */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-violet-200 font-medium">
                <svg
                  className="w-5 h-5 text-violet-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Task Title</span>
                <span className="text-red-400">*</span>
              </label>
              <input
                onChange={(e) => setTitle(e.target.value)}
                type="text"
                id="task_title"
                maxLength={MAX_TITLE_LENGTH}
                className="w-full bg-black/40 border border-violet-500/30 text-violet-100 text-base rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent px-4 py-3 transition-all placeholder:text-violet-400/40 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g., Label images of street signs"
                required
                value={title}
                disabled={isLoading}
              />
              <div className="flex justify-between items-center text-xs">
                <span className="text-violet-400/60">
                  Describe what needs to be labeled
                </span>
                <span
                  className={`font-medium ${
                    title.length > MAX_TITLE_LENGTH * 0.9
                      ? "text-orange-400"
                      : "text-violet-300/60"
                  }`}
                >
                  {title.length}/{MAX_TITLE_LENGTH}
                </span>
              </div>
            </div>

            {/* Images Section */}
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-violet-200 font-medium">
                  <svg
                    className="w-5 h-5 text-violet-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Images</span>
                  <span className="text-red-400">*</span>
                </div>
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${
                    images.length === 0
                      ? "bg-violet-500/10 text-violet-400/60"
                      : images.length >= MAX_IMAGES
                      ? "bg-orange-500/20 text-orange-400"
                      : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {images.length}/{MAX_IMAGES}
                </span>
              </label>

              {/* Images Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="animate-fade-in">
                    <UploadImage
                      image={image}
                      onImageAdded={handleAddImage}
                      onImageRemoved={() => handleRemoveImage(index)}
                      disabled={isLoading}
                    />
                  </div>
                ))}

                {/* Add new image button */}
                {images.length < MAX_IMAGES && (
                  <div className="animate-fade-in">
                    <UploadImage
                      onImageAdded={handleAddImage}
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>

              {images.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-violet-500/20 rounded-xl bg-violet-950/20">
                  <p className="text-violet-400/60 text-sm">
                    No images uploaded yet. Add at least one image to continue.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-violet-500/20">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {txSignature ? (
                  <button
                    onClick={onSubmit}
                    disabled={isLoading}
                    type="button"
                    className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:scale-105 hover:shadow-xl hover:shadow-green-500/50"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Submitting Task...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>Submit Task</span>
                        </>
                      )}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={makePayment}
                    disabled={isLoading || !title.trim() || images.length === 0}
                    type="button"
                    className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:scale-105 hover:shadow-xl hover:shadow-violet-500/50"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <span>Pay 0.1 SOL</span>
                        </>
                      )}
                    </span>
                  </button>
                )}
              </div>

              {/* Payment confirmation */}
              {txSignature && (
                <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl animate-fade-in">
                  <div className="flex items-start space-x-3">
                    <svg
                      className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-400 mb-1">
                        Payment Confirmed!
                      </p>
                      <p className="text-xs text-green-400/70 break-all">
                        Transaction: {txSignature.slice(0, 8)}...
                        {txSignature.slice(-8)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Requirements checklist */}
              {!txSignature && (
                <div className="mt-6 p-4 bg-violet-950/30 border border-violet-500/20 rounded-xl">
                  <p className="text-xs font-medium text-violet-300 mb-3">
                    Requirements to proceed:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-xs">
                      {title.trim() ? (
                        <svg
                          className="w-4 h-4 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-violet-500/40"></div>
                      )}
                      <span
                        className={
                          title.trim() ? "text-green-400" : "text-violet-400/60"
                        }
                      >
                        Task title provided
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      {images.length > 0 ? (
                        <svg
                          className="w-4 h-4 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-violet-500/40"></div>
                      )}
                      <span
                        className={
                          images.length > 0
                            ? "text-green-400"
                            : "text-violet-400/60"
                        }
                      >
                        At least one image uploaded
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      {publicKey ? (
                        <svg
                          className="w-4 h-4 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-violet-500/40"></div>
                      )}
                      <span
                        className={
                          publicKey ? "text-green-400" : "text-violet-400/60"
                        }
                      >
                        Wallet connected
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
