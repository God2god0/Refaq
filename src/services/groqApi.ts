// Groq API service for enhanced AI responses
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// Debug API Key - Reduced logging
console.log('🔑 Groq API Key configured:', GROQ_API_KEY ? 'YES' : 'NO');
// Test API connection on load
export const testGroqConnection = async (): Promise<boolean> => {
  if (!GROQ_API_KEY) {
    console.log('🧪 Groq API test skipped - no API key provided');
    return false;
  }
  
  try {
    console.log('🧪 Testing Groq API connection...');
    const response = await fetch('https://api.x.ai/v1/models', {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🧪 Test response status:', response.status);
    if (response.ok) {
      console.log('✅ Groq API connection successful!');
      return true;
    } else {
      console.error('❌ Groq API test failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Groq API test error:', error);
    return false;
  }
};

// User rate limiting configuration - DISABLED FOR TESTING
const DAILY_QUESTION_LIMIT = 999999; // Temporarily disabled for testing
const HOURLY_QUESTION_LIMIT = 999999; // Temporarily disabled for testing

const GROQ_API_URL = 'https://api.x.ai/v1/chat/completions';

// System prompt to keep AI focused on Re Protocol
const SYSTEM_PROMPT = `Final System Prompt: Re Protocol Helper

RULES:
Only answer about Re Protocol.
Keep answers short, clear, and simple (but not too short).
If question is off-topic (e.g. "how are you?", "how can I get whitelist?", "what's your name?") → reply: "I only help with Re Protocol questions."
Share links only if user asks for "more details," "documentation," "how to," or "getting started."
General info: https://re.xyz/
Technical docs: https://docs.re.xyz/
Always explain in very simple words, like teaching a child.

CALCULATOR FEATURES:
Can calculate yields, returns, and projections for reUSD and reUSDe.
reUSD (Basis-Plus): 6–9%+ APY (ETH basis trade + T-bills + extra spread)
reUSDe (Insurance Alpha): 16–25% APY (insurance yield strategy)
Can explain deposits, APY estimates, risk, and strategy comparisons.

KEY POINTS (from docs.re.xyz):
Re Protocol uses reinsurance contracts to generate yield from staked capital.
Users can deposit stablecoins (USDC, DAI, USDe, sUSDe) into Insurance Capital Layers (ICLs).
reUSD vs reUSDe:
reUSD = lower risk, 6–9%+ APY, delta-neutral ETH + T-bills.
reUSDe = higher risk/return, 16–25% APY, insurance premium income.
Deposit flow: connect wallet → pass KYC/AML → choose strategy (reUSD or reUSDe) → deposit → receive tokens.
Yields:
reUSD: from ETH basis trade + T-bills.
reUSDe: from insurance underwriting premiums.
Risk: all ICLs are fully collateralized, with transparent on-chain reporting.
Withdrawals:
reUSD: via liquidity pools or quarterly redemption windows.
reUSDe: quarterly redemption windows.
Token NAV is updated daily at 00:00 UTC.
If tokens don't appear in wallet, add the contract address manually.

EXAMPLE QUESTIONS:
"Calculate my yield for $1000 in reUSDe"
"What's the difference between reUSD and reUSDe returns?"
"How does withdrawal work for reUSD?"`;

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface UserLimits {
  dailyCount: number;
  hourlyCount: number;
  lastResetDate: string;
  lastResetHour: number;
}

// Get user limits from localStorage
export const getUserLimits = (): UserLimits => {
  const stored = localStorage.getItem('reFAQ_user_limits');
  if (stored) {
    return JSON.parse(stored);
  }
  
  const now = new Date();
  return {
    dailyCount: 0,
    hourlyCount: 0,
    lastResetDate: now.toDateString(),
    lastResetHour: now.getHours()
  };
};

// Save user limits to localStorage
export const saveUserLimits = (limits: UserLimits): void => {
  localStorage.setItem('reFAQ_user_limits', JSON.stringify(limits));
};

// Check if user can ask more questions
export const canUserAskQuestion = (): { canAsk: boolean; message?: string; remainingDaily?: number; remainingHourly?: number } => {
  const now = new Date();
  const limits = getUserLimits();
  
  // Reset daily count if new day
  if (limits.lastResetDate !== now.toDateString()) {
    limits.dailyCount = 0;
    limits.lastResetDate = now.toDateString();
  }
  
  // Reset hourly count if new hour
  if (limits.lastResetHour !== now.getHours()) {
    limits.hourlyCount = 0;
    limits.lastResetHour = now.getHours();
  }
  
  // Check daily limit
  if (limits.dailyCount >= DAILY_QUESTION_LIMIT) {
    return {
      canAsk: false,
      message: `You've reached your daily limit of ${DAILY_QUESTION_LIMIT} questions. Please come back tomorrow to continue asking questions about Re Protocol!`,
      remainingDaily: 0,
      remainingHourly: HOURLY_QUESTION_LIMIT - limits.hourlyCount
    };
  }
  
  // Check hourly limit
  if (limits.hourlyCount >= HOURLY_QUESTION_LIMIT) {
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    return {
      canAsk: false,
      message: `You've reached your hourly limit of ${HOURLY_QUESTION_LIMIT} questions. Please wait until ${nextHour.getHours()}:00 to ask more questions.`,
      remainingDaily: DAILY_QUESTION_LIMIT - limits.dailyCount,
      remainingHourly: 0
    };
  }
  
  return {
    canAsk: true,
    remainingDaily: DAILY_QUESTION_LIMIT - limits.dailyCount,
    remainingHourly: HOURLY_QUESTION_LIMIT - limits.hourlyCount
  };
};

// Increment user question count
export const incrementUserQuestionCount = (): void => {
  const limits = getUserLimits();
  limits.dailyCount++;
  limits.hourlyCount++;
  saveUserLimits(limits);
};

export const callGroqAPI = async (userMessage: string): Promise<string> => {
  if (!GROQ_API_KEY) {
    console.log('🚫 Groq API key not provided - using local responses');
    throw new Error('Groq API key not configured');
  }
  
  try {
    console.log('🚀 Calling Groq API...');
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3-mini', // X.AI model
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 150, // Çok kısa cevaplar için
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data: GroqResponse = await response.json();
    console.log('📥 Groq API Response:', data);
    
    if (data.choices && data.choices.length > 0) {
      const aiResponse = data.choices[0].message.content;
      console.log('✅ AI Response:', aiResponse);
      return aiResponse;
    } else {
      console.error('❌ No choices in response:', data);
      throw new Error('No response from Groq API');
    }
  } catch (error) {
    console.error('Groq API Error:', error);
    throw error;
  }
};

// Fallback function for when Groq API is not available
export const getFallbackResponse = (question: string): string => {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('re protocol') || lowerQuestion.includes('what is')) {
    return "I'm a Re Protocol expert! I can help you with questions about reUSD, reUSDe, yield calculations, security, and getting started. What would you like to know?";
  }
  
  if (lowerQuestion.includes('reusd') || lowerQuestion.includes('reusde')) {
    return "reUSD (Basis-Plus) offers 6-10% APY with principal protection, while reUSDe (Insurance Alpha) offers 15-23% APY with higher risk. Which strategy interests you?";
  }
  
  if (lowerQuestion.includes('yield') || lowerQuestion.includes('apy')) {
    return "reUSDe offers 15-23% APY from reinsurance premiums, while reUSD offers 6-10% APY from delta-neutral strategies. Would you like a detailed calculation?";
  }
  
  return "I'm here to help with Re Protocol questions! Ask me about token strategies, yields, security, or getting started.";
};
