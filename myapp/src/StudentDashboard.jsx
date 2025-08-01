import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { addCourse, getStudentDashboard, DeleteCourse } from './api/postapi';

const StudentDashboard = ({ onLogout }) => {
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newCourseCode, setNewCourseCode] = useState('');
    const [newCourseName, setNewCourseName] = useState('');
    const [newCourseDescription, setNewCourseDescription] = useState('');
    const [addCourseMessage, setAddCourseMessage] = useState('');
    const [showAddCourseForm, setShowAddCourseForm] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);

        const studentId = localStorage.getItem('currentStudentId');

        if (!studentId) {
            setError("Student not logged in. Please log in again.");
            setLoading(false);
            onLogout();
            return;
        }

        try {
            const res = await getStudentDashboard(studentId);
            setStudentData(res.data);
        } catch (err) {
            console.error("Error fetching student dashboard:", err);
            if (err.response) {
                setError(err.response.data.error || err.response.data.msg || `Server Error: ${err.response.status}`);
                if ([404, 401, 403].includes(err.response.status)) {
                    onLogout();
                }
            } else if (err.request) {
                setError("Network Error: Could not connect to the server. Please check your connection.");
            } else {
                setError("An unexpected error occurred while making the request.");
            }
        } finally {
            setLoading(false);
        }
    }, [onLogout]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleAddCourse = async () => {
        setAddCourseMessage('Adding course...');
        const studentId = localStorage.getItem('currentStudentId');

        if (!studentId) {
            setAddCourseMessage("Error: Not logged in. Cannot add course.");
            onLogout();
            return;
        }

        if (!newCourseCode || !newCourseName || !newCourseDescription) {
            setAddCourseMessage("Please fill in all course details.");
            return;
        }

        const courseData = {
            coursecode: newCourseCode,
            coursename: newCourseName,
            description: newCourseDescription
        };

        try {
            const res = await addCourse(studentId, courseData);
            setAddCourseMessage(res.data.message || "Course added successfully!");
            setNewCourseCode('');
            setNewCourseName('');
            setNewCourseDescription('');
            setShowAddCourseForm(false);
            fetchDashboardData();
        } catch (err) {
            console.error("Error adding course:", err);
            setAddCourseMessage(err.response?.data?.error ? `Failed to add course: ${err.response.data.error}` : "Failed to add course. An unexpected error occurred.");
        }
    };

    if (loading) {
        return <div className="dashboard-container"><p>Loading student dashboard...</p></div>;
    }

    if (error) {
        return <div className="dashboard-container"><p style={{ color: 'red' }}>Error: {error}</p><button className="b1" onClick={onLogout}>Logout</button></div>;
    }

    if (!studentData) {
        return <div className="dashboard-container"><p>No student data available. Please try logging in again.</p><button className="b1" onClick={onLogout}>Logout</button></div>;
    }

    return (
        <div className="dashboard-container">

            <div className="student-info">
                <h1><strong>Welcome, {studentData.fullname}!</strong></h1>
                <div className='details'>
                    <p>Student ID: {studentData.stdid}</p>
                    <p>Email: {studentData.email}</p>
                </div>
            </div>

            <h3 className="courses-title">Your Enrolled Courses:</h3>
            {studentData.courses && studentData.courses.length > 0 ? (
                <div className="course-catalog">
                    {studentData.courses.map((course) => (
                        <div key={course.CourseId} className="course-card">
                            <h4 className="course-code">{course.coursecode}: {course.coursename}</h4>
                            <div className="course-bottom-row">
                                <p className="course-description">{course.description}</p>
                                <button
                                    className="delete-button"
                                    onClick={async () => {
                                        try {
                                            await DeleteCourse(localStorage.getItem("currentStudentId"), course.CourseId);
                                            fetchDashboardData();
                                        } catch (err) {
                                            console.error("Error deleting course:", err);
                                            alert("Failed to delete course.");
                                        }
                                    }}
                                >
                                    Delete
                                </button>

                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-courses-message">You are not currently enrolled in any courses.</p>
            )}

            <div className="last_buttons">
                {!showAddCourseForm ? (
                    <button className="b1" onClick={() => setShowAddCourseForm(true)}>Add Course</button>
                ) : (
                    <div className="add-course-form">
                        <h3>Add New Course</h3>
                        <input type="text" placeholder="Course Code (e.g., CS101)" value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value)} required />
                        <input type="text" placeholder="Course Name" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} required />
                        <textarea placeholder="Course Description" value={newCourseDescription} onChange={(e) => setNewCourseDescription(e.target.value)} rows="3" required></textarea>
                        <div className="buttons">
                            <button className="b1" onClick={handleAddCourse}>Submit Course</button>
                            <button className="b2" onClick={() => setShowAddCourseForm(false)}>Cancel</button>
                        </div>
                        {addCourseMessage && <p className="add-course-message">{addCourseMessage}</p>}
                    </div>
                )}
            </div>

            <div className='last_buttons'>
                <button className="b1 logout-button" onClick={onLogout}>Logout</button>
            </div>

            <footer className="site-footer">
                <div className="footer-content">
                    <div className="footer-section about">
                        <h3>About Us</h3>
                        <p>We are a passionate team dedicated to creating amazing web experiences. Our mission is to deliver high-quality, user-friendly solutions.</p>
                    </div>

                    <div className="footer-section links">
                        <h3>Quick Links</h3>
                        <ul>
                            <li><a href="#home">Home</a></li>
                            <li><a href="#about">About</a></li>
                            <li><a href="#contact">Contact</a></li>
                            <li><a href="#privacy">Privacy Policy</a></li>
                        </ul>
                    </div>

                    <div className="footer-section social">
                        <h3>Follow Us</h3>
                        <div className="social-icons">
                            <a href="#" className="social-icon">👍</a> {/* Facebook/LinkedIn */}
                            <a href="#" className="social-icon">🐦</a> {/* Twitter/X */}
                            <a href="#" className="social-icon">📸</a> {/* Instagram */}
                            <a href="#" className="social-icon">▶️</a> {/* YouTube */}
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    &copy; 2025 YourCompany. All rights reserved.
                </div>
            </footer>
            

        </div>
    );
};

export default StudentDashboard;
