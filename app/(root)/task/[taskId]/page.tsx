"use client";
import { Appbar } from "@/components/Appbar";
import { BACKEND_URL } from "@/utils";
import axios from "axios";
import { useEffect, useState } from "react";
import Image from "next/image";

async function getTaskDetails(taskId: string) {
  const response = await axios.get(
    `${BACKEND_URL}/v1/user/task?taskId=${taskId}`,
    {
      headers: {
        Authorization: localStorage.getItem("token"),
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

  useEffect(() => {
    getTaskDetails(taskId).then((data) => {
      setResult(data.result);
      setTaskDetails(data.taskDetails);
    });
  }, [taskId]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Appbar />
      <div className="text-3xl pt-20 flex justify-center font-bold text-violet-400">
        {taskDetails.title}
      </div>
      <div className="flex justify-center gap-8 pt-12 px-4 flex-wrap">
        {Object.keys(result || {}).map((optionId) => (
          <Task
            key={optionId}
            imageUrl={result[optionId].option.imageUrl}
            votes={result[optionId].count}
          />
        ))}
      </div>
    </div>
  );
}

function Task({ imageUrl, votes }: { imageUrl: string; votes: number }) {
  return (
    <div className="bg-black p-4 rounded-lg">
      <div className="p-2 w-80 h-80 relative rounded-md">
        <Image
          className="object-cover rounded-md"
          src={imageUrl}
          alt="Task option"
          fill
          sizes="320px"
        />
      </div>
      <div className="flex justify-center text-violet-500 font-medium text-lg mt-2">
        {votes}
      </div>
    </div>
  );
}
