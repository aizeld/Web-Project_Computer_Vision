function getTimeCurrent() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',});
    return `${timeString}, ${dateString}`;
}
module.exports = {
    getTimeCurrent
};
