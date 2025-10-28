import { LinkIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <Link href="/editor">
      <Button>
        to editor
        <LinkIcon />
      </Button>
    </Link>
  );
}
