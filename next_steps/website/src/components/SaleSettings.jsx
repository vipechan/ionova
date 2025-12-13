import { useState } from 'react';
import { useAccount } from 'wagmi';
import { isAdmin, getSaleStartDate, updateSaleDate } from '../config/saleConfig';
import './SaleSettings.css';

export default function SaleSettings() {
    const { address } = useAccount();
    const [newDate, setNewDate] = useState(getSaleStartDate().split('T')[0]);
    const [newTime, setNewTime] = useState(getSaleStartDate().split('T')[1]?.split(':').slice(0, 2).join(':') || '00:00');
    const [showSuccess, setShowSuccess] = useState(false);

    if (!isAdmin(address)) {
        return (
            <div className="sale-settings-locked">
                <div className="lock-icon">🔒</div>
                <h3>Admin Access Required</h3>
                <p>Only admin wallets can modify sale settings</p>
            </div>
        );
    }

    const handleUpdateDate = () => {
        const dateTimeString = `${newDate}T${newTime}:00Z`;
        updateSaleDate(dateTimeString);
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            window.location.reload(); // Refresh to update countdown
        }, 2000);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
    };

    const getTimeUntilSale = () => {
        const now = new Date();
        const sale = new Date(getSaleStartDate());
        const diff = sale - now;

        if (diff <= 0) {
            return "Sale is LIVE!";
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

        return `${days} days, ${hours} hours from now`;
    };

    return (
        <div className="sale-settings">
            <div className="settings-header">
                <h2>⏰ Sale Start Date Configuration</h2>
                <span className="admin-badge">ADMIN ONLY</span>
            </div>

            <div className="settings-content">
                {/* Current Sale Info */}
                <div className="current-sale-info">
                    <h3>📅 Current Sale Settings</h3>
                    <div className="info-box">
                        <div className="info-row">
                            <span className="label">Start Date & Time:</span>
                            <span className="value">{formatDate(getSaleStartDate())}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Time Until Sale:</span>
                            <span className="value highlight">{getTimeUntilSale()}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Status:</span>
                            <span className={`status-badge ${new Date() >= new Date(getSaleStartDate()) ? 'live' : 'pending'}`}>
                                {new Date() >= new Date(getSaleStartDate()) ? '🟢 LIVE' : '🟡 PENDING'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Update Section */}
                <div className="update-section">
                    <h3>🔧 Update Sale Start Time</h3>
                    <p className="instructions">
                        Set the exact date and time when the validator fraction sale will begin (UTC timezone)
                    </p>

                    <div className="date-time-form">
                        <div className="form-group">
                            <label htmlFor="sale-date">
                                📅 Date
                            </label>
                            <input
                                type="date"
                                id="sale-date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className="date-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="sale-time">
                                ⏰ Time (UTC)
                            </label>
                            <input
                                type="time"
                                id="sale-time"
                                value={newTime}
                                onChange={(e) => setNewTime(e.target.value)}
                                className="time-input"
                            />
                        </div>
                    </div>

                    <div className="preview-box">
                        <strong>Preview:</strong> {formatDate(`${newDate}T${newTime}:00Z`)}
                    </div>

                    <button
                        className="update-btn"
                        onClick={handleUpdateDate}
                        disabled={!newDate || !newTime}
                    >
                        <span className="btn-icon">💾</span>
                        Update Sale Start Date
                    </button>

                    {showSuccess && (
                        <div className="success-alert">
                            <span className="success-icon">✅</span>
                            <strong>Sale date updated successfully!</strong>
                            <p>The countdown timer will update automatically...</p>
                        </div>
                    )}
                </div>

                {/* Warning */}
                <div className="warning-box">
                    <div className="warning-icon">⚠️</div>
                    <div className="warning-content">
                        <strong>Important Notice:</strong>
                        <ul>
                            <li>All times are in UTC (Coordinated Universal Time)</li>
                            <li>The countdown timer on the sale page will update immediately</li>
                            <li>Users worldwide will see when the sale starts in their local timezone</li>
                            <li>Make sure to communicate any date changes to your community</li>
                            <li>This setting is stored locally - in production, use smart contract timing</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
