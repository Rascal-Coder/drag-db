"use client";
import {
  AlignCenterIcon,
  Database,
  Download,
  Link2,
  Maximize2,
  Moon,
  Plus,
  Redo,
  Save,
  Search,
  Share2,
  Sun,
  Table,
  Undo,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Canvas from "./components/canvas";
import { CanvasContextProvider } from "./components/canvas/context/canvas-context";
import DiagramContextProvider from "./components/canvas/context/diagram-context";
import TransformContextProvider from "./components/canvas/context/transform-context";
import { useDiagram, useTransform } from "./components/canvas/hooks";
import type { TableData } from "./components/canvas/modules/table";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <Button aria-hidden className="h-8 w-8" size="icon" variant="ghost">
        <Moon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="h-8 w-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          size="icon"
          variant="ghost"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </TooltipContent>
    </Tooltip>
  );
}
function getTablesCenter(tables: TableData[]): { x: number; y: number } | null {
  if (!tables.length) {
    return null;
  }
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const t of tables) {
    if (t.x < minX) {
      minX = t.x;
    }
    if (t.x > maxX) {
      maxX = t.x;
    }
    if (t.y < minY) {
      minY = t.y;
    }
    if (t.y > maxY) {
      maxY = t.y;
    }
  }
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}
export default function EditorPage() {
  const [activeTab, setActiveTab] = useState("tables");

  return (
    <DiagramContextProvider>
      <TransformContextProvider>
        <div className="flex h-screen w-screen flex-col bg-background">
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between border-b bg-background/95 px-4 py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <nav className="flex flex-col gap-1">
                <span className="ms-3 font-semibold text-lg">DBDesigner</span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost">
                    File
                  </Button>
                  <Button size="sm" variant="ghost">
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost">
                    View
                  </Button>
                  <Button size="sm" variant="ghost">
                    Settings
                  </Button>
                  <Button size="sm" variant="ghost">
                    Help
                  </Button>
                </div>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <Button className="gap-2" size="sm" variant="outline">
                <Share2 className="h-3 w-3" />
                Share
              </Button>
            </div>
          </header>

          {/* Toolbar */}
          <div className="flex shrink-0 items-center gap-1 border-b bg-background px-4 py-2">
            <TooltipProvider>
              {/* View Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-8" size="sm" variant="ghost">
                    <AlignCenterIcon className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Fit to Screen</DropdownMenuItem>
                  <DropdownMenuItem>Sidebar Menu</DropdownMenuItem>
                  <DropdownMenuItem>Issues</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Zoom Display */}
              <Button className="h-8 min-w-[60px]" size="sm" variant="ghost">
                82%
              </Button>

              {/* Zoom Controls */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="h-8 w-8" size="icon" variant="ghost">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="h-8 w-8" size="icon" variant="ghost">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>

              {/* Divider */}
              <div className="mx-1 h-6 w-px bg-border" />

              {/* Undo/Redo */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="h-8 w-8" size="icon" variant="ghost">
                    <Undo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="h-8 w-8" size="icon" variant="ghost">
                    <Redo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo</TooltipContent>
              </Tooltip>

              {/* Divider */}
              <div className="mx-1 h-6 w-px bg-border" />

              {/* Tools */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="h-8 w-8" size="icon" variant="ghost">
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="h-8 w-8" size="icon" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export</TooltipContent>
              </Tooltip>

              {/* Divider */}
              <div className="mx-1 h-6 w-px bg-border" />

              {/* Theme Toggle */}
              <ThemeToggle />
            </TooltipProvider>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden">
            <ResizablePanelGroup className="flex-1" direction="horizontal">
              {/* Left Sidebar */}
              <ResizablePanel
                className="border-r bg-muted/30 transition-all duration-300"
                defaultSize={20}
                maxSize={30}
                minSize={20}
              >
                <div className="flex h-full flex-col">
                  {/* Tabs */}
                  <Tabs
                    className="flex flex-1 flex-col"
                    onValueChange={setActiveTab}
                    value={activeTab}
                  >
                    <TabsList className="w-full rounded-none border-b">
                      <TabsTrigger className="flex-1" value="tables">
                        <Table className="mr-2 h-4 w-4" />
                        Tables
                      </TabsTrigger>
                      <TabsTrigger className="flex-1" value="relations">
                        <Link2 className="mr-2 h-4 w-4" />
                        Relations
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent className="m-0 flex-1 p-0" value="tables">
                      <ScrollArea className="h-full">
                        <div className="p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="font-medium text-muted-foreground text-sm">
                              Tables (0)
                            </span>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  className="h-7 w-7 p-0"
                                  size="sm"
                                  variant="ghost"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add Table</DialogTitle>
                                  <DialogDescription>
                                    Create a new table in your database schema
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid gap-2">
                                    <label htmlFor="name">Table Name</label>
                                    <Input id="name" placeholder="users" />
                                  </div>
                                  <div className="grid gap-2">
                                    <label htmlFor="description">
                                      Description
                                    </label>
                                    <Input
                                      id="description"
                                      placeholder="User accounts table"
                                    />
                                  </div>
                                </div>
                                <Button>Create Table</Button>
                              </DialogContent>
                            </Dialog>
                          </div>

                          <div className="space-y-2">
                            {/* Search */}
                            <div className="border-b p-4">
                              <div className="relative">
                                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
                                <Input className="pl-9" placeholder="Search" />
                              </div>
                            </div>
                            {/* Table items will be rendered here */}
                            <div className="py-8 text-center text-muted-foreground text-sm">
                              No tables yet. Click + to add one.
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent className="m-0 flex-1 p-0" value="relations">
                      <ScrollArea className="h-full">
                        <div className="p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="font-medium text-muted-foreground text-sm">
                              Relations (0)
                            </span>
                            <Button
                              className="h-7 w-7 p-0"
                              size="sm"
                              variant="ghost"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {/* Search */}
                            <div className="border-b p-4">
                              <div className="relative">
                                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
                                <Input className="pl-9" placeholder="Search" />
                              </div>
                            </div>
                            {/* Relation items will be rendered here */}
                            <div className="py-8 text-center text-muted-foreground text-sm">
                              No relations yet.
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Main Canvas Area */}
              <ResizablePanel defaultSize={80} maxSize={80} minSize={70}>
                <div className="relative h-full bg-background">
                  {/* Canvas content will be rendered here */}
                  <CanvasContextProvider className="h-full w-full">
                    <Canvas />
                  </CanvasContextProvider>

                  {/* Canvas Controls */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            className="h-8 w-8"
                            size="icon"
                            variant="outline"
                          >
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Zoom In</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            className="h-8 w-8"
                            size="icon"
                            variant="outline"
                          >
                            <ZoomOut className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Zoom Out</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CenterViewButton className="h-8 w-8" />
                        </TooltipTrigger>
                        <TooltipContent>Center View</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            className="h-8 w-8"
                            size="icon"
                            variant="outline"
                          >
                            <Maximize2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Fullscreen</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </TransformContextProvider>
    </DiagramContextProvider>
  );
}
function CenterViewButton({ className }: { className?: string }) {
  const { tables } = useDiagram();
  const { setTransform } = useTransform();
  const onClick = () => {
    const center = getTablesCenter(tables);
    setTransform((prev) => ({ ...prev, pan: center ?? { x: 0, y: 0 } }));
  };
  return (
    <Button
      className={className}
      onClick={onClick}
      size="icon"
      variant="outline"
    >
      <AlignCenterIcon className="h-4 w-4" />
    </Button>
  );
}
