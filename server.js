require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ Gemini API Key is missing! Add it to your .env file.");
    process.exit(1);
}

app.post("/generate-title", async (req, res) => {
    const { topic } = req.body;

    if (!topic) {
        return res.status(400).json({ error: "Topic is required" });
    }

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: `Generate 5 unique capstone project titles based on this topic: "${topic}". 
                                Provide 5 ideas for mobile applications and 5 ideas for web applications separately. 
                                Format the response as JSON:
                                {
                                    "mobileTitles": [
                                        {"title": "Title1", "description": "Brief description"},
                                        {"title": "Title2", "description": "Brief description"}
                                    ],
                                    "webTitles": [
                                        {"title": "Title1", "description": "Brief description"},
                                        {"title": "Title2", "description": "Brief description"}
                                    ]
                                }`
                            }
                        ]
                    }
                ]
            },
            { headers: { "Content-Type": "application/json" } }
        );

        // Extract API response
        let outputText = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!outputText) {
            throw new Error("Invalid API response structure.");
        }

        console.log("🔍 API Raw Response:", outputText);

        // ✅ Remove Markdown-style formatting (```json and ```)
        outputText = outputText.replace(/```json|```/g, "").trim();

        // Parse response JSON
        let outputData;
        try {
            outputData = JSON.parse(outputText);
        } catch (parseError) {
            console.error("❌ JSON Parsing Error:", parseError.message);
            throw new Error("AI response was not valid JSON.");
        }

        if (!outputData.mobileTitles || !outputData.webTitles) {
            throw new Error("Invalid response format.");
        }

        res.json(outputData);
    } catch (error) {
        console.error("❌ Gemini API Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to generate titles. Try again later." });
    }
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
