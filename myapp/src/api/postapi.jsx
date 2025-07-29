import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:5000"
});

// --- JWT Interceptor (Commented Out) ---
// Add an interceptor to include the JWT in every request
// api.interceptors.request.use(
//     config => {
//         const token = localStorage.getItem('accessToken');
//         if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//             console.log("Axios Interceptor: Attaching Authorization header:");
//         }
//         else {
//             console.log("Axios Interceptor: No accessToken found in localStorage.");
//         }
//         return config;
//     },
//     error => {
//         return Promise.reject(error);
//     }
// );

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
    // Assuming your backend expects a POST request to /students/<stdid>/courses
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
    // Assuming your backend expects a DELETE request to /students/<stdid>/courses/<courseId>
    return api.delete(`/students/${studentId}/courses/${courseId}`);
}