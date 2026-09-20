import axios from 'axios';

// This should be set using the secret key you receive from Google reCAPTCHA
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

interface ReCaptchaVerifyResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
}

/**
 * Verifies a reCAPTCHA token against the Google reCAPTCHA API
 * @param token The reCAPTCHA token from the client
 * @param expectedAction The expected action that was used to generate the token
 * @param minScore The minimum score required to consider the verification successful (0.0 to 1.0)
 * @returns {Promise<boolean>} Whether the verification was successful
 */
export async function verifyReCaptchaToken(token: string, expectedAction: string, minScore = 0.5): Promise<boolean> {
  try {
    // Make sure we have a token
    if (!token) {
      console.error('reCAPTCHA verification failed: No token provided');
      return false;
    }

    // Check if the secret key is available
    if (!RECAPTCHA_SECRET_KEY) {
      console.warn('reCAPTCHA verification skipped - secret key not configured');
      return true;
    }

    // Verify the token with Google's reCAPTCHA API
    const response = await axios.post<ReCaptchaVerifyResponse>(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: RECAPTCHA_SECRET_KEY,
          response: token
        }
      }
    );

    const { success, score, action, hostname } = response.data;

    if (!success) {
      console.error('reCAPTCHA verification failed:', response.data['error-codes']);
      return false;
    }

    // Log the score and check if it meets our threshold
    console.log(`reCAPTCHA score for ${action}: ${score} from ${hostname}`);

    // Verify that the action matches what we expect
    if (action !== expectedAction) {
      console.error(`reCAPTCHA action mismatch: Expected '${expectedAction}', got '${action}'`);
      return false;
    }

    // Check if the score meets our threshold
    return score >= minScore;
  } catch (error) {
    console.error('Error verifying reCAPTCHA token:', error);
    return false;
  }
}