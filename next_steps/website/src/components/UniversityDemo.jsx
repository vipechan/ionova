import React, { useState, useEffect } from 'react';
import './UniversityDemo.css';

/**
 * Ionova University - Interactive Demo Mode
 * Simulates blockchain interactions for demonstration purposes
 */
const UniversityDemo = () => {
    // Simulated User State
    const [user, setUser] = useState({
        isConnected: false,
        address: '0x71C...9A21',
        balance: 1000, // Initial IONX
        earned: 450,
        streak: 7,
        xp: 1250
    });

    const [activeTab, setActiveTab] = useState('catalog');
    const [notifications, setNotifications] = useState([]);

    // Simulated Database
    const [courses, setCourses] = useState([
        {
            id: 1,
            title: 'Blockchain Fundamentals',
            description: 'Learn the basics of blockchain technology and Ionova',
            level: 'Beginner',
            price: 0,
            reward: 120,
            modules: 5,
            duration: '4 hours',
            students: 1247,
            rating: 4.8,
            image: '🔷',
            enrolled: false,
            progress: 0,
            completed: false
        },
        {
            id: 2,
            title: 'Smart Contract Development',
            description: 'Master Solidity and build smart contracts on Ionova',
            level: 'Intermediate',
            price: 50,
            reward: 250,
            modules: 8,
            duration: '12 hours',
            students: 856,
            rating: 4.9,
            image: '📜',
            enrolled: false,
            progress: 0,
            completed: false
        },
        {
            id: 3,
            title: 'DeFi Protocol Design',
            description: 'Build decentralized finance applications',
            level: 'Advanced',
            price: 100,
            reward: 500,
            modules: 10,
            duration: '20 hours',
            students: 432,
            rating: 4.7,
            image: '💰',
            enrolled: false,
            progress: 0,
            completed: false
        },
        {
            id: 4,
            title: 'Ionova Certified Expert',
            description: 'Comprehensive certification program',
            level: 'Expert',
            price: 500,
            reward: 1000,
            modules: 25,
            duration: '60 hours',
            students: 189,
            rating: 5.0,
            image: '🎓',
            enrolled: false,
            progress: 0,
            completed: false
        }
    ]);

    const [certificates, setCertificates] = useState([]);

    // Helper to add notification
    const addNotification = (message, type = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    };

    // Actions
    const connectWallet = () => {
        setUser(prev => ({ ...prev, isConnected: true }));
        addNotification('Wallet Connected Successfully!', 'success');
    };

    const enroll = (courseId) => {
        const course = courses.find(c => c.id === courseId);

        if (course.price > user.balance) {
            addNotification('Insufficient IONX balance!', 'error');
            return;
        }

        // Deduct balance if paid
        if (course.price > 0) {
            setUser(prev => ({ ...prev, balance: prev.balance - course.price }));
        }

        // Update course state
        setCourses(prev => prev.map(c =>
            c.id === courseId ? { ...c, enrolled: true, progress: 0 } : c
        ));

        addNotification(`Enrolled in ${course.title}`, 'success');
        setActiveTab('mycourses');
    };

    const progressCourse = (courseId) => {
        setCourses(prev => prev.map(c => {
            if (c.id === courseId) {
                const newProgress = Math.min(c.progress + 25, 100);
                if (newProgress === 100 && !c.completed) {
                    // Course Completed!
                    completeCourse(c);
                    return { ...c, progress: 100, completed: true };
                }
                return { ...c, progress: newProgress };
            }
            return c;
        }));
    };

    const completeCourse = (course) => {
        // Issue Reward
        setUser(prev => ({
            ...prev,
            balance: prev.balance + course.reward,
            earned: prev.earned + course.reward,
            xp: prev.xp + 500
        }));

        // Issue Certificate
        const newCert = {
            id: Date.now(),
            title: course.title,
            level: course.level,
            date: new Date().toLocaleDateString(),
            tokenId: `#${Math.floor(Math.random() * 10000)}`
        };
        setCertificates(prev => [...prev, newCert]);

        addNotification(`Course Completed! +${course.reward} IONX`, 'success');
        addNotification('NFT Certificate Minted!', 'success');
    };

    return (
        <div className="demo-container">
            {/* Notifications */}
            <div className="notifications-container">
                {notifications.map(n => (
                    <div key={n.id} className={`notification ${n.type}`}>
                        {n.message}
                    </div>
                ))}
            </div>

            {/* Header / Wallet Bar */}
            <div className="demo-header">
                <div className="brand">
                    <div className="logo">🎓</div>
                    <div>
                        <h1>Ionova University</h1>
                        <span className="badge">DEMO MODE</span>
                    </div>
                </div>

                {!user.isConnected ? (
                    <button className="connect-btn" onClick={connectWallet}>
                        Connect Wallet
                    </button>
                ) : (
                    <div className="wallet-info">
                        <div className="balance-pill">
                            <span className="label">Balance</span>
                            <span className="value">{user.balance} IONX</span>
                        </div>
                        <div className="streak-pill">
                            <span className="fire">🔥</span>
                            <span>{user.streak} Days</span>
                        </div>
                        <div className="address-pill">
                            {user.address}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Navigation */}
            <div className="demo-nav">
                <button
                    className={activeTab === 'catalog' ? 'active' : ''}
                    onClick={() => setActiveTab('catalog')}
                >
                    📚 Catalog
                </button>
                <button
                    className={activeTab === 'mycourses' ? 'active' : ''}
                    onClick={() => setActiveTab('mycourses')}
                    disabled={!user.isConnected}
                >
                    📖 My Learning
                    {courses.filter(c => c.enrolled && !c.completed).length > 0 &&
                        <span className="count">{courses.filter(c => c.enrolled && !c.completed).length}</span>
                    }
                </button>
                <button
                    className={activeTab === 'certificates' ? 'active' : ''}
                    onClick={() => setActiveTab('certificates')}
                    disabled={!user.isConnected}
                >
                    🏆 Certificates
                    {certificates.length > 0 && <span className="count">{certificates.length}</span>}
                </button>
            </div>

            {/* Content Area */}
            <div className="demo-content">

                {/* CATALOG TAB */}
                {activeTab === 'catalog' && (
                    <div className="catalog-grid">
                        {courses.map(course => (
                            <div key={course.id} className="course-card">
                                <div className="card-header">
                                    <div className="course-icon">{course.image}</div>
                                    <span className={`level-tag ${course.level.toLowerCase()}`}>{course.level}</span>
                                </div>
                                <h3>{course.title}</h3>
                                <p>{course.description}</p>

                                <div className="course-metrics">
                                    <div className="metric">
                                        <span className="label">Reward</span>
                                        <span className="val highlight">+{course.reward} IONX</span>
                                    </div>
                                    <div className="metric">
                                        <span className="label">Modules</span>
                                        <span className="val">{course.modules}</span>
                                    </div>
                                    <div className="metric">
                                        <span className="label">Price</span>
                                        <span className="val">{course.price === 0 ? 'FREE' : `${course.price} IONX`}</span>
                                    </div>
                                </div>

                                {course.enrolled ? (
                                    <button className="action-btn secondary" disabled>Enrolled</button>
                                ) : (
                                    <button
                                        className="action-btn primary"
                                        onClick={() => user.isConnected ? enroll(course.id) : addNotification('Connect wallet first!', 'error')}
                                    >
                                        {course.price === 0 ? 'Enroll for Free' : `Buy for ${course.price} IONX`}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* MY COURSES TAB */}
                {activeTab === 'mycourses' && (
                    <div className="learning-dashboard">
                        {courses.filter(c => c.enrolled).length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📚</div>
                                <h3>No active courses</h3>
                                <p>Go to the catalog to start learning!</p>
                                <button onClick={() => setActiveTab('catalog')}>Browse Catalog</button>
                            </div>
                        ) : (
                            <div className="active-courses">
                                {courses.filter(c => c.enrolled).map(course => (
                                    <div key={course.id} className={`learning-card ${course.completed ? 'completed' : ''}`}>
                                        <div className="learning-info">
                                            <div className="mini-icon">{course.image}</div>
                                            <div>
                                                <h3>{course.title}</h3>
                                                <div className="progress-text">
                                                    {course.completed ? 'Completed!' : `${course.progress}% Complete`}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="progress-container">
                                            <div className="progress-bar" style={{ width: `${course.progress}%` }}></div>
                                        </div>

                                        <div className="learning-actions">
                                            {course.completed ? (
                                                <button className="action-btn success" disabled>
                                                    ✅ Reward Claimed
                                                </button>
                                            ) : (
                                                <button
                                                    className="action-btn primary"
                                                    onClick={() => progressCourse(course.id)}
                                                >
                                                    ▶ Continue Learning (+25%)
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* CERTIFICATES TAB */}
                {activeTab === 'certificates' && (
                    <div className="certificates-view">
                        {certificates.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🏆</div>
                                <h3>No Certificates Yet</h3>
                                <p>Complete a course to mint your on-chain certificate.</p>
                            </div>
                        ) : (
                            <div className="cert-grid">
                                {certificates.map(cert => (
                                    <div key={cert.id} className="nft-cert-card">
                                        <div className="cert-border">
                                            <div className="cert-content">
                                                <div className="cert-logo">🎓</div>
                                                <h4>Ionova University</h4>
                                                <div className="cert-title">Certificate of Completion</div>
                                                <div className="cert-course">{cert.title}</div>
                                                <div className="cert-details">
                                                    <span>Level: {cert.level}</span>
                                                    <span>Date: {cert.date}</span>
                                                </div>
                                                <div className="cert-id">Token ID: {cert.tokenId}</div>
                                            </div>
                                        </div>
                                        <div className="cert-actions">
                                            <button className="verify-btn">⛓️ Verify On-Chain</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default UniversityDemo;
