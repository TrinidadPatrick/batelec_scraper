import fs from 'fs'
export const isStateValid = () => {
    try {

        if (fs.existsSync('state.json')) {
            const data = fs.readFileSync('state.json', 'utf8');
            JSON.parse(data);
            return true;
        }
    } catch (error) {
        console.warn("Invalid or corrupt state.json found. Proceeding without it.");
    }
    return false;
}