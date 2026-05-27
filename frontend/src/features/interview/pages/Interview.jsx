import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import '../style/interview.scss';

import { useInterview } from '../hooks/useInterview.js';
import Sidebar from '../components/Sidebar.jsx';

const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg> },
    { id: 'behavioral', label: 'Behavioral Questions', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
    { id: 'roadmap', label: 'Road Map', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg> },
];

const QuestionCard = ({ item, index }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item?.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item?.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item?.answer}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const RoadMapDay = ({ day }) => (
    <div className='roadmap-day'>
        <div className='roadmap-day__header'>
            <span className='roadmap-day__badge'>Day {day?.day}</span>
            <h3 className='roadmap-day__focus'>{day?.focus}</h3>
        </div>
        <ul className='roadmap-day__tasks'>
            {day?.tasks?.map((task, i) => (
                <li key={i}>
                    <span className='roadmap-day__bullet' />
                    {task}
                </li>
            ))}
        </ul>
    </div>
);

const ErrorBanner = ({ message }) => (
    <div className='error-banner'>
        {message}
    </div>
);

const Interview = () => {
    const { interviewId } = useParams();
    const navigate = useNavigate();
    const { report, loading, error, getResumePdf, reports } = useInterview();

    const [activeNav, setActiveNav] = useState('technical');
    const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light');
    const [copied, setCopied] = useState(false);

    const handleShare = useCallback(() => {
        const url = `${window.location.origin}/interview/${interviewId}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    }, [interviewId]);

    const handleThemeToggle = useCallback(() => {
        const next = !isDark;
        setIsDark(next);
        document.body.classList.toggle('light-mode', !next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
    }, [isDark]);

    const scoreColor = useMemo(() => {
        if (!report) return 'score--low';
        return report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low';
    }, [report]);

    // 🟢 FIXED: Handle the asset download trigger cleanly with a local component catch boundary
    const handleDownloadPdf = async () => {
        try {
            await getResumePdf(interviewId);
        } catch (err) {
            console.error("PDF download caught locally:", err);
            alert("Could not download the document asset right now. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className='app-layout'>
                <Sidebar reports={reports || []} onThemeToggle={handleThemeToggle} isDark={isDark} />
                <main className='loading-screen'>
                    <div className='inline-spinner' />
                    <h1>Loading your interview plan...</h1>
                </main>
            </div>
        );
    }

    if (error) {
        // 🟢 FIXED: Enhanced check tracking both numeric state status or message context strings safely
        const isQuota = 
            error.status === 429 || 
            String(error.message).toLowerCase().includes('quota') ||
            String(error.message).includes('API_QUOTA_EXHAUSTED');

        const msg = isQuota 
            ? "⏳ Free Tier Quota Exhausted! The Gemini Engine is resting. Please try again in a few hours." 
            : `❌ Failed to load report: ${error.message || "Unknown server error"}`;

        return (
            <div className='app-layout'>
                <Sidebar reports={reports || []} onThemeToggle={handleThemeToggle} isDark={isDark} />
                <main className='loading-screen'>
                    <h1>Interview Report Plan</h1>
                    <ErrorBanner message={msg} />
                    <button className='button primary-button' style={{ marginTop: '20px' }} onClick={() => navigate('/')}>
                        Go Home
                    </button>
                </main>
            </div>
        );
    }

    if (!report) return null;

    return (
        <div className='app-layout'>
            <Sidebar reports={reports || []} onThemeToggle={handleThemeToggle} isDark={isDark} />

            <div className='interview-page'>
                <div className='interview-layout'>
                    <nav className='interview-nav'>
                        <div className="nav-content">
                            <button className='interview-nav__back' onClick={() => navigate('/')}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                                Back to Home
                            </button>

                            <p className='interview-nav__label'>Sections</p>
                            {NAV_ITEMS.map(item => (
                                <button
                                    key={item.id}
                                    className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                    onClick={() => setActiveNav(item.id)}
                                >
                                    <span className='interview-nav__icon'>{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <button className='interview-nav__share' onClick={handleShare}>
                            {copied ? "Link Copied!" : "Share Report"}
                        </button>

                        {/* 🟢 FIXED: Swap raw hook execution with the protected download handler */}
                        <button onClick={handleDownloadPdf} className='button primary-button'>
                            Download Resume
                        </button>
                    </nav>

                    <div className='interview-divider' />

                    <main className='interview-content'>
                        {activeNav === 'technical' && (
                            <section>
                                <div className='content-header'>
                                    <h2>Technical Questions</h2>
                                    <span className='content-header__count'>{report.technicalQuestions?.length || 0} questions</span>
                                </div>
                                <div className='q-list'>
                                    {report.technicalQuestions?.map((q, i) => <QuestionCard key={i} item={q} index={i} />)}
                                </div>
                            </section>
                        )}
                        {activeNav === 'behavioral' && (
                            <section>
                                <div className='content-header'>
                                    <h2>Behavioral Questions</h2>
                                    <span className='content-header__count'>{report.behavioralQuestions?.length || 0} questions</span>
                                </div>
                                <div className='q-list'>
                                    {report.behavioralQuestions?.map((q, i) => <QuestionCard key={i} item={q} index={i} />)}
                                </div>
                            </section>
                        )}
                        {activeNav === 'roadmap' && (
                            <section>
                                <div className='content-header'>
                                    <h2>Preparation Road Map</h2>
                                    <span className='content-header__count'>{report.preparationPlan?.length || 0}-day plan</span>
                                </div>
                                <div className='roadmap-list'>
                                    {report.preparationPlan?.map((day, i) => <RoadMapDay key={day.day || i} day={day} />)}
                                </div>
                            </section>
                        )}
                    </main>

                    <aside className='interview-sidebar'>
                        <div className='match-score'>
                            <p className='match-score__label'>Match Score</p>
                            <div className={`match-score__ring ${scoreColor}`}>
                                <span className='match-score__value'>{report.matchScore || 0}</span>
                            </div>
                        </div>
                        <div className='skill-gaps'>
                            <p className='skill-gaps__label'>Skill Gaps</p>
                            <div className='skill-gaps__list'>
                                {report.skillGaps?.map((gap, i) => (
                                    <span key={i} className={`skill-tag skill-tag--${gap?.severity || 'medium'}`}>
                                        {gap?.skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default Interview;