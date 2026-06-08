'use client';

import * as React from 'react';

import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/animate-ui/components/radix/sidebar';
import { AppSidebarFooter } from './app-sidebar-footer';
import { AppSidebarHeader } from './app-sidebar-header';
import { AppSidebarNav } from './app-sidebar-nav';
import { AppSidebarTopbar } from './app-sidebar-topbar';

export const AppSidebarLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider
      style={{
        '--sidebar-width': '18rem',        // slightly narrower than 22rem
        '--sidebar-width-icon': '5rem',    // tighter collapsed width
      } as React.CSSProperties}
    >
      {/*
        KEY FIX: overflow-visible on the sidebar itself so icon tooltips/hover
        states don't get clipped in collapsed mode. The border-r is moved to
        SidebarInset side so it doesn't depend on sidebar overflow.
      */}
      <Sidebar collapsible="icon" animateOnHover={false} className="bg-[#F3F3F3] border-r border-black/10 overflow-visible">

        <AppSidebarHeader />
        <AppSidebarNav />
        <AppSidebarFooter />

      </Sidebar>

      {/* ── MAIN CONTENT ── */}
      <SidebarInset className="flex flex-col flex-1 bg-white min-h-0 min-w-0">

        <AppSidebarTopbar />

        <main className="flex-1 flex flex-col p-5 min-h-0 min-w-0 overflow-hidden">
          {children}
        </main>

      </SidebarInset>
    </SidebarProvider>
  );
};