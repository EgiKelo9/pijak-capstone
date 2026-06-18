"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState, JSX, SVGProps } from "react";
import { useAuth } from "@/hooks/use-auth";

const Logo = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
  <svg
    fill="currentColor"
    height="48"
    viewBox="0 0 40 48"
    width="40"
    {...props}
  >
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

export default function SignUpPage() {
  const { isRegister, loading, error, clearError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();
    if (!name.trim()) {
      setFormError("Nama tidak boleh kosong.");
      return;
    }
    if (!email.trim()) {
      setFormError("Email tidak boleh kosong.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password minimal 8 karakter.");
      return;
    }
    if (password !== passwordConfirmation) {
      setFormError("Konfirmasi password tidak cocok.");
      return;
    }
    try {
      await isRegister(name, email, password, passwordConfirmation);
    } catch {
      // error already set by useAuth
    }
  };
  const displayError = formError || error;
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
              Buat <span className="text-[#2BBAEE]">Akun</span>
            </h2>
            <p className="text-sm md:text-base text-neutral-800/50 leading-relaxed max-w-sm">
              Selamat datang! Mari buat akun untuk memulai.
            </p>
          </div>
        </div>
        {/* Error Alert */}
        {displayError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {displayError}
          </div>
        )}
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nama */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              type="text"
              placeholder="Masukkan nama lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
              className="placeholder:text-foreground/50"
            />
          </div>
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="placeholder:text-foreground/50"
            />
          </div>
          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="placeholder:text-foreground/50"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex h-full w-10 items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          {/* Konfirmasi Password */}
          <div className="space-y-1.5">
            <Label htmlFor="passwordConfirmation">Konfirmasi Password</Label>
            <div className="relative">
              <Input
                id="passwordConfirmation"
                type={showPasswordConfirmation ? "text" : "password"}
                placeholder="Ulangi password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                disabled={loading}
                required
                className="placeholder:text-foreground/50"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex h-full w-10 items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                aria-label={showPasswordConfirmation ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
              >
                {showPasswordConfirmation ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-800/10 bg-gradient-to-b from-[#90FDF2] to-[#2BBAEE] px-6 py-3 text-sm font-medium text-neutral-800 transition-all hover:opacity-90 active:scale-95 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? "Mendaftar..." : "Buat Akun"}
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-neutral-800/50">
          Sudah punya akun?{" "}
          <Link href="/auth/login" className="text-[#2BBAEE] font-medium hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}