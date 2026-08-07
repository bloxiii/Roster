"use server";

import { redirect } from "next/navigation";
import { createClient } from "./server";

export type AuthResult = {
  error?: string;
};

/**
 * Inscription — crée le user Supabase.
 * Le trigger SQL handle_new_user() crée automatiquement
 * la company, le membership, l'agent et la widget key.
 */
export async function signup(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const companyName = (formData.get("company") as string)?.trim();

  if (!name || !email || !password || !companyName) {
    return { error: "Tous les champs sont obligatoires." };
  }

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        company_name: companyName,
      },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Cet email est déjà utilisé." };
    }
    return { error: error.message };
  }

  redirect("/fr/dashboard");
}

/**
 * Connexion par email + mot de passe.
 */
export async function login(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Email ou mot de passe incorrect." };
  }

  redirect("/fr/dashboard");
}

/**
 * Déconnexion.
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/fr/login");
}

/**
 * Demande de reset de mot de passe.
 */
export async function resetPassword(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = (formData.get("email") as string)?.trim();
  if (!email) {
    return { error: "Email requis." };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? "" : "http://localhost:3000"}/fr/dashboard`,
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}
