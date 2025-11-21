const notificationService = {

    /**
     * Hiển thị thông báo
     * @param {string} message - Nội dung thông báo
     * @param {string} type - Loại thông báo: 'success', 'error', 'warning', 'info'
     */
    show(message, type = 'info') {
        const notyf = new Notyf({
        duration: 5000,
        position: { x: 'right', y: 'top' }
        });

        switch (type) {
        case 'success':
            notyf.success(message);
            break;
        case 'error':
            notyf.error(message);
            break;
        case 'warning':
            // Fallback to info for warning since Notyf doesn't have warning by default
            notyf.open({ type: 'info', message: message, background: '#ffc107' });
            break;
        default:
            notyf.open({ type: 'info', message: message });
        }
    }
}

export default notificationService;