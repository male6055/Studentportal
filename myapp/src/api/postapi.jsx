import axios from "axios";

const api = axios.create({
    baseURL : "http://127.0.0.1:5000"
});

// Add an interceptor to include the JWT in every request
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log("Axios Interceptor: Attaching Authorization header:");
        }
        else {
            console.log("Axios Interceptor: No accessToken found in localStorage.");
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

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

// fetching student data for dashboard
export const getStudentDashboard = () => {
    // The JWT is automatically added by the interceptor
    return api.get('/student/dashboard');
};

