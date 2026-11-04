import { defineStore } from "pinia";
import { supabase } from "../services/supabase";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    error: null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => state.user !== null,
    isAdmin: (state) => state.user?.role === "admin",
  },

  actions: {
    async loadSession() {
      this.loading = true;
      this.error = null;

      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        this.user = null;
        this.loading = false;
        return;
      }

      const userId = data.session.user.id;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, email, role, active")
        .eq("id", userId)
        .single();

      if (profileError || !profile || !profile.active) {
        this.user = null;
        this.loading = false;
        return;
      }

      this.user = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
      };

      this.loading = false;
    },

    async login(email, password) {
      this.loading = true;
      this.error = null; // Limpiamos errores anteriores

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.error = error.message;
        this.loading = false;
        return false;
      }

      const userId = data.user.id;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, email, role, active")
        .eq("id", userId)
        .single();

      if (profileError) {
        this.error = "No se pudo encontrar el perfil de usuario asociado.";
        this.loading = false;
        return false;
      }

      if (!profile.active) {
        this.error = "El usuario se encuentra deshabilitado";
        this.loading = false;
        return false;
      }

      this.user = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
      };

      this.loading = false;
      return true;
    },

    async register(name, email, password) {
      this.loading = true;
      this.error = null; // Limpiamos errores anteriores

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        this.error = error.message;
        this.loading = false;
        return false;
      }

      const userId = data.user?.id;

      if (!userId) {
        this.error = "Error al generar el identificador de usuario.";
        this.loading = false;
        return false;
      }

      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        name,
        email,
        role: "player",
        active: true,
      });

      if (profileError) {
        this.error = profileError.message;
        this.loading = false;
        return false;
      }

      this.user = {
        id: userId,
        name,
        email,
        role: "player",
      };

      this.loading = false;
      return true;
    },

    async logout() {
      await supabase.auth.signOut();
      this.user = null;
      this.error = null;
    },
  },
});
