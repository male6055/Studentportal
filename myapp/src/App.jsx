import React, { useCallback, useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { getpost, loginUser, addStudent } from "./api/postapi";
import StudentDashboard from "./StudentDashboard"; // Ensure correct casing and path
import "./App.css";

const App = () => {
    const [init, setInit] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState(null); // Stores the user object {stdid, fullname, email}
    const [showSignUpForm, setShowSignUpForm] = useState(false);

    // Particles initialization
    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = (container) => {
        // console.log(container);
    };

    // --- EFFECT TO CHECK LOCAL STORAGE ON INITIAL LOAD ---
    useEffect(() => {
        const storedStudentId = localStorage.getItem('currentStudentId');
        const storedUserJson = localStorage.getItem('currentUser'); // Optional: if you store full user object

        if (storedStudentId && storedUserJson) {
            try {
                const user = JSON.parse(storedUserJson);
                // Basic validation to ensure it's a valid user object
                if (user && user.stdid === parseInt(storedStudentId)) {
                    setLoggedInUser(user);
                    //console.log("App: Restored user from localStorage:", user);
                } else {
                    // Mismatch or invalid stored user, clear it
                    localStorage.removeItem('currentStudentId');
                    localStorage.removeItem('currentUser');
                    console.log("App: Cleared invalid user data from localStorage.");
                }
            } catch (e) {
                console.error("App: Error parsing stored user data:", e);
                localStorage.removeItem('currentStudentId');
                localStorage.removeItem('currentUser');
            }
        } else if (storedStudentId && !storedUserJson) {
            // If only stdid is stored, but not the full user object,
            // you might want to fetch full user details here if needed for display
            // For now, we'll just set isAuthenticated based on stdid
            // For this specific setup, we need the full user object for StudentDashboard
            // So, if only stdid is present, we treat it as not logged in fully.
            console.log("App: Only stdid found, but no full user object. Treating as not logged in.");
            localStorage.removeItem('currentStudentId'); // Clear incomplete data
        }
    }, []);

    // --- Login State and Handlers ---
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginMessage, setLoginMessage] = useState('');

    const handleSignIn = async () => {
        setLoginMessage('Attempting to log in...');
        console.log("handleSignIn: Starting login process...");
        try {
            const res = await loginUser(loginEmail, loginPassword);
            console.log("handleSignIn: Login API call successful. Response data:");

            if (res.data && res.data.user && res.data.user.stdid) {
                const user = res.data.user;
                localStorage.setItem('currentStudentId', user.stdid); // Store stdid
                localStorage.setItem('currentUser', JSON.stringify(user)); // Store full user object

                setLoggedInUser(user); // Set the user object in state
                setLoginMessage(res.data.message || "Login successful!");
                setLoginEmail('');
                setLoginPassword('');
                console.log("handleSignIn: Login process completed successfully. User:");
            } else {
                console.error("handleSignIn: Login successful but user data/stdid not found in response.");
                setLoginMessage("Login successful, but user data incomplete. Please contact support.");
                setLoggedInUser(null);
                localStorage.removeItem('currentStudentId');
                localStorage.removeItem('currentUser');
            }

        } catch (err) {
            console.error("handleSignIn: Login error caught:", err);
            if (err.response && err.response.data && err.response.data.error) {
                setLoginMessage(`Login failed: ${err.response.data.error}`);
            } else {
                setLoginMessage("Login failed: An unexpected error occurred.");
            }
            setLoggedInUser(null);
            localStorage.removeItem('currentStudentId');
            localStorage.removeItem('currentUser');
            console.log("handleSignIn: Login process failed.");
        }
    };

    const handleLogout = useCallback(() => {
        console.log("Logging out...");
        localStorage.removeItem('currentStudentId'); // Clear the stored ID
        localStorage.removeItem('currentUser'); // Clear the stored user object
        setLoggedInUser(null);
        setLoginMessage('Logged out successfully.');
        setShowSignUpForm(false);
    }, []);

    // --- Sign-Up State and Handlers ---
    const [signUpFullname, setSignUpFullname] = useState('');
    const [signUpEmail, setSignUpEmail] = useState('');
    const [signUpPassword, setSignUpPassword] = useState('');
    const [signUpMessage, setSignUpMessage] = useState('');

    const handleSignUpClick = () => {
        setShowSignUpForm(true);
        setLoginMessage('');
        setSignUpMessage('');
    };

    const handleSignUpSubmit = async () => {
        setSignUpMessage('Registering user...');
        try {
            const res = await addStudent(signUpFullname, signUpEmail, signUpPassword);
            console.log("Sign-up response:", res.data);
            setSignUpMessage(res.data.message || "Sign-up successful! You can now log in.");
            setSignUpFullname('');
            setSignUpEmail('');
            setSignUpPassword('');
            setShowSignUpForm(false); // Go back to login form after successful signup
        } catch (err) {
            console.error("Sign-up error:", err);
            if (err.response && err.response.data && err.response.data.error) {
                setSignUpMessage(`Sign-up failed: ${err.response.data.error}`);
            } else {
                setSignUpMessage("Sign-up failed: An unexpected error occurred.");
            }
        }
    };

    return (
        <>
            {init && (
                <Particles
                    id="tsparticles"
                    particlesLoaded={particlesLoaded}
                    options={{
                        background: {
                            color: {
                                value: "#222121",
                            },
                        },
                        fpsLimit: 120,
                        interactivity: {
                            events: {
                                onClick: {
                                    enable: true,
                                    mode: "push",
                                },
                                onHover: {
                                    enable: true,
                                    mode: "repulse",
                                },
                                resize: true,
                            },
                            modes: {
                                push: {
                                    quantity: 4,
                                },
                                repulse: {
                                    distance: 200,
                                    duration: 0.4,
                                },
                            },
                        },
                        particles: {
                            color: {
                                value: "#ffffff",
                            },
                            links: {
                                color: "#ffffff",
                                distance: 150,
                                enable: true,
                                opacity: 0.5,
                                width: 1,
                            },
                            move: {
                                direction: "none",
                                enable: true,
                                outModes: {
                                    default: "bounce",
                                },
                                random: false,
                                speed: 6,
                                straight: false,
                            },
                            number: {
                                density: {
                                    enable: true,
                                    area: 800,
                                },
                                value: 80,
                            },
                            opacity: {
                                value: 0.5,
                            },
                            shape: {
                                type: "circle",
                            },
                            size: {
                                value: { min: 1, max: 5 },
                            },
                        },
                        detectRetina: true,
                    }}
                />
            )}
            <div className="main-container">
                {loggedInUser ? ( // Conditional rendering based on loggedInUser state
                    <StudentDashboard onLogout={handleLogout} />
                ) : (
                    <>
                        {!showSignUpForm && (
                            <div className="first">
                                <h2>Welcome to My First App</h2>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    required // Added required
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    required // Added required
                                />
                                <button className="b1" onClick={handleSignIn}>SignIn</button>
                                {loginMessage && (
                                    <p className={`login-message ${loginMessage.includes('successful') ? 'success' : ''}`}>
                                        {loginMessage}
                                    </p>
                                )}
                            </div>
                        )}

                        {!showSignUpForm && (
                            <div className="right-side">
                                <h2 style={{ color: "white" }}>Don't have an account?</h2>
                                <button className="b2" onClick={handleSignUpClick}>SignUp</button>
                            </div>
                        )}

                        {showSignUpForm && (
                            <div className="signup-form-container">
                                <h2>Sign Up to My First App</h2>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={signUpFullname}
                                    onChange={(e) => setSignUpFullname(e.target.value)}
                                    required // Added required
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={signUpEmail}
                                    onChange={(e) => setSignUpEmail(e.target.value)}
                                    required // Added required
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={signUpPassword}
                                    onChange={(e) => setSignUpPassword(e.target.value)}
                                    required // Added required
                                />
                                <div className="buttons">
                                    <button className="b1" onClick={handleSignUpSubmit}>Register</button>
                                    {signUpMessage && (
                                        <p className={`signup-message ${signUpMessage.includes('successful') ? 'success' : ''}`}>
                                            {signUpMessage}
                                        </p>
                                    )}
                                    <button className="b2" onClick={() => setShowSignUpForm(false)} style={{ marginTop: '10px' }}>
                                        Back to Login
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

export default App;