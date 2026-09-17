// frontend/src/context/LanguageContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi';

export interface LanguageContextType {
  language: Language;
  isHindi: boolean;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
  translateDirective: (directive: string) => string;
  translateProvenance: (status: string) => string;
  translateSession: (session: string) => string;
}

const TRANSLATIONS: Record<string, { en: string; hi: string }> = {
  // Brand & Header
  'brand.title': { en: 'TradingAgents', hi: 'ट्रेडिंगएजेंट्स' },
  'brand.sub': { en: 'Indian Equity Decision Terminal', hi: 'भारतीय इक्विटी निर्णय टर्मिनल' },
  'header.search_placeholder': { en: 'Search symbol (e.g. RELIANCE, TCS, INFY, NIFTY 50)...', hi: 'सिंबल खोजें (उदा. RELIANCE, TCS, INFY, NIFTY 50)...' },
  'header.toggle_to_hindi': { en: '🇮🇳 हिंदी में बदलें', hi: '🇬🇧 Switch to English' },
  'header.toggle_tooltip': { en: 'Switch entire terminal to Hindi / पूरे टर्मिनल को हिंदी में बदलें', hi: 'Switch back to English / वापस अंग्रेजी में बदलें' },
  'header.market_session_default': { en: 'Indian Market Session', hi: 'भारतीय बाजार सत्र' },
  'header.click_to_analyze': { en: 'Click to analyze', hi: 'विश्लेषण करने के लिए क्लिक करें' },

  // Sessions
  'session.regular': { en: 'REGULAR TRADING SESSION (09:15 - 15:30 IST)', hi: 'नियमित ट्रेडिंग सत्र (09:15 - 15:30 IST)' },
  'session.pre_open': { en: 'PRE-OPEN MARKET (09:00 - 09:15 IST)', hi: 'प्री-ओपन बाजार (09:00 - 09:15 IST)' },
  'session.closed': { en: 'MARKET CLOSED', hi: 'बाजार बंद' },

  // Provenance
  'provenance.live': { en: 'LIVE', hi: 'लाइव' },
  'provenance.historical': { en: 'HISTORICAL', hi: 'ऐतिहासिक' },
  'provenance.delayed': { en: 'DELAYED', hi: 'विलंबित' },
  'provenance.stale': { en: 'STALE', hi: 'अद्यतन नहीं' },

  // Navigation
  'nav.dashboard': { en: 'Market Dashboard', hi: 'मार्केट डैशबोर्ड' },
  'nav.research': { en: 'Stock Research', hi: 'स्टॉक रिसर्च' },
  'nav.watchlist': { en: 'Watchlist', hi: 'वॉचलिस्ट' },
  'nav.evaluations': { en: 'AI Decision Tracking', hi: 'AI निर्णय ट्रैकिंग' },
  'nav.history': { en: 'Analysis Archive', hi: 'विश्लेषण संग्रह' },
  'nav.sources': { en: 'Data Sources & Infrastructure', hi: 'डेटा स्रोत और इंफ्रास्ट्रक्चर' },

  // Dashboard Cards
  'dashboard.indices_title': { en: 'Indian Benchmark Indices', hi: 'भारतीय बेंचमार्क सूचकांक' },
  'dashboard.official_badge': { en: 'NSE / BSE Official', hi: 'NSE / BSE आधिकारिक' },

  // Stock Research Sub-Tabs
  'tab.overview': { en: 'Overview & Charts', hi: 'ओवरव्यू और चार्ट्स' },
  'tab.technical': { en: 'Technical Analysis', hi: 'तकनीकी विश्लेषण' },
  'tab.fundamental': { en: 'Fundamental Analysis', hi: 'मौलिक विश्लेषण' },
  'tab.news': { en: 'News Feed', hi: 'समाचार फ़ीड' },
  'tab.sentiment': { en: 'Sentiment', hi: 'बाजार भावना (Sentiment)' },
  'tab.debate': { en: 'Research Debate', hi: 'अनुसंधान बहस (Debate)' },
  'tab.risk': { en: 'Risk Analysis', hi: 'जोखिम विश्लेषण' },
  'tab.decision': { en: 'AI Decision', hi: 'AI निर्णय' },
  'tab.chat': { en: 'AI Analyst Chat', hi: 'AI विश्लेषक चैट' },

  // Stock Research Header
  'research.last_traded_price': { en: 'LAST TRADED PRICE', hi: 'अंतिम व्यापार मूल्य (LTP)' },
  'research.loading_details': { en: 'Loading company details...', hi: 'कंपनी का विवरण लोड हो रहा है...' },
  'research.official_ticker': { en: 'Official Ticker', hi: 'आधिकारिक टिकर' },
  'research.matched_from': { en: 'Matched from', hi: 'से मिलान किया गया' },
  'research.run_analysis': { en: 'Run Fresh Multi-Agent AI Analysis', hi: 'नया मल्टी-एजेंट AI विश्लेषण चलाएं' },
  'research.in_watchlist': { en: 'In Watchlist', hi: 'वॉचलिस्ट में शामिल' },
  'research.add_watchlist': { en: 'Add to Watchlist', hi: 'वॉचलिस्ट में जोड़ें' },
  'research.unavailable': { en: 'Unavailable', hi: 'अनुपलब्ध' },

  // Decision View
  'decision.synthesized_directive': { en: 'Synthesized Portfolio Manager Directive', hi: 'समन्वित पोर्टफोलियो प्रबंधक निर्देश' },
  'decision.time_horizon': { en: 'Time Horizon', hi: 'समय सीमा (Horizon)' },
  'decision.conviction': { en: 'AI CONVICTION', hi: 'AI दृढ़ विश्वास (Conviction)' },
  'decision.evidence_quality': { en: 'EVIDENCE QUALITY', hi: 'साक्ष्य गुणवत्ता' },
  'decision.price_at_analysis': { en: 'PRICE AT ANALYSIS', hi: 'विश्लेषण के समय मूल्य' },
  'decision.execution_time': { en: 'EXECUTION TIME', hi: 'निष्पादन समय' },
  'decision.target_price': { en: 'Target Price', hi: 'लक्षित मूल्य (Target)' },
  'decision.stop_loss': { en: 'Hard Stop-Loss', hi: 'कड़ा स्टॉप लॉस (Stop Loss)' },
  'decision.rr_ratio': { en: 'Risk / Reward', hi: 'जोखिम / लाभ (Risk/Reward)' },
  'decision.entry_zone': { en: 'Recommended Entry Bracket', hi: 'अनुशंसित प्रवेश सीमा (Entry Bracket)' },
  'decision.primary_catalyst': { en: 'Primary Strategic Catalyst', hi: 'प्राथमिक रणनीतिक उत्प्रेरक' },
  'decision.invalidation_trigger': { en: 'Hard Invalidation Trigger', hi: 'अमान्यकरण ट्रिगर (Invalidation Trigger)' },
  'decision.strategic_rationale': { en: 'Institutional Strategic Rationale', hi: 'संस्थागत रणनीतिक तर्क' },
  'decision.debate_synthesis': { en: 'Multi-Agent Debate Consensus', hi: 'मल्टी-एजेंट डिबेट सर्वसम्मति' },
  'decision.trade_bracket': { en: 'Tactical Trade Execution Bracket', hi: 'रणनीतिक ट्रेड निष्पादन ब्रैकेट' },
  'decision.interrogate_team': { en: 'Interrogate Specialists About This Decision', hi: 'इस निर्णय पर विशेषज्ञों से पूछताछ करें' },
  'decision.no_analysis': { en: 'Run an AI research analysis to synthesize the final decision and thesis for this symbol.', hi: 'इस सिंबल के लिए अंतिम निर्णय और थीसिस संश्लेषित करने हेतु AI अनुसंधान विश्लेषण चलाएं।' },

  // Directives
  'directive.strong_buy': { en: 'STRONG BUY', hi: 'मजबूत खरीद (STRONG BUY)' },
  'directive.buy': { en: 'BUY', hi: 'खरीदें (BUY)' },
  'directive.hold': { en: 'HOLD', hi: 'बनाए रखें (HOLD)' },
  'directive.reduce': { en: 'REDUCE', hi: 'कम करें (REDUCE)' },
  'directive.sell': { en: 'SELL', hi: 'बेचें (SELL)' },
  'directive.strong_sell': { en: 'STRONG SELL', hi: 'मजबूत बिकवाली (STRONG SELL)' },

  // Technicals Table
  'tech.bias_title': { en: 'Deterministic Technical Bias', hi: 'निश्चित तकनीकी रुझान (Deterministic Technical Bias)' },
  'tech.data_range': { en: 'Data Range', hi: 'डेटा रेंज' },
  'tech.method': { en: 'Method: Zero-Hallucination Code Execution', hi: 'पद्धति: शून्य-भ्रम कोड निष्पादन (Deterministic Engine)' },
  'tech.momentum': { en: 'Momentum & Oscillators', hi: 'मोमेंटम और ऑसिलेटर्स (Momentum & Oscillators)' },
  'tech.trend': { en: 'Trend Following & Moving Averages', hi: 'ट्रेंड फॉलोइंग और मूविंग एवरेज (Moving Averages)' },
  'tech.volatility': { en: 'Volatility & Price Bands', hi: 'अस्थिरता और प्राइस बैंड्स (Volatility & Bands)' },
  'tech.pivots': { en: 'Classical Pivot Defense Levels', hi: 'क्लासिकल पिवट रक्षा स्तर (Pivot Defense Levels)' },
  'tech.camarilla': { en: 'Camarilla Breakout / Reversal Brackets', hi: 'कैमरीला ब्रेकआउट / रिवर्सल ब्रैकेट (Camarilla Brackets)' },
  'tech.computing': { en: 'Computing deterministic indicators from OHLCV...', hi: 'OHLCV से निश्चित संकेतकों की गणना की जा रही है...' },
  'tech.unavailable': { en: 'Technical indicators unavailable for this symbol.', hi: 'इस सिंबल के लिए तकनीकी संकेतक उपलब्ध नहीं हैं।' },

  // Fundamentals Table
  'fund.profile': { en: 'Company Profile', hi: 'कंपनी प्रोफ़ाइल' },
  'fund.market_cap': { en: 'MARKET CAP', hi: 'मार्केट कैप (Market Cap)' },
  'fund.enterprise_value': { en: 'ENTERPRISE VALUE', hi: 'एंटरप्राइज वैल्यू (EV)' },
  'fund.currency': { en: 'CURRENCY', hi: 'मुद्रा' },
  'fund.ratios_title': { en: 'Audited Valuation & Profitability Ratios', hi: 'ऑडिट किए गए मूल्यांकन और लाभप्रदता अनुपात' },
  'fund.tab_income': { en: 'Income Statement', hi: 'आय विवरण (Income Statement)' },
  'fund.tab_balance': { en: 'Balance Sheet', hi: 'बैलेंस शीट (Balance Sheet)' },
  'fund.tab_cashflow': { en: 'Cash Flow', hi: 'कैश फ्लो (Cash Flow)' },
  'fund.loading': { en: 'Retrieving audited financial statements and ratios...', hi: 'ऑडिट किए गए वित्तीय विवरण और अनुपात प्राप्त किए जा रहे हैं...' },
  'fund.unavailable': { en: 'Audited financials unavailable for this symbol.', hi: 'इस सिंबल के लिए ऑडिट किए गए वित्तीय आंकड़े उपलब्ध नहीं हैं।' },

  // Debate View
  'debate.title': { en: 'Structured Multi-Agent Debate Synthesis', hi: 'संरचित मल्टी-एजेंट डिबेट सिंथेसिस' },
  'debate.sub': { en: 'Autonomous deliberation between Bull Researcher and Bear Researcher. No forced consensus.', hi: 'बुल शोधकर्ता और बेयर शोधकर्ता के बीच स्वायत्त विचार-विमर्श। कोई कृत्रिम आम सहमति नहीं।' },
  'debate.bull_title': { en: 'THE BULL CASE', hi: 'बुल पक्ष (THE BULL CASE)' },
  'debate.bear_title': { en: 'THE BEAR CASE', hi: 'बेयर पक्ष (THE BEAR CASE)' },
  'debate.strongest_bull': { en: 'Strongest Bullish Arguments', hi: 'सबसे मजबूत तेजी के तर्क' },
  'debate.supporting_ev': { en: 'Supporting Evidence', hi: 'समर्थक साक्ष्य' },
  'debate.upside_catalysts': { en: 'Key Upside Catalysts', hi: 'प्रमुख तेजी उत्प्रेरक (Upside Catalysts)' },
  'debate.assumptions': { en: 'Critical Assumptions', hi: 'महत्वपूर्ण धारणाएं' },
  'debate.primary_risk': { en: 'Primary Risk Arguments', hi: 'प्राथमिक जोखिम तर्क' },
  'debate.downside_drivers': { en: 'Potential Downside Drivers', hi: 'संभावित मंदी के कारक' },
  'debate.invalidation_triggers': { en: 'Invalidation Triggers', hi: 'अमान्यकरण ट्रिगर' },
  'debate.no_analysis': { en: 'Run an AI research analysis to generate the multi-agent Bull vs Bear debate for this symbol.', hi: 'इस सिंबल के लिए मल्टी-एजेंट बुल बनाम बेयर डिबेट उत्पन्न करने हेतु AI शोध विश्लेषण चलाएं।' },

  // Risk View
  'risk.title': { en: 'Institutional Risk Evaluation', hi: 'संस्थागत जोखिम मूल्यांकन' },
  'risk.sub': { en: 'Stress testing across market volatility, structural liquidity, and key pivot defenses.', hi: 'बाजार की अस्थिरता, संरचनात्मक तरलता और प्रमुख पिवट रक्षा पर तनाव परीक्षण।' },
  'risk.volatility_title': { en: 'Volatility Assessment', hi: 'अस्थिरता मूल्यांकन' },
  'risk.liquidity_title': { en: 'Liquidity Profile', hi: 'तरलता प्रोफ़ाइल' },
  'risk.beta_title': { en: 'Benchmark Beta', hi: 'बेंचमार्क बीटा (Beta)' },
  'risk.beta_sub': { en: 'Relative to NIFTY 50 Index', hi: 'NIFTY 50 सूचकांक के सापेक्ष' },
  'risk.defense_levels': { en: 'Critical Price Defense Levels & Downside Boundary', hi: 'महत्वपूर्ण मूल्य रक्षा स्तर और गिरावट सीमा' },
  'risk.no_analysis': { en: 'Run an AI research analysis to inspect the multi-agent risk assessment for this symbol.', hi: 'इस सिंबल के लिए मल्टी-एजेंट जोखिम मूल्यांकन देखने हेतु AI विश्लेषण चलाएं।' },

  // News & Sentiment
  'news.title': { en: 'Verified Financial Press', hi: 'सत्यापित वित्तीय प्रेस' },
  'news.rule': { en: 'Rule: Real Sources Only — No Fabricated Articles', hi: 'नियम: केवल वास्तविक स्रोत — कोई कृत्रिम समाचार नहीं' },
  'news.verified_badge': { en: 'Source Verified ✓', hi: 'स्रोत सत्यापित ✓' },
  'news.loading': { en: 'Aggregating verified press articles...', hi: 'सत्यापित प्रेस समाचार एकत्रित किए जा रहे हैं...' },
  'news.empty': { en: 'No recent verified news articles found for this symbol.', hi: 'इस सिंबल के लिए हाल ही में कोई सत्यापित समाचार नहीं मिला।' },

  'sentiment.title': { en: 'Aggregated Public Sentiment', hi: 'समग्र सार्वजनिक भावना (Aggregated Sentiment)' },
  'sentiment.sample_size': { en: 'Sample Size', hi: 'नमूना आकार' },
  'sentiment.window': { en: 'Window', hi: 'अवधि' },
  'sentiment.confidence': { en: 'Confidence', hi: 'विश्वास स्तर' },
  'sentiment.provenance_title': { en: 'Sample & Source Provenance', hi: 'नमूना और स्रोत प्रमाण' },
  'sentiment.loading': { en: 'Aggregating and analyzing media tone...', hi: 'मीडिया टोन का संकलन और विश्लेषण किया जा रहा है...' },
  'sentiment.unavailable': { en: 'Sentiment data unavailable for this symbol.', hi: 'इस सिंबल के लिए भावना डेटा उपलब्ध नहीं है।' },

  // Watchlist View
  'watchlist.title': { en: 'Indian Equities Watchlist', hi: 'भारतीय इक्विटी वॉचलिस्ट' },
  'watchlist.sub': { en: 'Real-time tracking of top NSE & BSE stocks with verified market quotes.', hi: 'सत्यापित बाजार उद्धरणों के साथ शीर्ष NSE और BSE शेयरों की रीयल-टाइम ट्रैकिंग।' },
  'watchlist.add_placeholder': { en: 'Add ticker (e.g. SBIN.NS)...', hi: 'टिकर जोड़ें (उदा. SBIN.NS)...' },
  'watchlist.add_button': { en: 'Add', hi: 'जोड़ें' },
  'watchlist.col_symbol': { en: 'Symbol / Company', hi: 'सिंबल / कंपनी' },
  'watchlist.col_ltp': { en: 'LTP', hi: 'LTP' },
  'watchlist.col_change': { en: 'Change', hi: 'बदलाव' },
  'watchlist.col_day_range': { en: 'Day Range', hi: 'दैनिक सीमा' },
  'watchlist.col_52w_range': { en: '52W Range', hi: '52 सप्ताह सीमा' },
  'watchlist.col_status': { en: 'Status & Freshness', hi: 'स्थिति और ताज़गी' },
  'watchlist.col_actions': { en: 'Actions', hi: 'क्रियाएं' },
  'watchlist.empty': { en: 'No symbols in your watchlist. Add one above to track in real-time.', hi: 'आपकी वॉचलिस्ट में कोई सिंबल नहीं है। रीयल-टाइम ट्रैक करने के लिए ऊपर जोड़ें।' },
  'watchlist.action_analyze': { en: 'Analyze with AI', hi: 'AI से विश्लेषण करें' },

  // AI Decision Tracking & Evaluation
  'eval.title': { en: 'AI Decision Tracking & Research Evaluation', hi: 'AI निर्णय ट्रैकिंग और रिसर्च मूल्यांकन' },
  'eval.sub': { en: 'Empirical validation: Comparing what the AI said vs what actually happened in the market.', hi: 'अनुभवजन्य सत्यापन: AI ने क्या कहा बनाम बाजार में वास्तव में क्या हुआ।' },
  'eval.refresh': { en: 'Refresh Historical Outcomes', hi: 'ऐतिहासिक परिणाम ताज़ा करें' },
  'eval.paper_title': { en: 'Paper Evaluation Engine', hi: 'पेपर मूल्यांकन इंजन (Paper Engine)' },
  'eval.paper_desc': { en: 'This evaluation system tracks post-analysis price trajectory against real verified market prints. It does not execute broker trades or manage real capital. Zero historical results are altered.', hi: 'यह मूल्यांकन प्रणाली वास्तविक बाजार डेटा के विरुद्ध विश्लेषण के बाद के मूल्य प्रक्षेपवक्र को ट्रैक करती है। यह कोई ब्रोकर ट्रेड निष्पादित नहीं करती है और न ही वास्तविक पूंजी का प्रबंधन करती है। कोई ऐतिहासिक परिणाम बदला नहीं जाता है।' },
  'eval.col_symbol': { en: 'Symbol & Model', hi: 'सिंबल और मॉडल' },
  'eval.col_signal': { en: 'AI Signal', hi: 'AI संकेत' },
  'eval.col_price': { en: 'Price At Analysis', hi: 'विश्लेषण पर मूल्य' },
  'eval.col_1d': { en: '1-Day Return', hi: '1-दिन का रिटर्न' },
  'eval.col_5d': { en: '5-Day Return', hi: '5-दिन का रिटर्न' },
  'eval.col_20d': { en: '20-Day Return', hi: '20-दिन का रिटर्न' },
  'eval.col_benchmark': { en: 'Benchmark (NIFTY 50)', hi: 'बेंचमार्क (NIFTY 50)' },
  'eval.col_alpha': { en: 'Alpha', hi: 'अल्फा (Alpha)' },
  'eval.empty': { en: 'No historical analyses recorded yet. Run a research analysis on any Indian stock to initiate decision tracking.', hi: 'अभी तक कोई ऐतिहासिक विश्लेषण दर्ज नहीं है। निर्णय ट्रैकिंग शुरू करने के लिए किसी भी भारतीय शेयर पर विश्लेषण चलाएं।' },

  // Analysis Archive (History)
  'history.title': { en: 'Research Analysis Archive', hi: 'अनुसंधान विश्लेषण संग्रह' },
  'history.sub': { en: 'Auditable archive of all autonomous multi-agent deliberations and structured research decisions.', hi: 'सभी स्वायत्त मल्टी-एजेंट विचार-विमर्श और संरचित अनुसंधान निर्णयों का ऑडिट योग्य संग्रह।' },
  'history.col_time': { en: 'Date & Time (IST)', hi: 'दिनांक और समय (IST)' },
  'history.col_symbol': { en: 'Symbol & Company', hi: 'सिंबल और कंपनी' },
  'history.col_price': { en: 'Price At Analysis', hi: 'विश्लेषण पर मूल्य' },
  'history.col_signal': { en: 'AI Signal', hi: 'AI संकेत' },
  'history.col_evidence': { en: 'Evidence Quality', hi: 'साक्ष्य गुणवत्ता' },
  'history.col_model': { en: 'Model / Provider', hi: 'मॉडल / प्रदाता' },
  'history.col_duration': { en: 'Duration', hi: 'अवधि' },
  'history.col_report': { en: 'Report', hi: 'रिपोर्ट' },
  'history.action_view': { en: 'View Report', hi: 'रिपोर्ट देखें' },
  'history.empty': { en: 'No historical analyses recorded yet.', hi: 'अभी तक कोई ऐतिहासिक विश्लेषण दर्ज नहीं हुआ है।' },

  // Data Sources & Infrastructure
  'sources.title': { en: 'Data Sources & Infrastructure Transparency', hi: 'डेटा स्रोत और इंफ्रास्ट्रक्चर पारदर्शिता' },
  'sources.sub': { en: 'Real-time health, latency, and configuration audit for all market data and LLM intelligence providers.', hi: 'सभी बाजार डेटा और LLM बुद्धिमत्ता प्रदाताओं के लिए रीयल-टाइम स्वास्थ्य, विलंबता और कॉन्फ़िगरेशन ऑडिट।' },
  'sources.security_title': { en: 'Security & Secret Isolation Policy', hi: 'सुरक्षा और गुप्त अलगाव नीति' },
  'sources.security_desc': { en: 'All broker API secrets (Upstox, Zerodha) and LLM credentials (Anthropic, Google, OpenAI) are strictly isolated on the backend server in environment configuration. No credentials or raw tokens are ever transmitted across client endpoints or included in browser bundles.', hi: 'सभी ब्रोकर API सीक्रेट्स (Upstox, Zerodha) और LLM क्रेडेंशियल्स (Google, OpenRouter, OpenAI, Anthropic) पर्यावरण कॉन्फ़िगरेशन में बैकएंड सर्वर पर पूरी तरह से सुरक्षित और अलग रखे गए हैं। कोई भी क्रेडेंशियल कभी भी क्लाइंट एंडपॉइंट्स पर प्रसारित नहीं होता है।' },

  // Analysis Modal
  'modal.title': { en: 'Autonomous Multi-Agent Deliberation', hi: 'स्वायत्त मल्टी-एजेंट विचार-विमर्श' },
  'modal.running_status': { en: 'Executing institutional agent pipeline...', hi: 'संस्थागत एजेंट पाइपलाइन निष्पादित हो रही है...' },
  'modal.completed_title': { en: 'Research Complete', hi: 'शोध विश्लेषण पूर्ण' },
  'modal.inspect_report': { en: 'Inspect Full Report', hi: 'पूरी रिपोर्ट देखें' },
  'modal.close': { en: 'Close', hi: 'बंद करें' },
  'modal.failed_title': { en: 'Analysis Failed', hi: 'विश्लेषण विफल' },

  // AI Chat Personas
  'persona.portfolio_manager.label': { en: 'Portfolio Manager', hi: 'पोर्टफोलियो मैनेजर' },
  'persona.portfolio_manager.badge': { en: 'Decision Synthesizer', hi: 'निर्णय संश्लेषक' },
  'persona.portfolio_manager.desc': { en: 'Overall directive, conviction, targets, and capital allocation', hi: 'समग्र निर्देश, दृढ़ विश्वास, लक्ष्य और पूंजी आवंटन' },

  'persona.technical.label': { en: 'Technical Analyst', hi: 'तकनीकी विश्लेषक' },
  'persona.technical.badge': { en: 'Chart & Momentum', hi: 'चार्ट और मोमेंटम' },
  'persona.technical.desc': { en: 'RSI, MACD, EMAs/SMAs, pivots, ATR volatility, and entry zones', hi: 'RSI, MACD, EMAs/SMAs, पिवट्स, ATR अस्थिरता, और प्रवेश क्षेत्र' },

  'persona.fundamental.label': { en: 'Fundamental Analyst', hi: 'फंडामेंटल विश्लेषक' },
  'persona.fundamental.badge': { en: 'Valuation & Balance Sheet', hi: 'मूल्यांकन और बैलेंस शीट' },
  'persona.fundamental.desc': { en: 'P/E ratios, PEG, ROE, margins, debt, and quarterly filings in ₹ Cr', hi: 'P/E अनुपात, PEG, ROE, मार्जिन, ऋण, और ₹ करोड़ में तिमाही फाइलिंग' },

  'persona.risk.label': { en: 'Risk Officer', hi: 'रिस्क ऑफिसर' },
  'persona.risk.badge': { en: 'Downside & Invalidation', hi: 'गिरावट और अमान्यकरण' },
  'persona.risk.desc': { en: 'Stop-loss discipline, drawdown limits, beta, and invalidation criteria', hi: 'स्टॉप लॉस अनुशासन, ड्रॉडाउन सीमा, बीटा, और अमान्यकरण मानदंड' },

  'persona.bull.label': { en: 'Bull Researcher', hi: 'बुल शोधकर्ता' },
  'persona.bull.badge': { en: 'Upside Thesis', hi: 'तेजी की थीसिस' },
  'persona.bull.desc': { en: 'Growth drivers, margin expansion tailwinds, and breakout odds', hi: 'विकास चालक, मार्जिन विस्तार के अनुकूल कारक, और ब्रेकआउट संभावना' },

  'persona.bear.label': { en: 'Bear Researcher', hi: 'बेयर शोधकर्ता' },
  'persona.bear.badge': { en: 'Downside Skeptic', hi: 'मंदी संशयवादी' },
  'persona.bear.desc': { en: 'Overhead resistance, multiple de-rating risks, and macroeconomic hurdles', hi: 'ऊपरी प्रतिरोध, मल्टीपल डी-रेटिंग जोखिम, और व्यापक आर्थिक बाधाएं' },

  // AI Chat UI
  'chat.select_persona': { en: 'SELECT SPECIALIST ANALYST PERSONA TO INTERROGATE:', hi: 'पूछताछ करने के लिए विशेषज्ञ विश्लेषक चुनें:' },
  'chat.prompt_chips_title': { en: 'SUGGESTED PROMPTS (CLICK TO ASK):', hi: 'सुझाए गए प्रश्न (पूछने के लिए क्लिक करें):' },
  'chat.reset_button': { en: 'Reset Chat', hi: 'चैट रीसेट करें' },
  'chat.ai_settings_button': { en: 'AI Settings', hi: 'AI सेटिंग्स' },
  'chat.send_button': { en: 'Send', hi: 'भेजें' },
  'chat.input_placeholder': {
    en: 'Ask specialist about this stock (e.g., target chances, stop loss, time to hold, RSI)...',
    hi: 'इस शेयर के बारे में विशेषज्ञ से पूछें (उदा. होल्ड करने का समय, स्टॉप लॉस, लक्ष्य संभावना, RSI)...',
  },
  'chat.settings_modal_title': { en: 'AI Provider & Key Configuration', hi: 'AI प्रदाता और की (Key) कॉन्फ़िगरेशन' },
  'chat.settings_modal_desc': {
    en: 'Configure a live generative AI key (Google Gemini, OpenRouter, OpenAI, Anthropic). If no key is set, the built-in Institutional Quantitative Engine operates automatically with zero fabricated data.',
    hi: 'लाइव जनरेटिव AI की (Google Gemini, OpenRouter, OpenAI, Anthropic) कॉन्फ़िगर करें। यदि कोई की सेट नहीं है, तो अंतर्निहित संस्थागत क्वांट इंजन शून्य-भ्रम नीति के साथ स्वचालित रूप से कार्य करता है।',
  },
  'chat.save_and_activate': { en: 'Save & Activate', hi: 'सुरक्षित करें और सक्रिय करें' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('tradingagents_lang');
    return saved === 'hi' ? 'hi' : 'en';
  });

  const isHindi = language === 'hi';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('tradingagents_lang', lang);
  };

  const toggleLanguage = () => {
    const next = language === 'en' ? 'hi' : 'en';
    setLanguage(next);
  };

  const t = (key: string, defaultText?: string): string => {
    const entry = TRANSLATIONS[key];
    if (entry) {
      return language === 'hi' ? entry.hi : entry.en;
    }
    return defaultText || key;
  };

  const translateDirective = (directive: string): string => {
    if (!directive) return '';
    const upper = directive.toUpperCase().trim();
    if (!isHindi) return upper;
    if (upper.includes('STRONG BUY')) return 'मजबूत खरीद (STRONG BUY)';
    if (upper.includes('STRONG SELL')) return 'मजबूत बिकवाली (STRONG SELL)';
    if (upper.includes('BUY')) return 'खरीदें (BUY)';
    if (upper.includes('SELL')) return 'बेचें (SELL)';
    if (upper.includes('HOLD')) return 'बनाए रखें (HOLD)';
    if (upper.includes('REDUCE')) return 'कम करें (REDUCE)';
    return directive;
  };

  const translateProvenance = (status: string): string => {
    if (!status) return '';
    if (!isHindi) return status;
    const upper = status.toUpperCase().trim();
    if (upper === 'LIVE') return 'लाइव';
    if (upper === 'HISTORICAL') return 'ऐतिहासिक';
    if (upper === 'DELAYED') return 'विलंबित';
    if (upper === 'STALE') return 'पुराना';
    return status;
  };

  const translateSession = (session: string): string => {
    if (!session) return '';
    if (!isHindi) return session;
    if (session.includes('REGULAR')) return 'नियमित ट्रेडिंग सत्र (09:15 - 15:30 IST)';
    if (session.includes('PRE-OPEN') || session.includes('PRE_OPEN')) return 'प्री-ओपन बाजार (09:00 - 09:15 IST)';
    if (session.includes('CLOSED')) return 'बाजार बंद';
    return session;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        isHindi,
        toggleLanguage,
        setLanguage,
        t,
        translateDirective,
        translateProvenance,
        translateSession,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
