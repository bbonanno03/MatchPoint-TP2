import { defineStore } from "pinia";
import { useAuthStore } from "./auth";
import * as reservationsService from "../services/reservationsService";

function checkIfExpired(reservationDate, endTime) {
  if (!reservationDate || !endTime) return false;

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = String(now.getMonth() + 1).padStart(2, "0");
  const nowDay = String(now.getDate()).padStart(2, "0");
  const nowHours = String(now.getHours()).padStart(2, "0");
  const nowMinutes = String(now.getMinutes()).padStart(2, "0");

  const currentNumeric = Number(
    `${nowYear}${nowMonth}${nowDay}${nowHours}${nowMinutes}`,
  );

  const [resYear, resMonth, resDay] = reservationDate.split("-");
  const timeParts = endTime.split(":");
  const resHours = String(timeParts[0]).padStart(2, "0");
  const resMinutes = String(timeParts[1]).padStart(2, "0");

  const reservationNumeric = Number(
    `${resYear}${resMonth}${resDay}${resHours}${resMinutes}`,
  );

  return reservationNumeric <= currentNumeric;
}

export const useReservationsStore = defineStore("reservations", {
  state: () => ({
    reservations: [],
    loading: false,
    error: null,
  }),

  getters: {
    myActiveReservations: (state) => {
      return (state.reservations || []).filter((res) => {
        const status = res.status?.toLowerCase();
        if (status !== "active" && status !== "confirmed") return false;

        const rDate = res.reservation_date || res.date;
        const rTime = res.end_time || res.endTime;

        return !checkIfExpired(rDate, rTime);
      });
    },

    myCancelledReservations: (state) => {
      return (state.reservations || []).filter(
        (res) => res.status?.toLowerCase() === "cancelled",
      );
    },

    myHistoryReservations: (state) => {
      return (state.reservations || []).filter((res) => {
        const status = res.status?.toLowerCase();
        if (status === "cancelled") return true;

        const rDate = res.reservation_date || res.date;
        const rTime = res.end_time || res.endTime;

        return status === "completed" || checkIfExpired(rDate, rTime);
      });
    },

    myReservations: (state) => {
      return state.reservations || [];
    },
  },

  actions: {
    async fetchUserReservations() {
      this.loading = true;
      this.error = null;

      const authStore = useAuthStore();
      if (!authStore.user) {
        this.reservations = [];
        this.loading = false;
        return;
      }

      try {
        const data = await reservationsService.getUserReservations(
          authStore.user.id,
        );
        this.reservations = data;
      } catch (err) {
        this.error = err.message;
        console.error("Error fetching reservations:", err);
      } finally {
        this.loading = false;
      }
    },

    async fetchAllReservations() {
      this.loading = true;
      this.error = null;
      try {
        const data = await reservationsService.getAllReservations();
        this.reservations = data;
      } catch (err) {
        this.error = err.message;
        console.error("Error fetching all reservations:", err);
      } finally {
        this.loading = false;
      }
    },

    async addReservation(userId, courtId, courtName, clubName, date, time) {
      this.loading = true;
      this.error = null;
      try {
        const endTime = this._calculateEndTime(time);
        const newReservation = await reservationsService.createReservation({
          userId,
          courtId,
          reservationDate: date,
          startTime: time,
          endTime: endTime,
        });
        await this.fetchUserReservations();
        return newReservation;
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async cancelReservation(reservationId, date, time) {
      this.loading = true;
      this.error = null;
      try {
        const result = await reservationsService.cancelReservation(
          reservationId,
          date,
          time,
        );
        await this.fetchUserReservations();
        return result;
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    clearReservations() {
      this.reservations = [];
    },

    _calculateEndTime(startTime) {
      const [hours, minutes] = startTime.split(":").map(Number);
      const endHours = (hours + 1) % 24;
      return `${String(endHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    },
  },
});
