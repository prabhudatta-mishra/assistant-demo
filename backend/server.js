const http = require('http');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const https = require('https');
const googleIt = require('google-it');
const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

// IMPORTANT: Load your API keys from environment variables or other secure sources
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer(async (req, res) => {
    if (req.url === '/api/generate' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const { command, history } = JSON.parse(body);
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });

                const chat = model.startChat({
                    history: history || [],
                });

                const result = await chat.sendMessage(command);
                const response = await result.response;
                const text = response.text();

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ text }));
            } catch (error) {
                console.error("Error with Gemini API:", error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Error generating content' }));
            }
        });
    } else if (req.url === '/api/weather' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const { city } = JSON.parse(body);
                const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`;

                https.get(url, (weatherRes) => {
                    let data = '';
                    weatherRes.on('data', (chunk) => {
                        data += chunk;
                    });
                    weatherRes.on('end', () => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(data);
                    });
                }).on('error', (err) => {
                    console.error("Error with Weather API:", err);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Error getting weather' }));
                });
            } catch (error) {
                console.error("Error parsing weather request:", error);
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Bad request' }));
            }
        });
    } else if (req.url === '/api/realtime' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const { query } = JSON.parse(body);
                const searchResults = await googleIt({ query });

                const snippets = searchResults.slice(0, 5).map(result => result.snippet).join('\n');

                const prompt = `Based on the following search results, answer the question: "${query}"

Search results:
${snippets}`;

                const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ text }));

            } catch (error) {
                console.error("Error with real-time search:", error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Error with real-time search' }));
            }
        });
    } else if (req.url === '/api/presentation' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const { topic } = JSON.parse(body);

                // Generate presentation content with Gemini
                const prompt = `Create a 5-slide presentation about "${topic}". For each slide, provide a title and 3-4 bullet points. Format the output as JSON.`;
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const presentationContent = JSON.parse(response.text());

                // Create a new presentation
                let pres = new pptxgen();

                // Add slides
                for (const slideData of presentationContent.slides) {
                    let slide = pres.addSlide();
                    slide.addText(slideData.title, { x: 0.5, y: 0.25, fontSize: 36, bold: true });
                    slide.addText(slideData.points.join('\n'), { x: 0.5, y: 1.5, fontSize: 18 });
                }

                // Save the presentation
                const presentationsDir = path.join(__dirname, 'presentations');
                if (!fs.existsSync(presentationsDir)) {
                    fs.mkdirSync(presentationsDir);
                }
                const filePath = path.join(presentationsDir, `${topic.replace(/\s+/g, '_')}_presentation.pptx`);
                await pres.writeFile({ fileName: filePath });

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ message: `Presentation created successfully at ${filePath}` }));

            } catch (error) {
                console.error("Error creating presentation:", error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Error creating presentation' }));
            }
        });
    } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Not Found');
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});