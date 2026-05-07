import Image from "next/image"

export default function TextHome() {
    return (
        <div className="w-full max-w-[85vw] px-4 text-center md:text-7xl text-3xl font-semibold leading-[0.67] tracking-tigh ">
            {/* Line 1 */}
            <span>Bawa </span>
            <span className="inline-flex items-center translate-y-2 md:translate-y-4">
                <div className="relative h-12 w-12 md:h-24 md:w-24 -rotate-12 z-10">
                <Image src="/icons8/icons8-shop-100.png" alt="Shop" fill className="object-contain" />
                </div>
                <div className="relative h-12 w-12 md:h-24 md:w-24 rotate-12 -ml-6 md:-ml-10">
                <Image src="/icons8/icons8-decision-100.png" alt="Decision" fill className="object-contain" />
                </div>
            </span>
            <span> naik level,</span>

            <br />

            {/* Line 2 */}
            <span>tinggalkan batasan </span>
            <span className="inline-flex items-center translate-y-2 md:translate-y-4">
                <div className="relative h-12 w-12 md:h-24 md:w-24 -rotate-12 z-20">
                <Image src="/icons8/icons8-dice-100.png" alt="Dice" fill className="object-contain" />
                </div>
                <div className="relative h-12 w-12 md:h-24 md:w-24 -ml-6 md:-ml-10 z-10">
                <Image src="/icons8/icons8-book-100.png" alt="Book" fill className="object-contain" />
                </div>
                <div className="relative h-12 w-12 md:h-24 md:w-24 rotate-12 -ml-6 md:-ml-12">
                <Image src="/icons8/icons8-time-100.png" alt="Time" fill className="object-contain" />
                </div>
            </span>
            <span>.</span>

            <br />

            {/* Line 3 (The one missing in your code) */}
            <span>Karena ada</span>
            <span className="inline-flex items-center translate-y-2 md:translate-y-4">
                <div className="relative h-12 w-12 md:h-24 md:w-24 -rotate-12 z-10">
                <Image src="/icons8/icons8-treasure-100.png" alt="Shop" fill className="object-contain" />
                </div>
                <div className="relative h-12 w-12 md:h-24 md:w-24 rotate-12 -ml-6 md:-ml-10">
                <Image src="/icons8/icons8-improvement-100.png" alt="Decision" fill className="object-contain" />
                </div>
            </span>
            <span>di setiap transaksi.</span>
        </div>
    )
}