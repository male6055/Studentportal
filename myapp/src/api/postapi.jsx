import axios from "axios";

const api = axios.create({
    baseURL : "http://127.0.0.1:5000"
});

export const getpost = () => {
    return api.get('/students');
};

// --- If you have a separate postapi.js file, add this export there: ---
export const loginUser = (email, password) => {
    return api.post('/login', { email, password });
};

// --- If your API helper is integrated directly into App.js, add it like this: ---
// (Assuming 'api' axios instance is already defined)
// Example:
// const api = axios.create({ baseURL: "http://127.0.0.1:5000" });
// export const getStudents = () => { /* ... */ }; // Existing
// export const loginUser = (email, password) => {
//     return api.post('/login', { email, password });
// };

// --- If you have a separate postapi.js file, add this export there: ---
export const addStudent = (fullname, email, password) => {
    // The Flask endpoint expects 'name' for fullname
    return api.post('/students', { name: fullname, email, password });
};

// --- If your API helper is integrated directly into App.js, add it like this: ---
// (Assuming 'api' axios instance is already defined)
// Example:
// export const loginUser = (email, password) => { /* ... */ }; // Existing
