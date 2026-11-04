import { defineStore } from "pinia";
import { supabase } from "../services/supabase";

export const useUsersStore = defineStore("users", {
  state: () => ({
    users: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchUsers() {
      this.loading = true;
      this.error = null;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, role, active")
        .order("name", { ascending: true });

      if (error) {
        this.error = error.message;
        this.loading = false;
        return;
      }

      this.users = data.map((u) => ({
        id: u.id,
        name: u.name || "Sin nombre",
        email: u.email,
        role: u.role === "admin" ? "Admin" : "Cliente",
        active: u.active ?? true,
      }));

      this.loading = false;
    },

    async updateUser(id, updatedData) {
      this.loading = true;
      this.error = null;

      const dbData = { ...updatedData };
      if (dbData.role) {
        dbData.role = dbData.role === "Admin" ? "admin" : "player";
      }

      const { error } = await supabase
        .from("profiles")
        .update(dbData)
        .eq("id", id);

      if (error) {
        this.error = error.message;
        this.loading = false;
        return false;
      }

      const index = this.users.findIndex((u) => u.id === id);
      if (index !== -1) {
        this.users[index] = {
          ...this.users[index],
          ...updatedData,
        };
      }

      this.loading = false;
      return true;
    },

    async toggleUserStatus(id) {
      this.loading = true;
      this.error = null;

      const user = this.users.find((u) => u.id === id);
      if (!user) return false;

      const nuevoEstado = !user.active;

      const { error } = await supabase
        .from("profiles")
        .update({ active: nuevoEstado })
        .eq("id", id);

      if (error) {
        this.error = error.message;
        this.loading = false;
        return false;
      }

      user.active = nuevoEstado;
      this.loading = false;
      return true;
    },
  },
});
