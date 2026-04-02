export async function fetchEvents() {
    const response = await fetch("${import.meta.env.VITE_API_BASE_URL}/php-backend/fetch_events.php");
    const data = await response.json();
    return data;
}
