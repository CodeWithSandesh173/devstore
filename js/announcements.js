// Announcements functionality
function loadAnnouncement() {
    database.ref('announcement').once('value')
        .then(snapshot => {
            const announcement = snapshot.val();
            if (announcement && announcement.active) {
                displayAnnouncement(announcement.message);
            }
        })
        .catch(error => console.error("Error loading announcement:", error));
}

function displayAnnouncement(message) {
    const banner = document.getElementById('announcementBanner');
    const text = document.getElementById('announcementText');

    if (banner && text) {
        text.textContent = message;
        banner.style.display = 'block';
    }
}

function closeAnnouncement() {
    const banner = document.getElementById('announcementBanner');
    if (banner) {
        banner.style.display = 'none';
    }
}
