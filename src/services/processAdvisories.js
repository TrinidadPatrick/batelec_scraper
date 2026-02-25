import { createClient } from "@supabase/supabase-js";
import crypto from 'crypto'

const generateAdvisoryId = (text) => {
  return crypto.createHash('md5').update(text).digest('hex');
}

const deleteOldAdvisories = async (supabase) => {
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  const { error } = await supabase
    .from('power_advisories')
    .delete()
    .lt('created_at', tenDaysAgo.toISOString());

  if (error) console.error("Error cleaning up old data:", error);
  else console.log("Successfully cleaned up advisories older than 10 days");
};

const processAdvisories = async (scrapedAdvisories) => {
  console.log(`''''Now Processing advisories''''`)
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('No supabase credentials included, skipping tracking')
    return scrapedAdvisories
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  if (scrapedAdvisories && scrapedAdvisories.length > 0) {
    const results = await Promise.all(scrapedAdvisories.map(async (advisory) => {
      const id = generateAdvisoryId(advisory)

      const { data, error } = await supabase.from('power_advisories')
        .upsert(
          { id: id, content: advisory },
          { onConflict: 'id', ignoreDuplicates: true }
        ).select()

      if (error) {
        console.error(`Error processing advisory ${id}:`, error.message);
        return null;
      }

      if (data && data.length > 0) {
        console.log(`New advisory detected: ${id}`);
        return advisory;
      } else {
        console.log(`Duplicate skipped: ${id}`);
        return null;
      }
    }))
    await deleteOldAdvisories(supabase)
    return results.filter((res) => res !== null)
  }

}

export default processAdvisories