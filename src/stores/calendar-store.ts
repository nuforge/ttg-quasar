import { defineStore } from 'pinia';

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    selectedDate: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
  }),

  actions: {
    setSelectedDate(date: string) {
      this.selectedDate = date;
    },
  },
});
