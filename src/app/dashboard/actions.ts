"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type DisplayNameState = {
  ok: boolean;
  message: string;
};

export async function updateDisplayName(
  _prevState: DisplayNameState,
  formData: FormData,
): Promise<DisplayNameState> {
  const raw = formData.get("display_name");
  const displayName = typeof raw === "string" ? raw.trim() : "";

  if (displayName.length > 80) {
    return { ok: false, message: "Display name must be 80 characters or fewer." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id || !user.email) {
    return { ok: false, message: "Please sign in again before saving." };
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: displayName || null,
    },
    { onConflict: "id" },
  );

  if (error) {
    return { ok: false, message: "Could not save your display name." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");

  return { ok: true, message: "Display name saved." };
}
