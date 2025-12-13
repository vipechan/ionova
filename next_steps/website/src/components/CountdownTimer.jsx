import { useState, useEffect } from 'react';
import './CountdownTimer.css';

export default function CountdownTimer({ targetDate }) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const difference = target - now;

            if (difference > 0) {
                return {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                    total: difference
                };
            }

            return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
        };

        // Update immediately
        setTimeLeft(calculateTimeLeft());

        // Update every second
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    const formatNumber = (num) => String(num).padStart(2, '0');

    if (timeLeft.total <= 0) {
        return (
            <div className="countdown-timer sale-live">
                <div className="sale-status">
                    <span className="status-icon">🚀</span>
                    <h2>Sale is LIVE!</h2>
                    <p>Purchase your validator fractions now</p>
                </div>
            </div>
        );
    }

    return (
        <div className="countdown-timer">
            <div className="countdown-header">
                <h3>⏰ Validator Sale Starts In:</h3>
                <p className="sale-date">
                    {new Date(targetDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZoneName: 'short'
                    })}
                </p>
            </div>

            <div className="countdown-display">
                <div className="time-unit">
                    <div className="time-value">{formatNumber(timeLeft.days)}</div>
                    <div className="time-label">Days</div>
                </div>
                <div className="time-separator">:</div>
                <div className="time-unit">
                    <div className="time-value">{formatNumber(timeLeft.hours)}</div>
                    <div className="time-label">Hours</div>
                </div>
                <div className="time-separator">:</div>
                <div className="time-unit">
                    <div className="time-value">{formatNumber(timeLeft.minutes)}</div>
                    <div className="time-label">Minutes</div>
                </div>
                <div className="time-separator">:</div>
                <div className="time-unit">
                    <div className="time-value">{formatNumber(timeLeft.seconds)}</div>
                    <div className="time-label">Seconds</div>
                </div>
            </div>

            <div className="countdown-footer">
                <p>🔔 Get ready to secure your validator fractions early!</p>
            </div>
        </div>
    );
}
