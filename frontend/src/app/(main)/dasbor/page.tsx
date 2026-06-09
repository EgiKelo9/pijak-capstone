'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/animate-ui/components/animate/tabs";
import { AnalysisCard } from "@/components/main-card";
import { Cpu, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function MainDashboar() {
    const [activeTab, setActiveTab] = useState<'forecasting' | 'clustering'>('forecasting')

    return (
        <>
        {/* Main Container */}
        <div className="flex gap-4 w-full h-full">
            {/* Left */}
            <div className="flex flex-col gap-4 w-full h-full">
                <div className="flex gap-4 w-full h-full">
                    <AnalysisCard title={"Visualisasi Cluster"} className="w-full">
                        TODO: Scatter Plot, i think
                    </AnalysisCard>
                    
                    <AnalysisCard title={"Analisis Produk"} className="w-full">
                        TODO: Simple Table
                    </AnalysisCard>
                </div>

                <AnalysisCard title={"Visualisasi Forecasting"} className="w-full h-full">
                    TODO: Line Chart
                </AnalysisCard>

            </div>
            {/* Right */}
            <aside className="w-[33vw] md:w-[48vw]">
                <AnalysisCard
                    title="Tanya BeeZ AI"
                    className="h-full w-full"
                    innerClassName="flex flex-col p-3 md:p-4 gap-2 relative group/chat overflow-hidden"
                >
                    <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as 'forecasting' | 'clustering')}
                    className="flex flex-col flex-1 min-h-0 w-full"
                    >
                    <div className="absolute top-3 inset-x-0 z-20 flex justify-center opacity-0 -translate-y-1 pointer-events-none group-hover/chat:opacity-100 group-hover/chat:translate-y-0 group-hover/chat:pointer-events-auto transition-all duration-300 ease-out">
                        <TabsList className="shadow-md backdrop-blur-md bg-white/85 border border-neutral-200/60 gap-1 p-1">
                        <TabsTrigger
                            value="forecasting"
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                            <TrendingUp className="size-3" />
                            Forecasting
                        </TabsTrigger>
                        <TabsTrigger
                            value="clustering"
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                            <Cpu className="size-3" />
                            Clustering
                        </TabsTrigger>
                        </TabsList>
                    </div>
                    <div className="relative flex-1 min-h-0 w-full mt-1">
                        {/* Forecasting panel */}
                        <TabsContent
                        value="forecasting"
                        forceMount
                        className={[
                            'absolute ransition-opacity duration-300',
                            activeTab === 'forecasting'
                            ? 'opacity-100 pointer-events-auto z-10'
                            : 'opacity-0 pointer-events-none z-0',
                        ].join(' ')}
                        >
                            a
                        </TabsContent>
            
                        {/* Clustering panel */}
                        <TabsContent
                        value="clustering"
                        forceMount
                        className={[
                            'absolute ransition-opacity duration-300',
                            activeTab === 'clustering'
                            ? 'opacity-100 pointer-events-auto z-10'
                            : 'opacity-0 pointer-events-none z-0',
                        ].join(' ')}
                        >
                            ab
                        </TabsContent>
            
                    </div>
                    </Tabs>
                </AnalysisCard>
            </aside>
        </div>
        </>
    )
}