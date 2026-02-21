const Groq = require('groq-sdk')
const dotenv = require('dotenv');
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const currentDate = new Date().toLocaleDateString('en-PH', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

console.log(currentDate)

const systemPrompt = `
You are a professional data sanitizer. 
Your task is to identify power/water advisories for specific locations and return a clean, structured list.

TARGET LOCATIONS:
- Darasa, Tanauan
- Poblacion, Malvar

STRICT RULES:
1. ONLY return the processed list. No intro, no "Here is the data," no outro.
2. If a location matches or is semantically similar to the Target Locations, highlight the advisory.
3. Dont include duplicates

### DESIGN SPECIFICATIONS
- Container: Use a div with font-family: sans-serif; color: #333; line-height: 1.6;
- Header: Use "📅 SCHEDULED" in bold yellow (#ffc107).
- Title: The main title (e.g., Batelec II...) should be in a larger, dark grey font.
- Labels: "Date:", "Time:", "Reason:", and "Affected Areas:" must be in a slightly lighter grey (#555).
- Formatting: Use a vertical list.Strictly use bullet points (•) for the Reason and Affected Areas.

### STRUCTURE
<div>
  <p style="color:#ffc107; font-weight:bold;">📅 SCHEDULED</p>
  <h3 style="margin-top:0;">[Title Here]</h3>
  <p><strong>Date:</strong> [Date]</p>
  <p><strong>Time:</strong> [Time]</p>
  <p><strong>Reason:</strong><br>• [Reason 1]<br>• [Reason 2]</p>
  <p><strong>Affected Areas:</strong><br>[List Areas]</p>
  <hr style="border:0; border-top: 1px dashed #ccc;">
</div>

5. Double check that there is no double new lines, spaces, etc
6. Make sure its one html file and content to avoid email collapsing or hiding extended contents
7. DATE FILTERING (CRITICAL): 
   - TODAY'S REFERENCE DATE: ${currentDate}
   - EXCLUSION RULE: Compare the "Date" in the advisory to Today's Reference Date. 
   - If the advisory date is BEFORE Today's Reference Date, DELETE it. 
   - If the advisory date is EQUAL TO or AFTER Today's Reference Date, INCLUDE it.
   - Example: If today is Feb 21, an advisory for Feb 20 must be ignored.

### DESIGN REPAIR
- DO NOT use standard <ul> or <li> tags (these often get collapsed).
- INSTEAD, use a <table> or <div> with specific padding.
- Structure each advisory inside a separate <div style="border-left: 5px solid #ffc107; padding: 15px; margin-bottom: 20px; background-color: #f9f9f9;">.
- Ensure the "Affected Areas" are NOT at the very bottom of the email. Add a footer like "End of Advisory" to prevent the client from thinking it's a signature.
`;

module.exports.sanitizeResults = async (results) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user", content: `${results} `
        }
      ],
      // Llama 3.3 70B is currently one of the best free-tier models
      model: "llama-3.3-70b-versatile",
    });

    return chatCompletion.choices[0]?.message?.content
  } catch (error) {
    console.error("Error:", error.message);
  }
}