import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import './University.css';

/**
 * Ionova University - Main LMS Component
 * Course catalog, enrollment, and learning dashboard
 */
const University = () => {
    const { address, isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState('catalog');
    const [courses, setCourses] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [rewards, setRewards] = useState({ earned: 0, claimed: 0, streak: 0 });

    // Mock data for demonstration
    const mockCourses = [
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
            image: '/images/course-blockchain.jpg'
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
            image: '/images/course-solidity.jpg'
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
            image: '/images/course-defi.jpg'
        },
        {
            id: 4,
            title: 'Gaming on Blockchain',
            description: 'Create play-to-earn games on Ionova',
            level: 'Intermediate',
            price: 75,
            reward: 300,
            modules: 9,
            duration: '15 hours',
            students: 623,
            rating: 4.8,
            image: '/images/course-gaming.jpg'
        },
        {
            id: 5,
            title: 'Ionova Certified Blockchain Expert',
            description: 'Comprehensive certification program',
            level: 'Expert',
            price: 500,
            reward: 1000,
            modules: 25,
            duration: '60 hours',
            students: 189,
            rating: 5.0,
            image: '/images/course-expert.jpg'
        }
    ];

    useEffect(() => {
        setCourses(mockCourses);
        // Load user data if connected
        if (isConnected) {
            loadUserData();
        }
    }, [isConnected]);

    const loadUserData = async () => {
        // TODO: Load from smart contract
        setEnrolledCourses([mockCourses[0]]);
        setRewards({ earned: 450, claimed: 200, streak: 7 });
    };

    const enrollInCourse = async (courseId) => {
        // TODO: Call smart contract
        console.log('Enrolling in course:', courseId);
    };

    return (
        <div className="university-container">
            {/* Header */}
            <div className="university-header">
                <div className="header-content">
                    <h1>🎓 Ionova University</h1>
                    <p>Learn blockchain technology, earn IONX, get certified</p>
                </div>

                {isConnected && (
                    <div className="user-stats">
                        <div className="stat">
                            <span className="stat-label">Earned</span>
                            <span className="stat-value">{rewards.earned} IONX</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Streak</span>
                            <span className="stat-value">{rewards.streak} days 🔥</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="university-nav">
                <button
                    className={activeTab === 'catalog' ? 'active' : ''}
                    onClick={() => setActiveTab('catalog')}
                >
                    📚 Course Catalog
                </button>
                <button
                    className={activeTab === 'mycourses' ? 'active' : ''}
                    onClick={() => setActiveTab('mycourses')}
                    disabled={!isConnected}
                >
                    📖 My Courses
                </button>
                <button
                    className={activeTab === 'certificates' ? 'active' : ''}
                    onClick={() => setActiveTab('certificates')}
                    disabled={!isConnected}
                >
                    🏆 Certificates
                </button>
                <button
                    className={activeTab === 'rewards' ? 'active' : ''}
                    onClick={() => setActiveTab('rewards')}
                    disabled={!isConnected}
                >
                    💰 Rewards
                </button>
            </div>

            {/* Content */}
            <div className="university-content">
                {activeTab === 'catalog' && (
                    <CourseCatalog
                        courses={courses}
                        onEnroll={enrollInCourse}
                        isConnected={isConnected}
                    />
                )}

                {activeTab === 'mycourses' && (
                    <MyCourses courses={enrolledCourses} />
                )}

                {activeTab === 'certificates' && (
                    <Certificates certificates={certificates} />
                )}

                {activeTab === 'rewards' && (
                    <Rewards rewards={rewards} />
                )}
            </div>
        </div>
    );
};

// Course Catalog Component
const CourseCatalog = ({ courses, onEnroll, isConnected }) => {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const filteredCourses = courses.filter(course => {
        const matchesFilter = filter === 'all' || course.level === filter;
        const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) ||
            course.description.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="course-catalog">
            {/* Filters */}
            <div className="catalog-filters">
                <input
                    type="text"
                    placeholder="Search courses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                />

                <div className="level-filters">
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        All Levels
                    </button>
                    <button
                        className={filter === 'Beginner' ? 'active' : ''}
                        onClick={() => setFilter('Beginner')}
                    >
                        Beginner
                    </button>
                    <button
                        className={filter === 'Intermediate' ? 'active' : ''}
                        onClick={() => setFilter('Intermediate')}
                    >
                        Intermediate
                    </button>
                    <button
                        className={filter === 'Advanced' ? 'active' : ''}
                        onClick={() => setFilter('Advanced')}
                    >
                        Advanced
                    </button>
                    <button
                        className={filter === 'Expert' ? 'active' : ''}
                        onClick={() => setFilter('Expert')}
                    >
                        Expert
                    </button>
                </div>
            </div>

            {/* Course Grid */}
            <div className="course-grid">
                {filteredCourses.map(course => (
                    <div key={course.id} className="course-card">
                        <div className="course-image">
                            <span className="course-level">{course.level}</span>
                        </div>

                        <div className="course-info">
                            <h3>{course.title}</h3>
                            <p>{course.description}</p>

                            <div className="course-meta">
                                <span>⭐ {course.rating}</span>
                                <span>👥 {course.students} students</span>
                                <span>⏱️ {course.duration}</span>
                            </div>

                            <div className="course-stats">
                                <div className="stat">
                                    <span className="label">Modules</span>
                                    <span className="value">{course.modules}</span>
                                </div>
                                <div className="stat">
                                    <span className="label">Reward</span>
                                    <span className="value">{course.reward} IONX</span>
                                </div>
                                <div className="stat">
                                    <span className="label">Price</span>
                                    <span className="value">
                                        {course.price === 0 ? 'FREE' : `${course.price} IONX`}
                                    </span>
                                </div>
                            </div>

                            <button
                                className="enroll-btn"
                                onClick={() => onEnroll(course.id)}
                                disabled={!isConnected}
                            >
                                {isConnected ? 'Enroll Now' : 'Connect Wallet to Enroll'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// My Courses Component
const MyCourses = ({ courses }) => {
    if (courses.length === 0) {
        return (
            <div className="empty-state">
                <h2>No Enrolled Courses</h2>
                <p>Browse the catalog and enroll in a course to get started!</p>
            </div>
        );
    }

    return (
        <div className="my-courses">
            {courses.map(course => (
                <div key={course.id} className="enrolled-course">
                    <div className="course-header">
                        <h3>{course.title}</h3>
                        <span className="progress">45% Complete</span>
                    </div>

                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '45%' }}></div>
                    </div>

                    <div className="course-actions">
                        <button className="continue-btn">Continue Learning</button>
                        <button className="view-btn">View Certificate</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Certificates Component
const Certificates = ({ certificates }) => {
    if (certificates.length === 0) {
        return (
            <div className="empty-state">
                <h2>No Certificates Yet</h2>
                <p>Complete courses to earn NFT certificates!</p>
            </div>
        );
    }

    return (
        <div className="certificates-grid">
            {certificates.map(cert => (
                <div key={cert.id} className="certificate-card">
                    <div className="certificate-image">
                        <h4>{cert.title}</h4>
                    </div>
                    <button className="verify-btn">Verify On-Chain</button>
                </div>
            ))}
        </div>
    );
};

// Rewards Component
const Rewards = ({ rewards }) => {
    return (
        <div className="rewards-section">
            <div className="rewards-summary">
                <div className="reward-card">
                    <h3>Total Earned</h3>
                    <p className="reward-amount">{rewards.earned} IONX</p>
                </div>
                <div className="reward-card">
                    <h3>Claimed</h3>
                    <p className="reward-amount">{rewards.claimed} IONX</p>
                </div>
                <div className="reward-card">
                    <h3>Available</h3>
                    <p className="reward-amount">{rewards.earned - rewards.claimed} IONX</p>
                    <button className="claim-btn">Claim Rewards</button>
                </div>
            </div>

            <div className="streak-section">
                <h3>🔥 Learning Streak: {rewards.streak} days</h3>
                <p>Keep learning daily to earn bonus rewards!</p>
                <div className="streak-milestones">
                    <div className={`milestone ${rewards.streak >= 7 ? 'achieved' : ''}`}>
                        <span>7 days</span>
                        <span>+50 IONX</span>
                    </div>
                    <div className={`milestone ${rewards.streak >= 30 ? 'achieved' : ''}`}>
                        <span>30 days</span>
                        <span>+200 IONX</span>
                    </div>
                    <div className={`milestone ${rewards.streak >= 90 ? 'achieved' : ''}`}>
                        <span>90 days</span>
                        <span>+500 IONX</span>
                    </div>
                    <div className={`milestone ${rewards.streak >= 365 ? 'achieved' : ''}`}>
                        <span>365 days</span>
                        <span>+2000 IONX</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default University;
