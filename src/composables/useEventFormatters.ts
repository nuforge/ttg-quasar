import type { Event } from 'src/models/Event';

/**
 * Composable for event formatting utilities
 * Used by event admin components and list views
 */
export function useEventFormatters() {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'upcoming':
        return 'positive';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'negative';
      default:
        return 'grey';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'upcoming':
        return 'mdi-calendar-clock';
      case 'completed':
        return 'mdi-calendar-check';
      case 'cancelled':
        return 'mdi-calendar-remove';
      default:
        return 'mdi-calendar';
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'Unknown';
    const [year, month, day] = dateStr.split('-').map(Number) as [number, number, number];
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours ?? 0, minutes ?? 0);
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getAttendanceInfo = (event: Event): string => {
    const confirmed = event.getConfirmedCount();
    const interested = event.getInterestedCount();
    return `${confirmed}/${event.maxPlayers}${interested > 0 ? ` (+${interested})` : ''}`;
  };

  const getAttendanceColor = (event: Event): string => {
    const confirmed = event.getConfirmedCount();
    if (confirmed >= event.maxPlayers) return 'warning';
    if (confirmed >= event.minPlayers) return 'positive';
    return 'grey';
  };

  return {
    getStatusColor,
    getStatusIcon,
    formatDate,
    formatTime,
    getAttendanceInfo,
    getAttendanceColor,
  };
}

