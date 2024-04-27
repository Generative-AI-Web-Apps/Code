export function generateUniqueId() {
  const timestamp = Date.now().toString(36); // Convert timestamp to base 36
  const randomPart = Math.random().toString(36).substring(2); // Generate random string
  return `${timestamp}-${randomPart}`;
}
