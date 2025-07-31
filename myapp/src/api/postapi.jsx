import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:5000"
});

export const getpost = () => {
    return api.get('/students');
};

export const loginUser = (email, password) => {
    return api.post('/login', { email, password });
};

export const addStudent = (fullname, email, password) => {
    // The Flask endpoint expects 'name' for fullname
    return api.post('/students', { name: fullname, email, password });
};

export const getStudentDashboard = (studentId) => { 

    if (!studentId) {
        console.error("getStudentDashboard: Student ID is required.");
        return Promise.reject(new Error("Student ID is missing for dashboard request."));
    }

    return api.get(`/students/${studentId}/dashboard`); 
};

export const addCourse = (studentId, courseData) => {
    if (!studentId) {
        console.error("addCourse: Student ID is required.");
        return Promise.reject(new Error("Student ID is missing for adding course."));
    }
    if (!courseData || !courseData.coursecode || !courseData.coursename || !courseData.description) {
        console.error("addCourse: Missing course data (coursecode, coursename, or description).");
        return Promise.reject(new Error("Missing course data for adding course."));
    }
    // backend expects a POST request to /students/<stdid>/courses
    // and expects JSON body like { "coursecode": "...", "coursename": "...", "description": "..." }
    return api.post(`/students/${studentId}/courses`, courseData);
};

export const DeleteCourse = (studentId, courseId) => {
    if (!studentId) {
        console.error("DeleteCourse: Student ID is required.");
        return Promise.reject(new Error("Student ID is missing for deleting course."));
    }
    if (!courseId) {
        console.error("DeleteCourse: Course ID is required.");
        return Promise.reject(new Error("Course ID is missing for deleting course."));
    }
    return api.delete(`/students/${studentId}/courses/${courseId}`);
}