import { defineStore } from "pinia";
import { supabase } from "../services/supabase";

export const useCourtsStore = defineStore("courts", {
  state: () => ({
    courts: [],
    searchQuery: "",
    selectedSport: "",
    loading: false,
    error: null,
  }),

  getters: {
    activeCourts: (state) => state.courts.filter((court) => court.active),

    filteredCourts: (state) => {
      return state.courts.filter((court) => {
        if (!court.active) return false;
        if (!court.sport) return false;

        const matchesSport =
          !state.selectedSport ||
          court.sport.toLowerCase() === state.selectedSport.toLowerCase();

        const courtName = court.name ? court.name.toLowerCase() : "";
        const courtClub = court.club ? court.club.toLowerCase() : "";
        const query = state.searchQuery.toLowerCase().trim();

        const matchesSearch =
          !query || courtName.includes(query) || courtClub.includes(query);

        return matchesSport && matchesSearch;
      });
    },
  },

  actions: {
    async fetchCourts() {
      this.loading = true;
      this.error = null;

      try {
        // Traemos las canchas embebiendo sus reviews asociadas
        const { data, error } = await supabase.from("courts").select(`
            *,
            reviews (
              rating,
              comment
            )
          `);

        if (error) {
          console.error("Error de Supabase:", error.message, error.code);
          this.error = error.message;
          return;
        }

        // Mapeamos los datos para inyectar el promedio y el total calculados dinámicamente
        const courtsWithRatings = (data || []).map((court) => {
          const reviews = court.reviews || [];
          const total_reviews = reviews.length;

          const average_rating =
            total_reviews > 0
              ? reviews.reduce((sum, r) => sum + r.rating, 0) / total_reviews
              : 0;

          return {
            ...court,
            total_reviews,
            average_rating,
          };
        });

        console.log("Datos procesados con calificaciones:", courtsWithRatings);
        this.courts = courtsWithRatings;
      } catch (err) {
        console.error("❌ Error al conectar a Supabase:", err.message);
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async addCourtReview(userId, courtId, rating, comment) {
      this.loading = true;
      this.error = null;
      try {
        const { error } = await supabase.from("reviews").insert([
          {
            user_id: userId,
            court_id: courtId,
            rating: Number(rating),
            comment: comment || null,
          },
        ]);

        if (error) {
          console.error("Error al añadir reseña:", error.message);
          this.error = error.message;
          throw new Error(error.message);
        }

        // Volvemos a pedir las canchas para que se recalculen los promedios reales
        await this.fetchCourts();
      } catch (err) {
        console.error("Error inesperado al calificar:", err.message);
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async addCourt(newCourtData) {
      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await supabase
          .from("courts")
          .insert([
            {
              name: newCourtData.name,
              sport: newCourtData.sport,
              club: newCourtData.club,
              location: newCourtData.location,
              price: Number(newCourtData.price),
              active: true,
            },
          ])
          .select();

        if (error) {
          console.error("Error al añadir cancha:", error.message);
          this.error = error.message;
          return;
        }

        if (data && data.length > 0) {
          // Inicializamos los contadores en 0 para la nueva cancha insertada localmente
          this.courts.push({
            ...data[0],
            total_reviews: 0,
            average_rating: 0,
          });
        }
      } catch (err) {
        console.error("Error inesperado al añadir:", err.message);
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async updateCourt(id, updatedData) {
      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await supabase
          .from("courts")
          .update({
            ...updatedData,
            price: Number(updatedData.price),
          })
          .eq("id", id)
          .select();

        if (error) {
          console.error(" Error al actualizar cancha:", error.message);
          this.error = error.message;
          return;
        }

        if (data && data.length > 0) {
          console.log("Cancha actualizada con éxito:", data[0]);
          const index = this.courts.findIndex((c) => c.id === id);
          if (index !== -1) {
            // Mantenemos las propiedades de reviews calculadas que ya teníamos localmente
            this.courts[index] = {
              ...this.courts[index],
              ...data[0],
            };
          }
        }
      } catch (err) {
        console.error(" Error inesperado al actualizar:", err.message);
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async deleteCourt(id) {
      this.loading = true;
      this.error = null;
      try {
        const { error } = await supabase.from("courts").delete().eq("id", id);

        if (error) {
          console.error("Error al eliminar cancha:", error.message);
          this.error = error.message;
          return;
        }

        this.courts = this.courts.filter((c) => c.id !== id);
      } catch (err) {
        console.error("Error inesperado al eliminar:", err.message);
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    setSportFilter(sport) {
      this.selectedSport = sport;
    },
    clearFilters() {
      this.selectedSport = "";
      this.searchQuery = "";
    },
  },
});
