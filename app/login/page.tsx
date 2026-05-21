"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    setLoading(false);
    if (!response.ok) {
      setError("รหัสไม่ถูกต้อง");
      return;
    }
    window.location.href = "/";
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-white">
      <Card className="w-full max-w-md border-white/10 bg-white/[0.06] text-white">
        <CardContent className="p-8">
          <div className="mb-7 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-950">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">PrivateBank OS</h1>
              <p className="text-sm text-slate-400">Secure local access</p>
            </div>
          </div>
          <form className="grid gap-4" onSubmit={submit}>
            <label className="grid gap-2 text-sm font-medium text-slate-200">
              Passcode
              <input
                className="h-11 rounded-xl border border-white/10 bg-slate-900 px-3 text-white outline-none ring-blue-500/40 focus:ring-4"
                type="password"
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
                placeholder="default: privatebank"
              />
            </label>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <Button className="bg-white text-slate-950 hover:bg-slate-200" disabled={loading}>
              {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>
          <p className="mt-5 text-xs leading-5 text-slate-400">
            สำหรับ production ให้ตั้งค่า PRIVATEBANK_PASSCODE และใช้ auth provider จริงก่อนนำข้อมูลจริงขึ้น public hosting.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
