import React, { useState, useRef, useEffect } from 'react';
import { callGroqAPI, canUserAskQuestion, testGroqConnection } from '../services/groqApi';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  
  const [userLimits, setUserLimits] = useState<{ remainingDaily: number; remainingHourly: number }>({ remainingDaily: 15, remainingHourly: 5 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Type out message word by word with smooth fade
  const typeOutMessage = (text: string, messageId: number) => {
    const words = text.split(' ');
    let currentText = '';
    let wordIndex = 0;

    const typeNextWord = () => {
      if (wordIndex < words.length) {
        currentText += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, text: currentText } : msg
        ));
        wordIndex++;
        // Faster typing: 50ms delay for smooth but quick effect
        setTimeout(typeNextWord, 50);
      }
    };

    typeNextWord();
  };

  // Update user limits display and test API connection
  useEffect(() => {
    // Prevent browser extension errors from breaking our app
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.filename && event.filename.includes('solanaActionsContentScript')) {
        console.log('🚫 Blocked browser extension error:', event.error);
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.toString().includes('solanaActionsContentScript')) {
        console.log('🚫 Blocked browser extension promise rejection:', event.reason);
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    const updateLimits = () => {
      try {
        const limitCheck = canUserAskQuestion();
        setUserLimits({
          remainingDaily: limitCheck.remainingDaily || 0,
          remainingHourly: limitCheck.remainingHourly || 0
        });
      } catch (error) {
        console.error('❌ Error updating limits:', error);
      }
    };
    
    updateLimits();
    
            // Test Groq API connection on component mount
            testGroqConnection().catch(error => {
              console.error('❌ API test error:', error);
            });
    
    // Update every minute
    const interval = setInterval(updateLimits, 60000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    console.log('🚀 Form submitted with:', inputValue);
    console.log('🚀 hasStartedChat before:', hasStartedChat);

            try {
              // Rate limiting DISABLED for testing
              // const initialLimitCheck = canUserAskQuestion();
              // if (!initialLimitCheck.canAsk) {
              //   const limitMessage: Message = {
              //     id: Date.now(),
              //     text: `⚠️ **Rate Limit Reached**\n\n${initialLimitCheck.message}\n\n**Your Usage:**\n• Daily: ${initialLimitCheck.remainingDaily || 0} questions remaining\n• Hourly: ${initialLimitCheck.remainingHourly || 0} questions remaining\n\nPlease try again later!`,
              //     isUser: false,
              //     timestamp: new Date()
              //   };
              //   setMessages(prev => [...prev, limitMessage]);
              //   setInputValue('');
              //   return;
              // }

      setHasStartedChat(true); // Mark that chat has started
      console.log('🚀 setHasStartedChat(true) called');

      const userMessage: Message = {
        id: Date.now(),
        text: inputValue,
        isUser: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsLoading(true);

              // Rate limiting DISABLED for testing
              // incrementUserQuestionCount();
              // 
              // // Update limits display
              // const updatedLimitCheck = canUserAskQuestion();
              // setUserLimits({
              //   remainingDaily: updatedLimitCheck.remainingDaily || 0,
              //   remainingHourly: updatedLimitCheck.remainingHourly || 0
              // });

              // Get AI response from Groq API or fallback
              try {
                console.log('🤖 Attempting to get AI response for:', inputValue);
                const aiResponseText = await callGroqAPI(inputValue);
                console.log('✅ Got AI response:', aiResponseText);
                
                // Add message with empty text first
                const aiResponse: Message = {
                  id: Date.now() + 1,
                  text: '',
                  isUser: false,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, aiResponse]);
                
                // Type out the response word by word
                typeOutMessage(aiResponseText, Date.now() + 1);
              } catch (error) {
                console.log('🔄 Using local response (Groq API not available)');
        
        // Fallback to local response
        const fallbackText = generateAIResponse(inputValue);
        const fallbackResponse: Message = {
          id: Date.now() + 1,
          text: '',
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, fallbackResponse]);
        
        // Type out the fallback response word by word
        typeOutMessage(fallbackText, Date.now() + 1);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Form submission error:', error);
      setIsLoading(false);
    }
  };

          const generateAIResponse = (question: string): string => {
            const lowerQuestion = question.toLowerCase();
            
            // Check if question is in English (basic check)
            const englishWords = ['what', 'how', 'when', 'where', 'why', 'which', 'who', 're', 'protocol', 'yield', 'apy', 'token', 'usd', 'usde', 'deposit', 'withdraw', 'security', 'risk', 'kyc', 'eligibility', 'points', 'address', 'contract'];
            const hasEnglishWords = englishWords.some(word => lowerQuestion.includes(word));
            
            // If no English words detected, ask for English
            if (!hasEnglishWords && question.length > 3) {
              return "Please ask your question in English only. I can only respond in English.";
            }

            // General Protocol Information
            if (lowerQuestion.includes('re protocol nedir') || lowerQuestion.includes('what is re protocol') || lowerQuestion.includes('protocol overview')) {
              return "The Re Protocol is a decentralized platform that bridges traditional insurance markets and DeFi. It allows users to deposit stablecoins (USDC, DAI, USDe, sUSDe) into Insurance Capital Layers (ICL) which allocate capital to fully-collateralized quota-share reinsurance contracts through licensed insurers. The protocol offers two main strategies: reUSD (Basis-Plus) for low-volatility yields and reUSDe (Insurance Alpha) for high underwriting yields. All operations are transparent with on-chain reporting and daily NAV updates.";
            }

    // Token Comparison
    if (lowerQuestion.includes('reusde vs reusd') || lowerQuestion.includes('difference between reusde and reusd') || lowerQuestion.includes('token comparison')) {
      return "**reUSDe (Insurance Alpha):**\n• Accepted Collateral: USDe, sUSDe\n• Strategy: Insurance underwriting yields (16%-25% APY)\n• Risk: First loss position, absorbs portfolio deficits\n• Ideal for: Ethena community wanting high yield via reinsurance\n\n**reUSD (Basis-Plus):**\n• Accepted Collateral: USDC, DAI, USDe/sUSDe\n• Strategy: Delta-neutral ETH basis + T-bills + 250bps spread (6%-9%+ APY)\n• Risk: Principal protected, senior position\n• Ideal for: Stablecoin holders seeking steady income without underwriting exposure";
    }

    // Yield Calculations & Calculator Features
    if (lowerQuestion.includes('calculate') || lowerQuestion.includes('how much') || lowerQuestion.includes('earn') || lowerQuestion.includes('yield') || lowerQuestion.includes('return') || lowerQuestion.includes('apy') || lowerQuestion.includes('calculator') || lowerQuestion.includes('projection') || lowerQuestion.includes('estimate')) {
      return calculateYieldFromQuestion(question);
    }

    // Risk Management & Security
    if (lowerQuestion.includes('risk management') || lowerQuestion.includes('safe') || lowerQuestion.includes('security') || lowerQuestion.includes('audit')) {
      return "**Security & Risk Management:**\n• All ICLs participate in fully collateralized quota-share reinsurance notes backed by licensed insurance companies\n• All collateral is on-chain and held in trust accounts with daily Fireblocks sweeps\n• Multi-signature wallets for critical operations\n• Regular third-party audits (Hacken, Certora)\n• Emergency pause mechanisms and recovery wallets\n• KYC/AML verification mandatory for all participants\n• Real-time on-chain reporting via Chainlink oracles";
    }

    // Eligibility & KYC
    if (lowerQuestion.includes('eligible') || lowerQuestion.includes('who can participate') || lowerQuestion.includes('kyc') || lowerQuestion.includes('restricted')) {
      return "**Eligibility Requirements:**\n• Global access excluding U.S. and restricted jurisdictions\n• Restricted countries: U.S., Iran, North Korea, Syria, Russia, Belarus, Cuba\n• KYC/AML verification is mandatory for all participants\n• If KYC fails: funds remain in escrow, contact support@re.xyz\n• Support typically responds within 2-3 business days";
    }

    // Redemption & Liquidity
    if (lowerQuestion.includes('redemption') || lowerQuestion.includes('withdraw') || lowerQuestion.includes('liquidity') || lowerQuestion.includes('exit')) {
      return "**Redemption Process:**\n\n**reUSD:**\n• Instant redemptions from protocol buffer until exhausted\n• Falls back to quarterly windows when buffer depleted\n• Curve Finance liquidity pools available\n\n**reUSDe:**\n• Quarterly redemption windows only\n• Pro-rata fulfillment based on available surplus\n• No instant redemption buffer\n\n**Liquidity Sources:**\n• On-chain idle balances\n• Actuarially released surplus from maturing treaties\n• Curve Finance pools (reUSD/USDC, reUSDe/sUSDe)";
    }

    // Token Addresses
    if (lowerQuestion.includes('token address') || lowerQuestion.includes('contract') || lowerQuestion.includes('address')) {
      return "**Smart Contract Addresses:**\n\n**reUSD:**\n• Ethereum: 0x5086bf358635B81D8C47C66d1C8b9E567Db70c72\n• Avalanche: 0x180aF87b47Bf272B2df59dccf2D76a6eaFa625Bf\n• Arbitrum: 0x76cE01F0Ef25AA66cC5F1E546a005e4A63B25609\n• Base: 0x7D214438D0F27AfCcC23B3d1e1a53906aCE5CFEa\n\n**reUSDe:**\n• Ethereum: 0xdDC0f880ff6e4e22E4B74632fBb43Ce4DF6cCC5a\n\n**ICL Addresses:**\n• Ethereum ICL: 0x4691C475bE804Fa85f91c2D6D0aDf03114de3093\n• Avalanche ICL: 0xb22a8533e6cd81598f82514a42F0B3161745fbe1\n• Arbitrum ICL: 0x802eDbB1Ec20548A4388ABC337E4011718eb0291";
    }

            // Getting Started
            if (lowerQuestion.includes('deposit') || lowerQuestion.includes('how to start') || lowerQuestion.includes('getting started') || lowerQuestion.includes('begin')) {
              return "**Getting Started with Re Protocol:**\n\n1. **Visit Platform:** Go to app.re.xyz\n2. **Connect Wallet:** Use MetaMask or compatible wallet\n3. **Complete KYC:** Submit required documentation\n4. **Choose Strategy:** Select reUSDe (Insurance Alpha) or reUSD (Basis-Plus)\n5. **Deposit Assets:** Stake approved tokens (USDC, DAI, USDe, sUSDe)\n6. **Receive Tokens:** Get corresponding reUSD or reUSDe tokens\n7. **Monitor Performance:** Track yields and portfolio via dashboard\n\n**Accepted Tokens:**\n• Traditional stablecoins: USDC, DAI, AUSD\n• Ethena tokens: USDe, sUSDe\n\nFor detailed information, check https://docs.re.xyz/";
            }

    // Price & NAV Updates
    if (lowerQuestion.includes('price') || lowerQuestion.includes('nav') || lowerQuestion.includes('valuation')) {
      return "**Token Price & NAV Updates:**\n\n• **Update Frequency:** Daily at UTC 00:00\n• **reUSD Pricing:** Tracks higher of (7-day avg SOFR + 250bps) or (Ethena basis yield + 250bps)\n• **reUSDe Pricing:** Compounds daily toward quarterly Target NAV (tNAV)\n• **Price Feed:** JSON feed pushed on-chain via Chainlink\n• **Current Prices:** Check api.re.xyz/apy/get-apy\n• **Transparency:** All calculations and updates are publicly verifiable on-chain";
    }

    // Points System
    if (lowerQuestion.includes('points') || lowerQuestion.includes('re points') || lowerQuestion.includes('rewards')) {
      return "**Re Points System:**\n\n**Daily Point Accrual:**\n• reUSD: 5x multiplier\n• reUSDe: 5x multiplier\n• Pendle LP (reUSD|reUSDe): 12x multiplier\n• Pendle YT (reUSD|reUSDe): 6.5x multiplier\n• Curve LP pools: 20x multiplier\n• Morpho borrowing: Continue earning 5x on collateral\n\n**Example:** 10,000 reUSD tokens = 50,000 points per day\n\n**Requirements:**\n• Must hold Re assets to accrue points\n• Accrual stops when assets leave wallet\n• KYC compliance required\n• Points are retained even if you exit and return later";
    }

    // Accepted Tokens
    if (lowerQuestion.includes('accepted tokens') || lowerQuestion.includes('what tokens') || lowerQuestion.includes('deposit tokens')) {
      return "**Accepted Tokens for Deposit:**\n\n**Traditional Stablecoins:**\n• USDC\n• DAI\n• AUSD\n• Others (check app for latest list)\n\n**Ethena Tokens:**\n• USDe\n• sUSDe\n\n**Token Selection:**\n• reUSDe (Insurance Alpha): Accepts USDe, sUSDe\n• reUSD (Basis-Plus): Accepts USDC, DAI, USDe/sUSDe\n\n**Check Latest:** Visit app.re.xyz/reusd or app.re.xyz/reusde for most up-to-date accepted assets";
    }

    // How It Works
    if (lowerQuestion.includes('how it works') || lowerQuestion.includes('mechanism') || lowerQuestion.includes('process')) {
      return "**How Re Protocol Works:**\n\n1. **Capital Staking:** Users deposit stablecoins into ICL smart contracts\n2. **Token Minting:** Receive reUSD (principal protected) or reUSDe (profit sharing)\n3. **Daily Sweeps:** Idle funds move to Fireblocks vaults for secure custody\n4. **Surplus Notes:** Capital deployed to licensed reinsurers via legally binding agreements\n5. **Trust Accounts:** Funds held in §114 Trust accounts providing regulatory collateral\n6. **Yield Generation:** Earn from reinsurance premiums or delta-neutral strategies\n7. **Transparency:** All operations recorded on-chain with real-time reporting\n8. **Redemptions:** Instant (reUSD) or quarterly (reUSDe) based on available liquidity";
    }

    // Reinsurance Basics
    if (lowerQuestion.includes('reinsurance') || lowerQuestion.includes('insurance') || lowerQuestion.includes('what is reinsurance')) {
      return "**What is Reinsurance?**\n\nReinsurance is 'insurance for insurance companies' - a mechanism where insurance companies transfer part of their risk portfolio to reinsurers. This allows insurers to:\n\n• **Diversify Risk:** Reduce exposure to concentrated risks like natural disasters\n• **Enhance Capital Efficiency:** Free up capital to underwrite more policies\n• **Stabilize Loss Ratios:** Reinsurers absorb extraordinary losses\n\n**Re Protocol Focus:**\n• Non-catastrophic, low-volatility, short-duration programs\n• Auto insurance, commercial liability, property insurance\n• Collateral typically released after 18 months\n• Steady, predictable returns from insurance premiums";
    }

    // Support & Contact
    if (lowerQuestion.includes('support') || lowerQuestion.includes('contact') || lowerQuestion.includes('help') || lowerQuestion.includes('kyc fail')) {
      return "**Support & Contact Information:**\n\n**General Support:**\n• Email: support@re.xyz\n• Website: re.xyz\n• Telegram: t.me/re_protocol\n• Discord: discord.gg/tP2qDjzE\n• Twitter: @re\n• LinkedIn: linkedin.com/company/re-protocol\n\n**KYC Issues:**\n• If KYC fails: funds remain in escrow\n• Contact: staking@re.xyz\n• Response time: 2-3 business days\n• Can request refund if KYC cannot be completed\n\n**Emergency:**\n• Recovery wallet: 0xDf6bF2713b5c7CA724E684657280bC407938F447";
    }

            // Check if question is about other topics
            const otherTopics = ['bitcoin', 'ethereum', 'crypto', 'defi', 'nft', 'trading', 'price', 'market', 'coin', 'altcoin', 'binance', 'coinbase', 'metamask', 'wallet', 'personal', 'life', 'weather', 'news', 'sports', 'music', 'movie', 'game'];
            const isOtherTopic = otherTopics.some(topic => lowerQuestion.includes(topic));
            
            if (isOtherTopic) {
              return "I can only help with Re Protocol questions. Please ask about reUSD, reUSDe, yields, security, or getting started with Re Protocol.";
            }
            
            return "I'm here to help with Re Protocol questions and calculations! Ask me about:\n\n• Token strategies (reUSD vs reUSDe)\n• Yield calculations and APY\n• Risk management and security\n• Getting started and deposits\n• Redemption processes\n• Token addresses and contracts\n• Points system and rewards\n• Eligibility and KYC requirements\n\n🧮 **CALCULATOR FEATURES:**\n• Calculate yields for any amount\n• Compare reUSD vs reUSDe returns\n• Project earnings over time\n• Risk assessment calculations\n\nTry: \"Calculate my yield for $1000 in reUSDe\" or \"What's the difference between reUSD and reUSDe returns?\"";
  };

  const calculateYieldFromQuestion = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    // Extract numbers from the question
    const numbers = question.match(/\d+/g);
    if (!numbers || numbers.length === 0) {
      return "Please specify an amount! For example: 'Calculate my yield for $1000' or 'What's the return for $5000 in reUSDe?'";
    }

    const amount = parseInt(numbers[0]);
    if (amount <= 0) {
      return "Please provide a valid amount greater than 0.";
    }

    // Check for specific requests
    const isReUSD = lowerQuestion.includes('reusd') && !lowerQuestion.includes('reusde');
    const isReUSDe = lowerQuestion.includes('reusde');
    const isComparison = lowerQuestion.includes('compare') || lowerQuestion.includes('difference') || lowerQuestion.includes('vs');

    // Calculate yields for both strategies (updated from documentation)
    const reUSDLow = amount * 0.06; // 6% APY
    const reUSDHigh = amount * 0.09; // 9%+ APY (from docs: 6%-9%+)
    const reUSDeLow = amount * 0.16; // 16% APY (from docs: 16%-25%)
    const reUSDeHigh = amount * 0.25; // 25% APY

    // Time-based calculations
    const monthlyReUSD = (reUSDLow + reUSDHigh) / 2 / 12;
    const monthlyReUSDe = (reUSDeLow + reUSDeHigh) / 2 / 12;
    const dailyReUSD = (reUSDLow + reUSDHigh) / 2 / 365;
    const dailyReUSDe = (reUSDeLow + reUSDeHigh) / 2 / 365;

    if (isReUSD) {
      return `**🧮 reUSD (Basis-Plus) Calculator - $${amount.toLocaleString()}:**\n\n💰 **Annual Returns:** $${reUSDLow.toFixed(2)} - $${reUSDHigh.toFixed(2)}\n📅 **Monthly:** $${monthlyReUSD.toFixed(2)}\n📊 **Daily:** $${dailyReUSD.toFixed(2)}\n🎯 **APY Range:** 6% - 9%+\n🛡️ **Risk Level:** Low (Principal Protected)\n\n*Delta-neutral ETH basis + T-bills + 250bps spread.*`;
    }

    if (isReUSDe) {
      return `**🧮 reUSDe (Insurance Alpha) Calculator - $${amount.toLocaleString()}:**\n\n💰 **Annual Returns:** $${reUSDeLow.toFixed(2)} - $${reUSDeHigh.toFixed(2)}\n📅 **Monthly:** $${monthlyReUSDe.toFixed(2)}\n📊 **Daily:** $${dailyReUSDe.toFixed(2)}\n🎯 **APY Range:** 16% - 25%\n⚠️ **Risk Level:** Higher (First Loss Position)\n\n*Insurance underwriting yields with higher risk.*`;
    }

    if (isComparison) {
      const reUSDDiff = reUSDHigh - reUSDLow;
      const reUSDeDiff = reUSDeHigh - reUSDeLow;
      const reUSDeAdvantage = ((reUSDeLow + reUSDeHigh) / 2) - ((reUSDLow + reUSDHigh) / 2);
      
      return `**🧮 Strategy Comparison Calculator - $${amount.toLocaleString()}:**\n\n**reUSD (Basis-Plus):**\n• Annual: $${reUSDLow.toFixed(2)} - $${reUSDHigh.toFixed(2)} (Range: $${reUSDDiff.toFixed(2)})\n• APY: 6% - 9%+\n• Risk: Low\n\n**reUSDe (Insurance Alpha):**\n• Annual: $${reUSDeLow.toFixed(2)} - $${reUSDeHigh.toFixed(2)} (Range: $${reUSDeDiff.toFixed(2)})\n• APY: 16% - 25%\n• Risk: Higher\n\n**📈 Difference:** reUSDe averages $${reUSDeAdvantage.toFixed(2)} more annually\n\n*Choose reUSD for stability, reUSDe for higher returns.*`;
    }

    // Default comprehensive calculation
    return `**🧮 Re Protocol Calculator - $${amount.toLocaleString()}:**\n\n**reUSD (Basis-Plus):**\n💰 Annual: $${reUSDLow.toFixed(2)} - $${reUSDHigh.toFixed(2)}\n📅 Monthly: $${monthlyReUSD.toFixed(2)}\n📊 Daily: $${dailyReUSD.toFixed(2)}\n🎯 APY: 6% - 9%+\n🛡️ Risk: Low\n\n**reUSDe (Insurance Alpha):**\n💰 Annual: $${reUSDeLow.toFixed(2)} - $${reUSDeHigh.toFixed(2)}\n📅 Monthly: $${monthlyReUSDe.toFixed(2)}\n📊 Daily: $${dailyReUSDe.toFixed(2)}\n🎯 APY: 16% - 25%\n⚠️ Risk: Higher\n\n*Yields based on official Re Protocol documentation.*`;
  };


  return (
    <div className="min-h-screen flex flex-col">
      {!hasStartedChat ? (
        /* Initial centered layout */
        <div className="flex-1 flex flex-col items-center justify-center px-4">
                  {/* ReFAQ Title */}
                  <div className="mb-12">
                    <h1 className="text-6xl font-bold tracking-wider">
                      <span className="text-white">Re</span>
                      <span className="bg-gradient-to-r from-indigo-400 to-purple-800 bg-clip-text text-transparent">FAQ</span>
                    </h1>
                    
                  </div>
          
          <div className="max-w-4xl w-full space-y-6">
            {/* Centered input */}
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <form onSubmit={handleSubmit}>
                  <div className="bg-gray-700 rounded-xl p-3 flex items-center space-x-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ask anything about Re Protocol..."
                      className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-sm"
                    />
                    
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Chat layout after first message */
        <>
                  {/* ReFAQ Title - Top center when chat starts */}
                  <div className="py-4 text-center">
                    <h1 className="text-2xl font-bold tracking-wider">
                      <span className="text-white">Re</span>
                      <span className="bg-gradient-to-r from-indigo-400 to-purple-800 bg-clip-text text-transparent">FAQ</span>
                    </h1>
                  </div>

          {/* Messages Area - Full height */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-4xl mx-auto space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}
                        >
                          <div className={`max-w-2xl ${message.isUser ? 'text-white' : 'text-gray-100'}`}>
                            {message.isUser ? (
                              <div className="px-4 py-3 rounded-2xl bg-re-card/80 backdrop-blur-md rounded-br-md border border-re-border/50 shadow-lg">
                                <p className="text-sm leading-relaxed whitespace-pre-line typewriter user-message">{message.text}</p>
                              </div>
                            ) : (
                              <p className="text-sm leading-relaxed whitespace-pre-line typewriter">{message.text}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start mb-4">
                          <div className="max-w-2xl">
                            <div className="flex items-center space-x-4">
                              <div className="flex space-x-2">
                                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full animate-pulse" style={{animationDelay: '0ms', animation: 'magicalPulse 1.5s ease-in-out infinite'}}></div>
                                <div className="w-3 h-3 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-400 rounded-full animate-pulse" style={{animationDelay: '300ms', animation: 'magicalPulse 1.5s ease-in-out infinite'}}></div>
                                <div className="w-3 h-3 bg-gradient-to-r from-pink-500 via-blue-400 to-purple-500 rounded-full animate-pulse" style={{animationDelay: '600ms', animation: 'magicalPulse 1.5s ease-in-out infinite'}}></div>
                              </div>
                              <span className="text-sm text-gray-300 animate-pulse">
                                ✨ Thinking...
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area - Fixed at bottom */}
          <div className="bg-black px-12 py-12">
            <div className="max-w-xl mx-auto">
              <form onSubmit={handleSubmit}>
                <div className="bg-gray-700 rounded-xl p-3 flex items-center space-x-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask anything about Re Protocol..."
                    className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-xs"
                  />
                  
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatInterface;
