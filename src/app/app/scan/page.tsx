"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AuthGuard } from "@/providers/auth-provider";

function ScanContent() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [decoded, setDecoded] = useState("");
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleDecode = useCallback(
    (value: string) => {
      stopCamera();
      router.push(`/app/product?serial=${encodeURIComponent(value)}`);
    },
    [router, stopCamera]
  );

  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setScanning(true);

        // BarcodeDetector API where available
        if ("BarcodeDetector" in window) {
          const detector = new (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect: (src: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector({
            formats: ["qr_code", "code_128", "code_39", "ean_13"],
          });

          intervalRef.current = setInterval(async () => {
            if (!videoRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0 && codes[0]?.rawValue) {
                setDecoded(codes[0].rawValue);
                handleDecode(codes[0].rawValue);
              }
            } catch {
              // detection frame failed, continue
            }
          }, 500);
        }
      } catch {
        setError("Camera access denied or unavailable. Use manual entry below.");
      }
    }

    startScanner();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [handleDecode, stopCamera]);

  return (
    <div className="flex min-h-screen flex-col bg-background p-4">
      <div className="flex justify-end">
        <Link href="/app?tab=product" className="text-2xl text-brand">
          ?
        </Link>
      </div>

      <h1 className="mb-6 text-center text-xl font-semibold">Scan QR Codes Here</h1>

      <div className="mx-auto w-full max-w-sm">
        <div className="relative aspect-square overflow-hidden rounded-2xl p-1 evs-gradient">
          <div className="relative h-full w-full overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
            />
            {scanning && (
              <div className="pointer-events-none absolute inset-x-4 top-0 h-0.5 animate-[scan_2s_ease-in-out_infinite] bg-serial-red" />
            )}
          </div>
        </div>

        {error && <p className="mt-4 text-center text-sm text-serial-red">{error}</p>}

        {decoded && (
          <p className="mt-4 text-center text-sm font-mono">{decoded}</p>
        )}

        <Link
          href="/app/validate"
          className="mt-6 flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm"
        >
          <Image src="/icons/manual.svg" alt="" width={40} height={40} />
          <span className="font-medium">Manual Product Registration</span>
        </Link>
      </div>

      <div className="mt-auto flex justify-center py-8">
        <Image
          src="/brand/logo-long.svg"
          alt="eVehicleSafe"
          width={160}
          height={36}
          className="h-9 w-auto opacity-60"
        />
      </div>

      <style jsx>{`
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 85%; }
        }
      `}</style>
    </div>
  );
}

export default function ScanPage() {
  return (
    <AuthGuard requireAuth>
      <ScanContent />
    </AuthGuard>
  );
}
