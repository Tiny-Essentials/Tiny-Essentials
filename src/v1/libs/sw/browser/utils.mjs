/**
 * Requests permission from the user to display notifications.
 *
 * @returns {Promise<'granted' | 'denied' | 'default'>} The resulting permission status.
 * @throws {Error} If the Notification API is not supported by the browser.
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    throw new Error('Notification API is not supported in this browser.');
  }

  // If permission is already 'granted', return immediately.
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  // If 'denied', the user has blocked it and we cannot prompt again via code.
  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
};
