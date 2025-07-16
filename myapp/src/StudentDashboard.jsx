import React, { useState, useEffect } from 'react';
import './App.css'; 
import { getStudentDashboard } from './api/postapi'; // Adjust path if necessary

const StudentDashboard = ({ onLogout }) => {
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError(null);

            const studentId = localStorage.getItem('currentStudentId'); 

            if (!studentId) {
                setError("Student not logged in. Please log in again.");
                setLoading(false);
                return;
            }

            try {
                const res = await getStudentDashboard(studentId);
                setStudentData(res.data);
            } catch (err) {
                console.error("Error fetching student dashboard:", err); // Log full error object

                if (err.response) {
                    console.error("Response data:", err.response.data);
                    console.error("Response status:", err.response.status);
                    console.error("Response headers:", err.response.headers);

                    setError(
                        err.response.data.error ||
                        err.response.data.msg ||
                        `Server Error: ${err.response.status}`
                    );

                    // --- JWT-related logic (commented out) ---
                    // if (err.response.status === 401 || err.response.status === 403) {
                    //     console.log("Authentication failed, logging out...");
                    //     onLogout(); // Force logout on token failure
                    // }
                } else if (err.request) {
                    console.error("No response received:", err.request);
                    setError("Network Error: Could not connect to the server. Please check your connection.");
                } else {
                    console.error("Request setup error:", err.message);
                    setError("An unexpected error occurred while making the request.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [onLogout]);

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
            <div className="student-info">
                <h1><strong>Welcome, {studentData.fullname}!</strong></h1>
                <div className='details'>
                    <p>Student ID: {studentData.stdid}</p>
                    <p>Email: {studentData.email}</p>
                </div>
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

            <div className='last_buttons'>
                <button className="b1 logout-button" onClick={onLogout}>Add Course</button>
                <button className="b1 logout-button" onClick={onLogout}>Delete Course</button>
                <button className="b1 logout-button" onClick={onLogout}>Logout</button>
            </div>
        </div>
    );
};

export default StudentDashboard;
