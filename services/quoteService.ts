
import { OFFLINE_QUOTES } from '../src/constants/quotes';

export const generateMorningGreeting = async (label: string): Promise<string> => {
  try {
    // Pick a random quote from the local list for offline support
    const randomIndex = Math.floor(Math.random() * OFFLINE_QUOTES.length);
    const quote = OFFLINE_QUOTES[randomIndex];
    
    return quote;
  } catch (error) {
    console.error("Error picking quote:", error);
    return "Bom dia! Hora de começar o dia com energia.";
  }
};
