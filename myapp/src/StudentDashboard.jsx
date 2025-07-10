import React, { useState, useEffect } from 'react';
import { getStudentDashboard } from './api/postapi'; // Adjust path if necessary, assuming postapi.js is in src/api

const StudentDashboard = ({ onLogout }) => {
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res =  getStudentDashboard();
                setStudentData(res.data);
            } catch (err) {
                console.error("Error fetching student dashboard:", err); // Log the full error object

                if (err.response) {
                    // Server responded with a status other than 2xx
                    console.error("Response data:", err.response.data);
                    console.error("Response status:", err.response.status);
                    console.error("Response headers:", err.response.headers);

                    setError(err.response.data.error || err.response.data.msg || `Server Error: ${err.response.status}`);

                    // Specifically check for authentication/authorization errors
                    if (err.response.status === 401 || err.response.status === 403) {
                        console.log("Authentication failed, logging out...");
                        onLogout(); // Call the logout function passed from App.jsx
                    }
                } else if (err.request) {
                    // Request was made but no response received (e.g., network down, CORS issue)
                    console.error("No response received:", err.request);
                    setError("Network Error: Could not connect to the server. Please check your connection.");
                } else {
                    // Something else happened in setting up the request
                    console.error("Request setup error:", err.message);
                    setError("An unexpected error occurred while making the request.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [onLogout]); // Dependency array includes onLogout

    if (loading) {
        return (
            <div className="dashboard-container">
                <p>Loading student dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <p style={{ color: 'red' }}>Error: {error}</p>
                <button className="b1" onClick={onLogout}>Logout</button>
            </div>
        );
    }

    if (!studentData) {
        return (
            <div className="dashboard-container">
                <p>No student data available. Please try logging in again.</p>
                <button className="b1" onClick={onLogout}>Logout</button>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <h2 className="dashboard-title">Student Portal</h2>
            <div className="student-info">
                <p><strong>Welcome, {studentData.fullname}!</strong></p>
                <p>Student ID: {studentData.stdid}</p>
                <p>Email: {studentData.email}</p>
            </div>

            <h3 className="courses-title">Your Enrolled Courses:</h3>
            {studentData.courses && studentData.courses.length > 0 ? (
                <ul className="course-list">
                    {studentData.courses.map((course) => (
                        <li key={course.CourseId} className="course-item">
                            <h4>{course.coursecode}: {course.coursename}</h4>
                            <p>{course.description}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-courses-message">You are not currently enrolled in any courses.</p>
            )}

            <button className="b1 logout-button" onClick={onLogout}>Logout</button>
        </div>
    );
};

export default StudentDashboard;
