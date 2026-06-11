"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  CircleDashed,
  Gauge,
  LineChart,
  Network,
  Plus,
  Send,
  TableProperties,
  Zap,
} from "lucide-react";
import { useState } from "react";

export default function Ai03() {
  const [input, setInput] = useState("");
  const [selectedPerformance, setSelectedPerformance] = useState("High");
  const [openMenu, setOpenMenu] = useState<"attachment" | "performance" | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden flex flex-col relative">
        <div className="px-3 pt-3 pb-2 grow">
          <form onSubmit={handleSubmit}>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanyakan sesuatu ke BeeZ..."
              className="w-full bg-transparent p-0 border-0 rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-neutral-800 placeholder-neutral-400 resize-none outline-none text-sm min-h-10 max-h-[9vh]"
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = target.scrollHeight + "px";
              }}
            />
          </form>
        </div>

        <div className="mb-2 px-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {/* Attachment Dropdown */}
            <DropdownMenu 
              open={openMenu === "attachment"} 
              onOpenChange={(open) => setOpenMenu(open ? "attachment" : null)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-full border border-neutral-200 hover:bg-neutral-100"
                >
                  <Plus className="size-3 text-neutral-600" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                className="max-w-xs rounded-2xl p-1.5 bg-white border-neutral-200 shadow-lg"
              >
                <DropdownMenuGroup className="space-y-1">
                  <DropdownMenuItem
                    className="rounded-[calc(1rem-6px)] text-xs cursor-pointer hover:bg-neutral-100 flex items-center gap-2"
                    onClick={() => {}}
                  >
                    <LineChart size={16} className="opacity-60" />
                    Sisipkan Grafik Forecasting
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-[calc(1rem-6px)] text-xs cursor-pointer hover:bg-neutral-100 flex items-center gap-2"
                    onClick={() => {}}
                  >
                    <Network size={16} className="opacity-60" />
                    Sisipkan Grafik Clustering
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-[calc(1rem-6px)] text-xs cursor-pointer hover:bg-neutral-100 flex items-center gap-2"
                    onClick={() => {}}
                  >
                    <TableProperties size={16} className="opacity-60" />
                    Sisipkan Data Tabel
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Performance Dropdown */}
        <DropdownMenu 
          open={openMenu === "performance"} 
          onOpenChange={(open) => setOpenMenu(open ? "performance" : null)}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
                  className="h-7 px-2.5 rounded-full border border-neutral-200 hover:bg-neutral-100 text-neutral-600 text-xs gap-1.5"
            >
                  <Zap className="size-3" />
                  <span className="text-xs font-medium">{selectedPerformance}</span>
                  <ChevronDown className="size-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
                className="max-w-xs rounded-2xl p-1.5 bg-white border-neutral-200 shadow-lg"
          >
            <DropdownMenuGroup className="space-y-1">
              <DropdownMenuItem
                    className="rounded-[calc(1rem-6px)] text-xs cursor-pointer hover:bg-neutral-100 flex items-center gap-2"
                onClick={() => setSelectedPerformance("High")}
              >
                    <Zap size={16} className="opacity-60" />
                High
              </DropdownMenuItem>
              <DropdownMenuItem
                    className="rounded-[calc(1rem-6px)] text-xs cursor-pointer hover:bg-neutral-100 flex items-center gap-2"
                onClick={() => setSelectedPerformance("Medium")}
              >
                    <Gauge size={16} className="opacity-60" />
                Medium
              </DropdownMenuItem>
              <DropdownMenuItem
                    className="rounded-[calc(1rem-6px)] text-xs cursor-pointer hover:bg-neutral-100 flex items-center gap-2"
                onClick={() => setSelectedPerformance("Low")}
              >
                    <CircleDashed size={16} className="opacity-60" />
                Low
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
          </div>

          <div>
            <Button
              type="submit"
              disabled={!input.trim()}
              className="size-7 p-0 rounded-full bg-[#2BBAEE] hover:bg-[#1a9fd4] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
              onClick={handleSubmit}
            >
              <Send className="size-3 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
