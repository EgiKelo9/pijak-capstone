import Image from "next/image";

export default function TextHome() {
    return (
        <div className="w-full max-w-[95vw] md:max-w-[85vw] px-2 md:px-4 flex flex-col gap-0 md:gap-0 text-center text-3xl sm:text-5xl md:text-6xl 2xl:text-7xl font-semibold tracking-tight">
            <div className="-mt-2">
                <span>Bawa </span>
                <span className="inline-flex items-center translate-y-1.5 md:translate-y-3 -mx-1">
                    <div className="relative h-10 w-10 md:h-24 md:w-24 -rotate-12 z-10">
                        <Image src="/icons8/icons8-shop-100.png" alt="Shop" fill className="object-contain" priority />
                    </div>
                    <div className="relative h-10 w-10 md:h-24 md:w-24 rotate-12 -ml-5 md:-ml-10">
                        <Image src="/icons8/icons8-decision-100.png" alt="Decision" fill className="object-contain" priority />
                    </div>
                </span>
                <span> naik level,</span>
            </div>

            <div className="-mt-2">
                <span>tinggalkan batasan </span>
                <span className="inline-flex items-center translate-y-1.5 md:translate-y-3 -mx-1">
                    <div className="relative h-10 w-10 md:h-24 md:w-24 -rotate-12 z-20">
                        <Image src="/icons8/icons8-dice-100.png" alt="Dice" fill className="object-contain" priority />
                    </div>
                    <div className="relative h-10 w-10 md:h-24 md:w-24 -ml-5 md:-ml-10 z-10">
                        <Image src="/icons8/icons8-book-100.png" alt="Book" fill className="object-contain" priority />
                    </div>
                    <div className="relative h-10 w-10 md:h-24 md:w-24 rotate-12 -ml-5 md:-ml-12">
                        <Image src="/icons8/icons8-time-100.png" alt="Time" fill className="object-contain" priority />
                    </div>
                </span>
                <span>.</span>
            </div>

            <div className="-mt-2">
                <span>Karena ada </span>
                <span className="inline-flex items-center translate-y-1.5 md:translate-y-3 -mx-1">
                    <div className="relative h-10 w-10 md:h-24 md:w-24 -rotate-12 z-10">
                        <Image src="/icons8/icons8-treasure-100.png" alt="Treasure" fill className="object-contain" priority />
                    </div>
                    <div className="relative h-10 w-10 md:h-24 md:w-24 rotate-12 -ml-5 md:-ml-10">
                        <Image src="/icons8/icons8-improvement-100.png" alt="Improvement" fill className="object-contain" priority />
                    </div>
                </span>
                <span> di setiap transaksi.</span>
            </div>
        </div>
    )
}