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
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { AttachedType } from "@/types";

interface Ai03Props {
  onSendMessage: (message: string, attachedType: AttachedType) => void;
  isLoading?: boolean;
}

export default function Ai03({ onSendMessage, isLoading }: Ai03Props) {
  const [input, setInput] = useState("");
  const [selectedPerformance, setSelectedPerformance] = useState("High");
  const [openMenu, setOpenMenu] = useState<"attachment" | "performance" | null>(null);
  const [attachedType, setAttachedType] = useState<AttachedType>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input, attachedType);
      setInput("");
      setAttachedType(null);
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
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </form>
        </div>

        {attachedType && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-full text-xs font-medium w-fit ml-3 mb-2">
            <span>📎 {attachedType === 'forecasting' ? 'Grafik Forecasting' : attachedType === 'clustering' ? 'Grafik Clustering' : 'Data Tabel'}</span>
            <button 
              type="button" 
              onClick={() => setAttachedType(null)} 
              className="ml-1 text-neutral-400 hover:text-neutral-600 font-bold"
              disabled={isLoading}
            >
              &times;
            </button>
          </div>
        )}

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
                  disabled={isLoading}
                >
                  <Plus className="size-3 text-neutral-600" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                className="max-w-xs rounded-2xl p-1.5 bg-white border-neutral-200 shadow-lg z-50"
              >
                <DropdownMenuGroup className="space-y-1">
                  <DropdownMenuItem
                    className="rounded-[calc(1rem-6px)] text-xs cursor-pointer hover:bg-neutral-100 flex items-center gap-2"
                    onClick={() => {
                      setAttachedType('forecasting');
                      setOpenMenu(null);
                    }}
                  >
                    <LineChart size={16} className="opacity-60" />
                    Sisipkan Grafik Forecasting
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-[calc(1rem-6px)] text-xs cursor-pointer hover:bg-neutral-100 flex items-center gap-2"
                    onClick={() => {
                      setAttachedType('clustering');
                      setOpenMenu(null);
                    }}
                  >
                    <Network size={16} className="opacity-60" />
                    Sisipkan Grafik Clustering
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-[calc(1rem-6px)] text-xs cursor-pointer hover:bg-neutral-100 flex items-center gap-2"
                    onClick={() => {
                      setAttachedType('table');
                      setOpenMenu(null);
                    }}
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
                  disabled={isLoading}
                >
                  <Zap className="size-3" />
                  <span className="text-xs font-medium">{selectedPerformance}</span>
                  <ChevronDown className="size-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="max-w-xs rounded-2xl p-1.5 bg-white border-neutral-200 shadow-lg z-50"
              >
                <DropdownMenuGroup className="space-y-1">
                  <DropdownMenuItem
                    className="rounded-[calc(1rem-6px)] text-xs cursor-pointer hover:bg-neutral-100 flex items-center gap-2"
                    onClick={() => {
                      setSelectedPerformance("High");
                      setOpenMenu(null);
                    }}
                  >
                    <Zap size={16} className="opacity-60" />
                    High
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-[calc(1rem-6px)] text-xs cursor-pointer hover:bg-neutral-100 flex items-center gap-2"
                    onClick={() => {
                      setSelectedPerformance("Medium");
                      setOpenMenu(null);
                    }}
                  >
                    <Gauge size={16} className="opacity-60" />
                    Medium
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-[calc(1rem-6px)] text-xs cursor-pointer hover:bg-neutral-100 flex items-center gap-2"
                    onClick={() => {
                      setSelectedPerformance("Low");
                      setOpenMenu(null);
                    }}
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
              disabled={!input.trim() || isLoading}
              className="size-7 p-0 rounded-full bg-[#2BBAEE] hover:bg-[#1a9fd4] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors flex items-center justify-center"
              onClick={handleSubmit}
            >
              {isLoading ? (
                <Loader2 className="size-3 text-white animate-spin" />
              ) : (
                <Send className="size-3 text-white" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
