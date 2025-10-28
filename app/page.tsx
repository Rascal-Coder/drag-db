"use client";
import { LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
export default function Home() {
  const router = useRouter();
  return (
    <Button onClick={() => router.push("/editor")}>
      to editor
      <LinkIcon />
    </Button>
  );
}
