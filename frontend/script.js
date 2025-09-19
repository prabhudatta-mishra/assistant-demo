document.addEventListener('DOMContentLoaded', () => {
    particlesJS("particles-js", {
        "particles": {
            "number": {
                "value": 80,
                "density": {
                    "enable": true,
                    "value_area": 800
                }
            },
            "color": {
                "value": "#0ff"
            },
            "shape": {
                "type": "circle",
                "stroke": {
                    "width": 0,
                    "color": "#000000"
                },
                "polygon": {
                    "nb_sides": 5
                }
            },
            "opacity": {
                "value": 0.5,
                "random": false,
                "anim": {
                    "enable": false,
                    "speed": 1,
                    "opacity_min": 0.1,
                    "sync": false
                }
            },
            "size": {
                "value": 3,
                "random": true,
                "anim": {
                    "enable": false,
                    "speed": 40,
                    "size_min": 0.1,
                    "sync": false
                }
            },
            "line_linked": {
                "enable": true,
                "distance": 150,
                "color": "#0ff",
                "opacity": 0.4,
                "width": 1
            },
            "move": {
                "enable": true,
                "speed": 6,
                "direction": "none",
                "random": false,
                "straight": false,
                "out_mode": "out",
                "bounce": false,
                "attract": {
                    "enable": false,
                    "rotateX": 600,
                    "rotateY": 1200
                }
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": {
                    "enable": true,
                    "mode": "repulse"
                },
                "onclick": {
                    "enable": true,
                    "mode": "push"
                },
                "resize": true
            },
            "modes": {
                "grab": {
                    "distance": 400,
                    "line_linked": {
                        "opacity": 1
                    }
                },
                "bubble": {
                    "distance": 400,
                    "size": 40,
                    "duration": 2,
                    "opacity": 8,
                    "speed": 3
                },
                "repulse": {
                    "distance": 200,
                    "duration": 0.4
                },
                "push": {
                    "particles_nb": 4
                },
                "remove": {
                    "particles_nb": 2
                }
            }
        },
        "retina_detect": true
    });

    const commandInput = document.getElementById('command-input');
    const executeBtn = document.getElementById('execute-btn');
    const listenBtn = document.getElementById('listen-btn');
    const status = document.getElementById('status');
    const responseContainer = document.getElementById('response-container');
    const timeElement = document.getElementById('time');
    const dateElement = document.getElementById('date');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    let listening = false;
    let conversationHistory = [];

    listenBtn.addEventListener('click', () => {
        if (listening) {
            recognition.stop();
            listening = false;
            listenBtn.textContent = 'Listen';
            status.textContent = '';
        } else {
            recognition.start();
            listening = true;
            listenBtn.textContent = 'Stop Listening';
            status.textContent = 'Listening...';
        }
    });

    recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        commandInput.value = command;
        executeCommand(command);
        listening = false;
        listenBtn.textContent = 'Listen';
        status.textContent = '';
    };

    recognition.onerror = (event) => {
        status.textContent = 'Error occurred in recognition: ' + event.error;
        listening = false;
        listenBtn.textContent = 'Listen';
    };

    executeBtn.addEventListener('click', () => {
        const command = commandInput.value.toLowerCase();
        commandInput.value = '';
        executeCommand(command);
    });

    commandInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            executeBtn.click();
        }
    });

    async function executeCommand(command) {
        let response = '';
        status.textContent = `Recognized: "${command}"`;
        conversationHistory.push({ role: "user", parts: [command] });

        if (command.startsWith('open')) {
            let url = command.substring(5);
            if (url) {
                if (!url.startsWith('http')) {
                    url = 'https://' + url;
                }
                window.open(url.trim(), '_blank');
                response = `Opening ${url}...`;
            } else {
                response = 'Please specify a website to open.';
            }
            responseContainer.textContent = response;
            speak(response);
            conversationHistory.push({ role: "model", parts: [response] });
        } else if (command.startsWith('search for')) {
            const query = command.substring(11);
            if (query) {
                window.open(`https://www.google.com/search?q=${encodeURIComponent(query.trim())}`, '_blank');
                response = `Searching for ${query}...`;
            } else {
                response = 'Please specify what to search for.';
            }
            responseContainer.textContent = response;
            speak(response);
            conversationHistory.push({ role: "model", parts: [response] });
        } else if (command.includes('time') || command.includes('date')) {
            response = new Date().toLocaleString();
            responseContainer.textContent = response;
            speak(response);
            conversationHistory.push({ role: "model", parts: [response] });
        } else if (command.includes('joke')) {
            fetch('https://official-joke-api.appspot.com/jokes/random')
                .then(response => response.json())
                .then(data => {
                    response = `${data.setup} ... ${data.punchline}`;
                    responseContainer.textContent = response;
                    speak(response);
                    conversationHistory.push({ role: "model", parts: [response] });
                });
        } else if (command.startsWith('wikipedia')) {
            const query = command.substring(10);
            if (query) {
                window.open(`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query.trim())}`, '_blank');
                response = `Searching Wikipedia for ${query}...`;
            } else {
                response = 'Please specify what to search for on Wikipedia.';
            }
            responseContainer.textContent = response;
            speak(response);
            conversationHistory.push({ role: "model", parts: [response] });
        } else if (command.startsWith('weather in')) {
            const city = command.substring(11);
            if (city) {
                responseContainer.textContent = `Getting the weather for ${city}...`;
                try {
                    const response = await fetch('/api/weather', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ city })
                    });
                    const data = await response.json();
                    if (data.main) {
                        const weather = `The weather in ${data.name} is ${data.weather[0].description} with a temperature of ${data.main.temp}°C.`;
                        responseContainer.textContent = weather;
                        speak(weather);
                        conversationHistory.push({ role: "model", parts: [weather] });
                    } else {
                        responseContainer.textContent = `Could not get the weather for ${city}.`;
                        speak(`Could not get the weather for ${city}.`);
                        conversationHistory.push({ role: "model", parts: [`Could not get the weather for ${city}.`] });
                    }
                } catch (error) {
                    console.error("Error with weather API:", error);
                    responseContainer.textContent = "Sorry, I'm having trouble getting the weather.";
                    speak(responseContainer.textContent);
                    conversationHistory.push({ role: "model", parts: ["Sorry, I'm having trouble getting the weather."] });
                }
            } else {
                response = 'Please specify a city to get the weather for.';
                responseContainer.textContent = response;
                speak(response);
                conversationHistory.push({ role: "model", parts: [response] });
            }
        } else if (command.startsWith('real time question')) {
            const query = command.substring(19);
            if (query) {
                responseContainer.textContent = `Searching for the answer to "${query}"...`;
                try {
                    const response = await fetch('/api/realtime', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ query })
                    });
                    const data = await response.json();
                    const text = data.text;
                    responseContainer.textContent = text;
                    speak(text);
                    conversationHistory.push({ role: "model", parts: [text] });
                } catch (error) {
                    console.error("Error with real-time API:", error);
                    responseContainer.textContent = "Sorry, I'm having trouble getting a real-time answer.";
                    speak(responseContainer.textContent);
                    conversationHistory.push({ role: "model", parts: ["Sorry, I'm having trouble getting a real-time answer."] });
                }
            } else {
                response = 'Please specify a real-time question.';
                responseContainer.textContent = response;
                speak(response);
                conversationHistory.push({ role: "model", parts: [response] });
            }
        } else if (command.startsWith('create a presentation about')) {
            const topic = command.substring(28);
            if (topic) {
                responseContainer.textContent = `Creating a presentation about "${topic}"...`;
                try {
                    const response = await fetch('/api/presentation', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ topic })
                    });
                    const data = await response.json();
                    responseContainer.textContent = data.message;
                    speak(data.message);
                    conversationHistory.push({ role: "model", parts: [data.message] });
                } catch (error) {
                    console.error("Error creating presentation:", error);
                    responseContainer.textContent = "Sorry, I'm having trouble creating the presentation.";
                    speak(responseContainer.textContent);
                    conversationHistory.push({ role: "model", parts: ["Sorry, I'm having trouble creating the presentation."] });
                }
            } else {
                response = 'Please specify a topic for the presentation.';
                responseContainer.textContent = response;
                speak(response);
                conversationHistory.push({ role: "model", parts: [response] });
            }
        } else {
            responseContainer.textContent = "Thinking...";
            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ command, history: conversationHistory })
                });
                const data = await response.json();
                const text = data.text;
                responseContainer.textContent = text;
                speak(text);
                conversationHistory.push({ role: "model", parts: [text] });
            } catch (error) {
                console.error("Error with backend API:", error);
                responseContainer.textContent = "Sorry, I'm having trouble connecting to the backend. Please check your server.";
                speak(responseContainer.textContent);
                conversationHistory.push({ role: "model", parts: ["Sorry, I'm having trouble connecting to the backend. Please check your server."] });
            }
        }
    }

    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
    }

    let suggestionMade = false;
    function updateDateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const dateString = now.toLocaleDateString();
        timeElement.textContent = timeString;
        dateElement.textContent = dateString;

        // Suggest a break at 3 PM
        if (now.getHours() === 15 && !suggestionMade) {
            const suggestion = "It's 3 PM, you usually take a break now. Shall I play your favorite playlist?";
            responseContainer.textContent = suggestion;
            speak(suggestion);
            suggestionMade = true;
        }
    }

    setInterval(updateDateTime, 1000);
    updateDateTime();

    speak("J.A.R.V.I.S is online.");
});