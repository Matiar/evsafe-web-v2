"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthGuard } from "@/providers/auth-provider";
import { ThemeTextField } from "@/components/ui/theme-text-field";
import { ThemeGradientButton } from "@/components/ui/theme-gradient-button";
import { validateProductManual } from "@/lib/odoo/client";
import { Snack } from "@/stores/toast-store";
import { filterError } from "@/lib/utils";

function ValidateContent() {
  const router = useRouter();
  const [serial, setSerial] = useState("");
  const [buildDate, setBuildDate] = useState("");
  const [batch, setBatch] = useState("");
  const [serialError, setSerialError] = useState("");
  const [buildDateError, setBuildDateError] = useState("");
  const [batchError, setBatchError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let valid = true;
    setSerialError("");
    setBuildDateError("");
    setBatchError("");

    if (!serial) {
      setSerialError("Serial number is required");
      valid = false;
    } else if (!/^\d+$/.test(serial)) {
      setSerialError("Serial number must contain only numbers");
      valid = false;
    } else if (serial.length !== 6) {
      setSerialError("Serial number must be 6 digits");
      valid = false;
    }

    if (!buildDate) {
      setBuildDateError("Build date is required");
      valid = false;
    } else if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(buildDate)) {
      setBuildDateError("Build date must be in MM/YYYY format");
      valid = false;
    }

    if (!batch) {
      setBatchError("Batch number is required");
      valid = false;
    } else if (!/^\d+$/.test(batch)) {
      setBatchError("Batch number must contain only numbers");
      valid = false;
    } else if (batch.length !== 5) {
      setBatchError("Batch number must be 5 digits");
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await validateProductManual(serial, buildDate, batch);
      const success =
        result.success === true ||
        result.success === 1 ||
        result.success === "true" ||
        result.product_id != null;

      if (success) {
        sessionStorage.setItem(
          `validated_${serial}`,
          JSON.stringify(result)
        );
        router.push(`/app/product?serial=${encodeURIComponent(serial)}`);
      } else {
        Snack.error(
          result.message ?? "The entered information does not match our records",
          "Invalid Information",
          true
        );
      }
    } catch (err) {
      Snack.error(
        `An error occurred during validation: ${filterError(String(err))}`,
        "Error",
        true
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between bg-white px-4 py-4 shadow-sm">
        <h1 className="text-lg font-medium">Manual Product Registration</h1>
        <Link href="/app/scan" className="text-xl text-brand">
          ?
        </Link>
      </header>

      <div className="space-y-4 p-4">
        <ThemeTextField
          label="Serial Number (e.g. 123456)"
          hint="Enter 6-digit serial"
          value={serial}
          onChange={setSerial}
          errorText={serialError}
          isRequired
          maxLength={6}
        />
        <ThemeTextField
          label="Build Date (MM/YYYY)"
          hint="e.g., 07/2025"
          value={buildDate}
          onChange={setBuildDate}
          errorText={buildDateError}
          isRequired
        />
        <ThemeTextField
          label="Batch Number (e.g. 12345)"
          hint="Enter last 5 digits"
          value={batch}
          onChange={setBatch}
          errorText={batchError}
          isRequired
          maxLength={5}
        />

        <ThemeGradientButton onClick={handleSubmit} loading={loading}>
          Register
        </ThemeGradientButton>
      </div>
    </div>
  );
}

export default function ValidatePage() {
  return (
    <AuthGuard requireAuth>
      <ValidateContent />
    </AuthGuard>
  );
}
