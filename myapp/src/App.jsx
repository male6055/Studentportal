import React, { useCallback, useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { getpost, loginUser, addStudent } from "./api/postapi"; // Import all API functions
import StudentDashboard from "./studentdashboard"; // Import the new dashboard component
import "./App.css";

const App = () => {
    const [init, setInit] = useState(false);
// loggedInUser will be null if not logged in, or an object if logged in.
// Initialize by checking localStorage for a token.
const [loggedInUser, setLoggedInUser] = useState(() => {
    const token = localStorage.getItem('accessToken');
    // If a token exists, assume logged in for now. StudentDashboard will verify it.
    return token ? { stdid: 'checking', fullname: 'Loading...', email: 'loading...' } : null;
});
const [showSignUpForm, setShowSignUpForm] = useState(false); // This line was already there, ensure it's below loggedInUser

    // Particles initialization
    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = (container) => {
        console.log(container);
    };

    // --- Login State and Handlers ---
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginMessage, setLoginMessage] = useState('');

      const handleSignIn = async () => {
        setLoginMessage('Attempting to log in...');
        console.log("handleSignIn: Starting login process..."); // Debug log 1
        try {
            const res = await loginUser(loginEmail, loginPassword);
            console.log("handleSignIn: Login API call successful. Response data:", res.data); // Debug log 2
            
            // Check if access_token exists in the response data
            if (res.data && res.data.access_token) {
                console.log("handleSignIn: Access token found in response. Storing in localStorage..."); // Debug log 3
                console.log("handleSignIn: Value of res.data.access_token BEFORE storing:");
                localStorage.setItem('accessToken', res.data.access_token);
                console.log("handleSignIn: Access token stored. Verifying localStorage content..."); // Debug log 4
                const storedToken = localStorage.getItem('accessToken');
                console.log("handleSignIn: Token retrieved from localStorage immediately after setting:"); // Debug log 5

                setLoggedInUser(res.data.user);
                setLoginMessage(res.data.message || "Login successful!");
                setLoginEmail('');
                setLoginPassword('');
                console.log("handleSignIn: Login process completed successfully."); // Debug log 6
            } else {
                console.error("handleSignIn: Login API call successful, but no access_token found in response data."); // Debug log 7
                setLoginMessage("Login successful, but token not received. Please contact support.");
                setLoggedInUser(null);
                localStorage.removeItem('accessToken');
            }

        } catch (err) {
            console.error("handleSignIn: Login error caught:", err); // Debug log 8
            if (err.response && err.response.data && err.response.data.error) {
                setLoginMessage(`Login failed: ${err.response.data.error}`);
            } else {
                setLoginMessage("Login failed: An unexpected error occurred.");
            }
            setLoggedInUser(null);
            localStorage.removeItem('accessToken');
            console.log("handleSignIn: Login process failed."); // Debug log 9
        }
    };
    

    // Use useCallback to memoize this function, preventing unnecessary re-renders in children
    const handleLogout = useCallback(() => {
        console.log("Logging out...");
        localStorage.removeItem('accessToken'); // Remove JWT from local storage
        setLoggedInUser(null); // Clear logged-in user state
        setLoginMessage('Logged out successfully.'); // Optional: show a message
        setShowSignUpForm(false); // Ensure we go back to login form
    }, []); // Empty dependency array means this function is stable



    // Check for existing token on component mount (for auto-login)
    // useEffect(() => {
    //     const token = localStorage.getItem('accessToken');
    //     if (token) {
    //         // If a token exists, we assume the user is logged in.
    //         // The StudentDashboard component will then verify the token by making its own request.
    //         // For a more robust solution, you might decode the token here or make a quick API call
    //         // to verify it and fetch user details. For now, we'll just set a placeholder.
    //         setLoggedInUser({ stdid: 'loading', fullname: 'Loading...', email: 'loading...' });
    //     }
    // }, []);


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
            // Optionally, switch back to login form after successful signup
            // setShowSignUpForm(false);
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
                {loggedInUser ? (
                    // If loggedInUser is not null, show the StudentDashboard
                    <StudentDashboard onLogout={handleLogout} />
                ) : (
                    // Otherwise, show login or signup forms
                    <>
                        {!showSignUpForm && (
                            <div className="first">
                                <h2>Welcome to My First App</h2>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
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
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={signUpEmail}
                                    onChange={(e) => setSignUpEmail(e.target.value)}
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={signUpPassword}
                                    onChange={(e) => setSignUpPassword(e.target.value)}
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
