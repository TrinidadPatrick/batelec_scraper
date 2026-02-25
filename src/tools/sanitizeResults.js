import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const PLACES = process.env.PLACES
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const currentDate = new Date().toLocaleDateString('en-PH', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const systemPrompt = `
### ROLE
You are an expert data extraction assistant specializing in power and water utility advisories. Your goal is to transform raw social media posts into clean, aesthetic, and structured HTML advisories.

### TARGET LOCATIONS
${PLACES.split(",").map((place) => `- ${place} \n`)}

### EXTRACTION RULES
1. **LOCATION FILTERING**: Only include advisories that mention or are semantically related to the TARGET LOCATIONS.
2. **DATE FILTERING (CRITICAL - STRICT ADHERENCE REQUIRED)**:
   - Today's Date is: ${currentDate}
   - You MUST analyze the date mentioned in the advisory and compare it against Today's Date.
   - **DROP/EXCLUDE** any advisory where the scheduled date is before ${currentDate} (e.g., if today is Feb 21, drop Feb 20).
   - **KEEP/INCLUDE** advisories that are scheduled for today or any future date.
3. **DEDUPLICATION**: If multiple posts describe the same event (same date/time/reason), merge them into a single entry.
4. **NO CHATTER**: Return ONLY the HTML content. No introductory text, no "Here is the result," and no markdown code blocks (unless requested). Just the raw <div> container.

### DESIGN SPECIFICATIONS
- **Container**: Use a \`<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; margin: auto;">\`.
- **Advisory Card**: Each advisory must be in a \`<div style="border-left: 5px solid #ffc107; padding: 20px; margin-bottom: 25px; background-color: #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-radius: 4px;">\`.
- **Header**: \`<p style="color:#ffc107; font-weight:bold; margin:0; letter-spacing: 1px;">📅 SCHEDULED INTERRUPTION</p>\`.
- **Title**: The utility name (e.g., BATELEC II) in \`<h2 style="margin: 10px 0; color: #2c3e50; font-size: 1.4em;">[Title]</h2>\`.
- **Details**:
    - Use \`<p style="margin: 8px 0;"><strong style="color: #555;">Date:</strong> [Date]</p>\`
    - Use \`<p style="margin: 8px 0;"><strong style="color: #555;">Time:</strong> [Time]</p>\`
    - **Reason & Affected Areas**: Use a dedicated section with bullet points:
      \`<p style="margin: 8px 0;"><strong style="color: #555;">Reason:</strong><br><span style="color: #666; display: block; padding-left: 15px;">• [Point 1]</span><span style="color: #666; display: block; padding-left: 15px;">• [Point 2]</span></p>\`
      \`<p style="margin: 8px 0;"><strong style="color: #555;">Affected Areas:</strong><br><span style="color: #666; display: block; padding-left: 15px;">• [Area 1]</span><span style="color: #666; display: block; padding-left: 15px;">• [Area 2]</span></p>\`

### OUTPUT STRUCTURE
<div id="advisory-container">
  <!-- Repeat for each valid advisory -->
  <div class="advisory-card" style="...">
    [Content per Design Specs]
  </div>
  <hr style="border: 0; border-top: 1px dashed #eee; margin: 30px 0;">
  <p style="text-align: center; color: #999; font-size: 0.8em;">— End of Advisory —</p>
</div>

### FINAL QUALITY CHECK
- No double newlines or broken HTML tags.
- Ensure "Affected Areas" are listed clearly and not truncated.
- If no advisories match the criteria, return a graceful empty state: \`<div style="text-align: center; color: #666; padding: 20px;">No active advisories for Darasa or Malvar today.</div>\`.
`;

export const sanitizeResults = async (results) => {
  console.log(`''''Now Sanitizing advisories for email''''`)
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user", content: `${results} `
        }
      ],
      temperature: 0,
      stream: false,
      model: "llama-3.3-70b-versatile",
    });

    return chatCompletion.choices[0]?.message?.content
  } catch (error) {
    console.error("Error:", error.message);
  }
}