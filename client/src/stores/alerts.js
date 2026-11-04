import { defineStore } from "pinia";

export const useAlertsStore = defineStore("alerts", {
  state: () => ({
    alerts: [],
  }),

  actions: {
    showAlert(message, type = "success", timeout = 4000) {
      const id = Date.now();

      this.alerts.push({ id, message, type, timeout });

      setTimeout(() => {
        this.removeAlert(id);
      }, timeout);
    },

    removeAlert(id) {
      this.alerts = this.alerts.filter((alert) => alert.id !== id);
    },
  },
});
