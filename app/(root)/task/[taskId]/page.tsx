"use client";
import { Appbar } from "@/components/Appbar";
import { BACKEND_URL } from "@/utils";
import { getToken } from "@/utils/auth";
import axios from "axios";
import { useEffect, useState } from "react";
import Image from "next/image";
import { toast, Toaster } from "react-hot-toast";

async function getTaskDetails(taskId: string) {
  const response = await axios.get(
    `${BACKEND_URL}/v1/user/task?taskId=${taskId}`,
    {
      headers: {
        Authorization: getToken(),
      },
    }
  );
  return response.data;
}

export default function Page({
  params: { taskId },
}: {
  params: { taskId: string };
}) {
  const [result, setResult] = useState<
    Record<
      string,
      {
        count: number;
        option: {
          imageUrl: string;
        };
      }
    >
  >({});
  const [taskDetails, setTaskDetails] = useState<{
    title?: string;
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getTaskDetails(taskId)
      .then((data) => {
        setResult(data.result);
        setTaskDetails(data.taskDetails);
      })
      .catch((err) => {
        console.error("Error fetching task details:", err);
        const errorMessage =
          err.response?.data?.message || "Failed to load task details";
        setError(errorMessage);
        toast.error(errorMessage);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [taskId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-violet-950/20 to-black">
      <Appbar />
      <Toaster position="top-right" />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-violet-500/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-violet-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-xl text-violet-300 animate-pulse">
                Loading task details...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-center space-y-2">
                <p className="text-2xl font-bold text-red-400">
                  Error Loading Task
                </p>
                <p className="text-red-300/70">{error}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="inline-block px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-full">
                  <span className="text-sm text-violet-300 font-medium">
                    Task Results
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                  {taskDetails.title}
                </h1>
                <p className="text-violet-300/60 text-sm sm:text-base">
                  View voting results for this task
                </p>
              </div>

              {/* Stats Summary */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <div className="bg-gradient-to-br from-violet-950/40 to-purple-950/40 backdrop-blur-xl border border-violet-500/20 rounded-2xl px-6 py-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-violet-300">
                      {Object.keys(result || {}).length}
                    </p>
                    <p className="text-xs text-violet-400/60 mt-1">Options</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-violet-950/40 to-purple-950/40 backdrop-blur-xl border border-violet-500/20 rounded-2xl px-6 py-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-violet-300">
                      {Object.values(result || {}).reduce(
                        (sum, item) => sum + item.count,
                        0
                      )}
                    </p>
                    <p className="text-xs text-violet-400/60 mt-1">
                      Total Votes
                    </p>
                  </div>
                </div>
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Object.keys(result || {}).map((optionId, index) => (
                  <div
                    key={optionId}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Task
                      imageUrl={result[optionId].option.imageUrl}
                      votes={result[optionId].count}
                    />
                  </div>
                ))}
              </div>

              {Object.keys(result || {}).length === 0 && (
                <div className="text-center py-20">
                  <div className="inline-flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-violet-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                    </div>
                    <p className="text-violet-400/60">No voting results yet</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Task({ imageUrl, votes }: { imageUrl: string; votes: number }) {
  return (
    <div className="group relative bg-gradient-to-br from-violet-950/40 to-purple-950/40 backdrop-blur-xl border border-violet-500/20 rounded-2xl overflow-hidden hover:border-violet-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/20 hover:scale-105">
      <div className="relative w-full aspect-square">
        <Image
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          src={imageUrl}
          alt="Task option"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
      </div>

      {/* Vote count badge */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center justify-between bg-black/60 backdrop-blur-md rounded-xl px-4 py-3 border border-violet-500/30">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-violet-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            <span className="text-sm text-violet-300 font-medium">Votes</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            {votes}
          </span>
        </div>
      </div>
    </div>
  );
}
