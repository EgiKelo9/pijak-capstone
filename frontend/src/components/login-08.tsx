"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockLogin } from "@/lib/middle-man";
import { EyeIcon, EyeOffIcon, Key } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JSX, SVGProps, useState } from "react";

const Logo = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
  <svg fill="currentColor" height="48" viewBox="0 0 40 48" width="40" {...props}>
    <clipPath id="a">
      <path d="m0 0h40v48h-40z" />
    </clipPath>
    <g clipPath="url(#a)">
      <path d="m25.0887 5.05386-3.933-1.05386-3.3145 12.3696-2.9923-11.16736-3.9331 1.05386 3.233 12.0655-8.05262-8.0526-2.87919 2.8792 8.83271 8.8328-10.99975-2.9474-1.05385625 3.933 12.01860625 3.2204c-.1376-.5935-.2104-1.2119-.2104-1.8473 0-4.4976 3.646-8.1436 8.1437-8.1436 4.4976 0 8.1436 3.646 8.1436 8.1436 0 .6313-.0719 1.2459-.2078 1.8359l10.9227 2.9267 1.0538-3.933-12.0664-3.2332 11.0005-2.9476-1.0539-3.933-12.0659 3.233 8.0526-8.0526-2.8792-2.87916-8.7102 8.71026z" />
      <path d="m27.8723 26.2214c-.3372 1.4256-1.0491 2.7063-2.0259 3.7324l7.913 7.9131 2.8792-2.8792z" />
      <path d="m25.7665 30.0366c-.9886 1.0097-2.2379 1.7632-3.6389 2.1515l2.8794 10.746 3.933-1.0539z" />
      <path d="m21.9807 32.2274c-.65.1671-1.3313.2559-2.0334.2559-.7522 0-1.4806-.102-2.1721-.2929l-2.882 10.7558 3.933 1.0538z" />
      <path d="m17.6361 32.1507c-1.3796-.4076-2.6067-1.1707-3.5751-2.1833l-7.9325 7.9325 2.87919 2.8792z" />
      <path d="m13.9956 29.8973c-.9518-1.019-1.6451-2.2826-1.9751-3.6862l-10.95836 2.9363 1.05385 3.933z" />
    </g>
  </svg>
);

export default function SignIn() {
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const togglePasswordVisibility = () => setIsPasswordVisible((prev) => !prev);

  const handleSSOLogin = async () => {
    try {
      setIsLoading(true);
      const email = process.env.NEXT_PUBLIC_MOCK_EMAIL;
      const password = process.env.NEXT_PUBLIC_MOCK_PASSWORD;
      
      if (!email || !password) {
        console.warn("Dev mode: Missing NEXT_PUBLIC_MOCK_EMAIL or NEXT_PUBLIC_MOCK_PASSWORD.");
      }

      const token = await mockLogin(email || "", password || "");
      
      // Save for client-side API calls
      localStorage.setItem("access_token", token);
      // Save as cookie for Next.js middleware routing
      document.cookie = `access_token=${token}; path=/; max-age=86400`;
      
      router.push("/dashboard");
    } catch (error) {
      console.error("Mock login failed:", error);
      alert("SSO Login failed. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50/50 p-6 md:p-8">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-3xl border border-neutral-800/10 bg-white p-8 md:p-10 shadow-sm">
        
        {/* Header Section */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-b from-[#2BBAEE]/20 to-transparent shadow-inner">
            <Logo className="size-8 text-[#2BBAEE]" />
          </div>
          <div className="flex flex-col gap-1 items-center">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-800">
              Masuk ke <span className="text-[#2BBAEE]">Acme</span>
            </h2>
            <p className="text-sm md:text-base text-neutral-800/50 leading-relaxed max-w-sm">
              Selamat datang kembali! Silakan masukkan detail Anda.
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-5 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" placeholder="ephraim@blocks.so" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="#" className="text-xs text-[#2BBAEE] font-medium hover:underline">
                Reset password
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                placeholder="Enter your password"
                type={isPasswordVisible ? "text" : "password"}
              />
              <button
                className="absolute inset-y-0 right-0 flex h-full w-10 items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
                type="button"
                onClick={togglePasswordVisibility}
                aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                aria-pressed={isPasswordVisible}
                aria-controls="password"
              >
                {isPasswordVisible ? (
                  <EyeOffIcon size={16} aria-hidden="true" />
                ) : (
                  <EyeIcon size={16} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" defaultChecked className="data-[state=checked]:bg-[#2BBAEE] data-[state=checked]:border-[#2BBAEE]" />
            <Label htmlFor="remember" className="text-sm text-neutral-600 font-normal">
              Remember me
            </Label>
          </div>

          {/* Actions */}
          <div className="flex w-full flex-col gap-3 pt-2">
            <button 
              type="submit" 
              onClick={(e) => e.preventDefault()}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-800/10 bg-gradient-to-b from-[#90FDF2] to-[#2BBAEE] px-6 py-3 text-sm font-medium text-neutral-800 transition-all hover:opacity-90 active:scale-95 shadow-sm"
            >
              Sign In
            </button>
            <button 
              type="button" 
              onClick={handleSSOLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-800/20 bg-gradient-to-b from-[#2BBAEE]/20 to-transparent px-6 py-3 text-sm font-medium text-neutral-800 transition-all hover:from-[#2BBAEE]/30 active:scale-95 disabled:opacity-50"
            >
              <Key className="size-4 shrink-0" />
              {isLoading ? "Memproses..." : "Single sign-on (SSO)"}
            </button>
          </div>
        </div>

        {/* Subtle Footer Code */}
        <p className="text-center text-sm text-neutral-800/50 mt-2">
          Belum punya akun?{" "}
          <Link href="/auth/sign-up" className="text-[#2BBAEE] font-medium hover:underline">
            Daftar sekarang
          </Link>
        </p>
        
      </div>
    </div>
  );
}
