import * as React from 'react';

import {
  Tabs as TabsPrimitive,
  TabsList as TabsListPrimitive,
  TabsTrigger as TabsTriggerPrimitive,
  TabsContent as TabsContentPrimitive,
  TabsContents as TabsContentsPrimitive,
  TabsHighlight as TabsHighlightPrimitive,
  TabsHighlightItem as TabsHighlightItemPrimitive,
  type TabsProps as TabsPrimitiveProps,
  type TabsListProps as TabsListPrimitiveProps,
  type TabsTriggerProps as TabsTriggerPrimitiveProps,
  type TabsContentProps as TabsContentPrimitiveProps,
  type TabsContentsProps as TabsContentsPrimitiveProps,
} from '@/components/animate-ui/primitives/animate/tabs';
import { cn } from '@/lib/utils';

type TabsProps = TabsPrimitiveProps;

function Tabs({ className, ...props }: TabsProps) {
  return (
    <TabsPrimitive
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  );
}

type TabsListProps = TabsListPrimitiveProps;

function TabsList({ className, ...props }: TabsListProps) {
  return (
    // RESTORED: We apply the active Cyan gradient to the HighlightPrimitive here.
    // This allows the animation library to slide this specific shape between the tabs.
    <TabsHighlightPrimitive className="absolute z-0 inset-0 bg-gradient-to-b from-[#90FDF2] to-[#2BBAEE] rounded-[24px]">
      <TabsListPrimitive
        className={cn(
          // Track/Container: Dark Gradient, 65px height, 32px radius, 8px padding (p-2)
          'flex flex-row items-center p-2 gap-[6px] h-[65px] w-fit rounded-[32px]',
          'bg-gradient-to-r from-[#2D2D2D] via-[#272727] to-[#2D2D2D] shadow-sm',
          className,
        )}
        {...props}
      />
    </TabsHighlightPrimitive>
  );
}

type TabsTriggerProps = TabsTriggerPrimitiveProps;

function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <TabsHighlightItemPrimitive value={props.value} className="flex-1">
      <TabsTriggerPrimitive
        className={cn(
          // Base Structure & Positioning (relative z-10 ensures text sits above the sliding highlight)
          'relative z-10 inline-flex flex-1 w-full h-[49px] items-center justify-center gap-[10px] rounded-[24px] px-6 py-4',
          'font-[510] text-[24px] leading-[29px] whitespace-nowrap',
          
          // --- INACTIVE STATE ---
          // The background gradient is clipped entirely to the text, making the button itself transparent
          // so the dark track shows through, while the text appears as the gradient.
          'bg-gradient-to-b from-[#90FDF2] to-[#2BBAEE] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]',
          
          // --- ACTIVE STATE ---
          // When active, the text fill color transitions to dark #272727.
          // Because the button itself is still transparent, the sliding cyan thumb (from TabsHighlightPrimitive) 
          // becomes fully visible right behind this text!
          'data-[state=active]:text-[#272727] data-[state=active]:[-webkit-text-fill-color:#272727]',

          // Transitions & Accessibility
          'transition-all duration-500 ease-in-out',
          'focus-visible:ring-[3px] focus-visible:ring-[#2BBAEE]/50 focus-visible:outline-none',
          'disabled:pointer-events-none disabled:opacity-50',
          
          // SVG Handling
          "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
          className,
        )}
        {...props}
      />
    </TabsHighlightItemPrimitive>
  );
}

type TabsContentsProps = TabsContentsPrimitiveProps;

function TabsContents(props: TabsContentsProps) {
  return <TabsContentsPrimitive {...props} />;
}

type TabsContentProps = TabsContentPrimitiveProps;

function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <TabsContentPrimitive
      className={cn('outline-none', className)}
      {...props}
    />
  );
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContents,
  TabsContent,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
  type TabsContentsProps,
  type TabsContentProps,
};