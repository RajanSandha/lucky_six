import { config } from 'dotenv';
config();

import '@/ai/flows/detect-fraudulent-user.ts';
import '@/ai/flows/summarize-user-feedback.ts';