import { useCallback, useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import {getpost} from "./api/postapi";
import {loginUser} from "./api/postapi"; 
import {addStudent} from "./api/postapi"; 
import "./App.css"; 

const App = () => {
    const [init, setInit] = useState(false);
    

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const getpostData = async () => {
  try {
    const res = await getpost();
    console.log("Data received:", res.data);
  } catch (err) {
    console.error("API error:", err);
  }
};

    useEffect(() => {
        getpostData();
    }, []);

    const particlesLoaded = (container) => {
        console.log(container);
    };


    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginMessage, setLoginMessage] = useState(''); // To display login success/error messages


    // Handle user login
    const handleSignIn = async () => {
        setLoginMessage('Attempting to log in...'); // Clear previous messages
        try {
            const res = await loginUser(loginEmail, loginPassword);
            console.log("Login response:", res.data);
            setLoginMessage(res.data.message || "Login successful!");
            // Optionally, you could store user data (e.g., in context or local storage) here
            // and redirect the user or update UI to show they are logged in.
        } catch (err) {
            console.error("Login error:", err);
            if (err.response && err.response.data && err.response.data.error) {
                setLoginMessage(`Login failed: ${err.response.data.error}`);
            } else {
                setLoginMessage("Login failed: An unexpected error occurred.");
            }
        }
    };

    // --- Add these inside your App component, e.g., after your login-related state variables ---

    // State for Sign-Up form visibility
    const [showSignUpForm, setShowSignUpForm] = useState(false);

    // State for Sign-Up form inputs
    const [signUpFullname, setSignUpFullname] = useState('');
    const [signUpEmail, setSignUpEmail] = useState('');
    const [signUpPassword, setSignUpPassword] = useState('');
    const [signUpMessage, setSignUpMessage] = useState(''); // To display sign-up success/error messages

// --- End of new state variables ---

    // --- Add these inside your App component, e.g., after your handleSignIn function ---

    // Function to toggle sign-up form visibility
    const handleSignUpClick = () => {
        setShowSignUpForm(true); // Show the sign-up form
        setLoginMessage(''); // Clear any login messages
        setSignUpMessage(''); // Clear any previous sign-up messages
    };

    // Handle user sign-up submission
    const handleSignUpSubmit = async () => {
        setSignUpMessage('Registering user...');
        try {
            const res = await addStudent(signUpFullname, signUpEmail, signUpPassword);
            console.log("Sign-up response:", res.data);
            setSignUpMessage(res.data.message || "Sign-up successful!");
            // Clear form fields after successful registration
            setSignUpFullname('');
            setSignUpEmail('');
            setSignUpPassword('');
            // Optionally, hide the sign-up form after success
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

// --- End of new handler functions ---


    return (
        <>
            {init && (
                <Particles
                    id="tsparticles"
                    particlesLoaded={particlesLoaded}
                    options={{
                        background: {
                            color: {
                                value: "#	#FFFFFF",
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


  {/* <!-- Inside the <div className="right-side"> ... </div> block --> */}
{/* <!-- Modify the existing SignUp button to call handleSignUpClick --> */}
    {!showSignUpForm && (
  <div className="right-side">
    <h2 style={{ color: "white" }}>Don't have an account?</h2>
    <button className="b2" onClick={handleSignUpClick}>SignUp</button>
  </div>
)}



{/* <!-- Add this new conditional rendering block for the signup form --> */}
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
</div>

        </>
    );
};

export default App;
