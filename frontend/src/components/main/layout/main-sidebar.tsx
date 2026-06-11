'use client';

import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/animate-ui/components/radix/sidebar';
import { getStrictContext } from '@/lib/get-strict-context';
import * as React from 'react';
import type { TerminalStep } from './analisis/terminal';
import { AppSidebarFooter } from './app-sidebar-footer';
import { AppSidebarHeader } from './app-sidebar-header';
import { AppSidebarNav } from './app-sidebar-nav';
import { AppSidebarTopbar } from './app-sidebar-topbar';

// 1. Create a shared context for terminal logs
interface ITerminalContext {
  logs: TerminalStep[];
  setLogs: React.Dispatch<React.SetStateAction<TerminalStep[]>>;
}

export const [TerminalContextProvider, useTerminal] =
  getStrictContext<ITerminalContext>('TerminalContext');

function TerminalAwareAppSidebarLayout({ children, defaultOpen = true }: { children: React.ReactNode; defaultOpen?: boolean }) {
  const [logs, setLogs] = React.useState<TerminalStep[]>([]);
  const contextValue = { logs, setLogs };

  return (
    <TerminalContextProvider value={contextValue}>
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={{
          '--sidebar-width': '18rem',
          '--sidebar-width-icon': '5rem',
        } as React.CSSProperties}
      >
        <Sidebar collapsible="icon" animateOnHover={false} className="bg-[#F3F3F3] border-r border-black/10 overflow-visible">
          <AppSidebarHeader />
          <AppSidebarNav />
          <AppSidebarFooter />
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 bg-white min-h-0 min-w-0">
          <AppSidebarTopbar />

          <main className="flex-1 flex flex-col p-5 min-h-0 min-w-0 overflow-hidden">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TerminalContextProvider>
  );
}

export const AppSidebarLayout = TerminalAwareAppSidebarLayout;