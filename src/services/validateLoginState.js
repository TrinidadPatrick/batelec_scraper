import { sendMail } from "./sendMail.js"

const body = `<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5;">

                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                        
                        <div style="background-color: #fee2e2; border-bottom: 1px solid #f87171; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; color: #991b1b; font-size: 24px;">
                            Scraper Execution Failed
                        </h1>
                        </div>

                        <div style="padding: 30px 20px;">
                        <p style="margin: 0 0 15px 0; color: #3f3f46; font-size: 16px; line-height: 1.5;">
                            The automated scraping process was interrupted and could not complete its scheduled run.
                        </p>

                        <div style="background-color: #fafafa; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
                            <p style="margin: 0; color: #27272a; font-family: monospace; font-size: 14px;">
                            <strong style="color: #ef4444;">Error Reason:</strong><br><br>
                            Scraper is currently not logged in.
                            </p>
                        </div>

                        <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">
                            Please re-authenticate the session or check the environment variables to ensure the credentials are still valid.
                        </p>
                        </div>


                    </div>

              </body>`

const TYPE = process.env.TYPE //if UNAUTH instead of AUTH, disregard if scraper is loggedin or not
const PRIMARY_RECIPIENT = process.env.PRIMARY_RECIPIENT //if UNAUTH instead of AUTH, disregard if scraper is loggedin or not
const validateLoginState = async (page) => {
    if (!page) throw new Error("Invalid page parameter")

    if (TYPE !== 'AUTH' && TYPE !== 'UNAUTH') throw new Error('Invalid type provided')
    if (typeof PRIMARY_RECIPIENT !== 'string') throw new Error('Please provide a valid primary recipient on the env file')

    const emailInput = await page.locator('input[name=email]').first().isVisible()

    // Only throw error of not loggedin and type is AUTH
    if (emailInput && TYPE === 'AUTH') {
        sendMail(body, PRIMARY_RECIPIENT)
        throw new Error('Scrapper is currently not logged in')
    }
}

export default validateLoginState