// Sale configuration
export const SALE_CONFIG = {
    // Sale start date (January 1, 2026, 00:00:00 UTC)
    SALE_START_DATE: '2026-01-01T00:00:00Z',

    // Admin wallet addresses who can change the date
    ADMIN_ADDRESSES: [
        '0x0000000000000000000000000000000000000000', // Replace with actual admin address
    ],
};

// Function to check if user is admin
export const isAdmin = (address) => {
    if (!address) return false;
    return SALE_CONFIG.ADMIN_ADDRESSES.map(a => a.toLowerCase()).includes(address.toLowerCase());
};

// Function to get sale start date
export const getSaleStartDate = () => {
    // In production, this would fetch from smart contract
    // For now, return from config
    return SALE_CONFIG.SALE_START_DATE;
};

// Function to check if sale has started
export const isSaleActive = () => {
    const now = new Date().getTime();
    const saleStart = new Date(getSaleStartDate()).getTime();
    return now >= saleStart;
};

// Function to update sale date (admin only)
export const updateSaleDate = (newDate) => {
    // In production, this would call smart contract
    SALE_CONFIG.SALE_START_DATE = newDate;
    localStorage.setItem('saleStartDate', newDate);
};

// Initialize from localStorage if exists
const storedDate = localStorage.getItem('saleStartDate');
if (storedDate) {
    SALE_CONFIG.SALE_START_DATE = storedDate;
}
