export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

type Dict = Record<string, string>;

/** Base UI labels. New languages can be added by extending this map only. */
const en: Dict = {
  tagline: "From Citizen Problems to Collaborative Solutions",
  login: "Login",
  register: "Register",
  logout: "Logout",
  email: "Email",
  password: "Password",
  dashboard: "Dashboard",
  reportProblem: "Report a Problem",
  myProblems: "My Problems",
  projects: "Projects",
  notifications: "Notifications",
  feedback: "Feedback",
  profile: "Profile",
  community: "Community",
  priority: "Priority",
  status: "Status",
  category: "Category",
  submit: "Submit",
  chooseLanguage: "Choose your language",
  continue: "Continue",
  totalProblems: "Total Problems",
  highPriority: "High Priority",
  inProgress: "In Progress",
  solved: "Solved",
  voiceReport: "Report using Voice",
  supportProblem: "Support this Problem",
  acceptChallenge: "Accept Challenge",
};

const overrides: Record<string, Dict> = {
  te: {
    tagline: "పౌర సమస్యల నుండి సమిష్టి పరిష్కారాల వరకు",
    login: "లాగిన్", register: "నమోదు", logout: "లాగ్ అవుట్", email: "ఇమెయిల్", password: "పాస్‌వర్డ్",
    dashboard: "డాష్‌బోర్డ్", reportProblem: "సమస్యను నివేదించండి", myProblems: "నా సమస్యలు", projects: "ప్రాజెక్టులు",
    notifications: "నోటిఫికేషన్లు", feedback: "అభిప్రాయం", profile: "ప్రొఫైల్", community: "సమాజం",
    priority: "ప్రాధాన్యత", status: "స్థితి", category: "విభాగం", submit: "సమర్పించండి",
    chooseLanguage: "మీ భాషను ఎంచుకోండి", continue: "కొనసాగించు", totalProblems: "మొత్తం సమస్యలు",
    highPriority: "అధిక ప్రాధాన్యత", inProgress: "పురోగతిలో", solved: "పరిష్కరించబడినవి",
    voiceReport: "వాయిస్ ద్వారా నివేదించండి", supportProblem: "ఈ సమస్యకు మద్దతు", acceptChallenge: "సవాలును స్వీకరించండి",
  },
  hi: {
    tagline: "नागरिक समस्याओं से सहयोगी समाधान तक",
    login: "लॉगिन", register: "पंजीकरण", logout: "लॉग आउट", email: "ईमेल", password: "पासवर्ड",
    dashboard: "डैशबोर्ड", reportProblem: "समस्या दर्ज करें", myProblems: "मेरी समस्याएँ", projects: "परियोजनाएँ",
    notifications: "सूचनाएँ", feedback: "प्रतिक्रिया", profile: "प्रोफ़ाइल", community: "समुदाय",
    priority: "प्राथमिकता", status: "स्थिति", category: "श्रेणी", submit: "जमा करें",
    chooseLanguage: "अपनी भाषा चुनें", continue: "जारी रखें", totalProblems: "कुल समस्याएँ",
    highPriority: "उच्च प्राथमिकता", inProgress: "प्रगति पर", solved: "हल हुई",
    voiceReport: "आवाज़ से रिपोर्ट करें", supportProblem: "इस समस्या का समर्थन करें", acceptChallenge: "चुनौती स्वीकारें",
  },
  ta: {
    tagline: "குடிமக்கள் பிரச்சினைகளிலிருந்து கூட்டு தீர்வுகளுக்கு",
    login: "உள்நுழை", register: "பதிவு", logout: "வெளியேறு", email: "மின்னஞ்சல்", password: "கடவுச்சொல்",
    dashboard: "டாஷ்போர்டு", reportProblem: "பிரச்சினையை பதிவு செய்", myProblems: "என் பிரச்சினைகள்", projects: "திட்டங்கள்",
    notifications: "அறிவிப்புகள்", feedback: "கருத்து", profile: "சுயவிவரம்", community: "சமூகம்",
    priority: "முன்னுரிமை", status: "நிலை", category: "வகை", submit: "சமர்ப்பி",
    chooseLanguage: "உங்கள் மொழியை தேர்வு செய்யவும்", continue: "தொடரவும்", totalProblems: "மொத்த பிரச்சினைகள்",
    highPriority: "உயர் முன்னுரிமை", inProgress: "நடைபெறுகிறது", solved: "தீர்க்கப்பட்டது",
    voiceReport: "குரல் மூலம் பதிவு", supportProblem: "இதற்கு ஆதரவு", acceptChallenge: "சவாலை ஏற்கவும்",
  },
  kn: {
    tagline: "ನಾಗರಿಕ ಸಮಸ್ಯೆಗಳಿಂದ ಸಹಯೋಗದ ಪರಿಹಾರಗಳಿಗೆ",
    login: "ಲಾಗಿನ್", register: "ನೋಂದಣಿ", logout: "ಲಾಗ್ ಔಟ್", email: "ಇಮೇಲ್", password: "ಪಾಸ್‌ವರ್ಡ್",
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", reportProblem: "ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ", myProblems: "ನನ್ನ ಸಮಸ್ಯೆಗಳು", projects: "ಯೋಜನೆಗಳು",
    notifications: "ಅಧಿಸೂಚನೆಗಳು", feedback: "ಪ್ರತಿಕ್ರಿಯೆ", profile: "ಪ್ರೊಫೈಲ್", community: "ಸಮುದಾಯ",
    priority: "ಆದ್ಯತೆ", status: "ಸ್ಥಿತಿ", category: "ವರ್ಗ", submit: "ಸಲ್ಲಿಸಿ",
    chooseLanguage: "ನಿಮ್ಮ ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ", continue: "ಮುಂದುವರಿಸಿ", totalProblems: "ಒಟ್ಟು ಸಮಸ್ಯೆಗಳು",
    highPriority: "ಹೆಚ್ಚಿನ ಆದ್ಯತೆ", inProgress: "ಪ್ರಗತಿಯಲ್ಲಿದೆ", solved: "ಪರಿಹರಿಸಲಾಗಿದೆ",
    voiceReport: "ಧ್ವನಿ ಮೂಲಕ ವರದಿ", supportProblem: "ಈ ಸಮಸ್ಯೆಗೆ ಬೆಂಬಲ", acceptChallenge: "ಸವಾಲನ್ನು ಸ್ವೀಕರಿಸಿ",
  },
  ml: {
    tagline: "പൗര പ്രശ്നങ്ങളിൽ നിന്ന് കൂട്ടായ പരിഹാരങ്ങളിലേക്ക്",
    login: "ലോഗിൻ", register: "രജിസ്റ്റർ", logout: "ലോഗ് ഔട്ട്", email: "ഇമെയിൽ", password: "പാസ്‌വേഡ്",
    dashboard: "ഡാഷ്ബോർഡ്", reportProblem: "പ്രശ്നം രേഖപ്പെടുത്തുക", myProblems: "എന്റെ പ്രശ്നങ്ങൾ", projects: "പദ്ധതികൾ",
    notifications: "അറിയിപ്പുകൾ", feedback: "അഭിപ്രായം", profile: "പ്രൊഫൈൽ", community: "സമൂഹം",
    priority: "മുൻഗണന", status: "നില", category: "വിഭാഗം", submit: "സമർപ്പിക്കുക",
    chooseLanguage: "നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക", continue: "തുടരുക", totalProblems: "ആകെ പ്രശ്നങ്ങൾ",
    highPriority: "ഉയർന്ന മുൻഗണന", inProgress: "പുരോഗതിയിൽ", solved: "പരിഹരിച്ചു",
    voiceReport: "ശബ്ദത്തിലൂടെ റിപ്പോർട്ട്", supportProblem: "ഈ പ്രശ്നത്തെ പിന്തുണയ്ക്കുക", acceptChallenge: "വെല്ലുവിളി സ്വീകരിക്കുക",
  },
  mr: {
    tagline: "नागरिकांच्या समस्यांपासून सहयोगी उपायांपर्यंत",
    login: "लॉगिन", register: "नोंदणी", logout: "लॉग आउट", email: "ईमेल", password: "पासवर्ड",
    dashboard: "डॅशबोर्ड", reportProblem: "समस्या नोंदवा", myProblems: "माझ्या समस्या", projects: "प्रकल्प",
    notifications: "सूचना", feedback: "अभिप्राय", profile: "प्रोफाइल", community: "समुदाय",
    priority: "प्राधान्य", status: "स्थिती", category: "श्रेणी", submit: "सादर करा",
    chooseLanguage: "तुमची भाषा निवडा", continue: "पुढे चला", totalProblems: "एकूण समस्या",
    highPriority: "उच्च प्राधान्य", inProgress: "प्रगतीपथावर", solved: "सोडवलेल्या",
    voiceReport: "आवाजाद्वारे नोंदवा", supportProblem: "या समस्येला पाठिंबा", acceptChallenge: "आव्हान स्वीकारा",
  },
  bn: {
    tagline: "নাগরিক সমস্যা থেকে সহযোগী সমাধানে",
    login: "লগইন", register: "নিবন্ধন", logout: "লগ আউট", email: "ইমেইল", password: "পাসওয়ার্ড",
    dashboard: "ড্যাশবোর্ড", reportProblem: "সমস্যা জানান", myProblems: "আমার সমস্যা", projects: "প্রকল্প",
    notifications: "বিজ্ঞপ্তি", feedback: "প্রতিক্রিয়া", profile: "প্রোফাইল", community: "সম্প্রদায়",
    priority: "অগ্রাধিকার", status: "অবস্থা", category: "বিভাগ", submit: "জমা দিন",
    chooseLanguage: "আপনার ভাষা নির্বাচন করুন", continue: "চালিয়ে যান", totalProblems: "মোট সমস্যা",
    highPriority: "উচ্চ অগ্রাধিকার", inProgress: "চলমান", solved: "সমাধান হয়েছে",
    voiceReport: "ভয়েসে জানান", supportProblem: "এই সমস্যাকে সমর্থন", acceptChallenge: "চ্যালেঞ্জ গ্রহণ করুন",
  },
};

export function translate(lang: string, key: string): string {
  return overrides[lang]?.[key] ?? en[key] ?? key;
}

export const SPEECH_LOCALES: Record<string, string> = {
  en: "en-IN", te: "te-IN", hi: "hi-IN", ta: "ta-IN", kn: "kn-IN", ml: "ml-IN", mr: "mr-IN", bn: "bn-IN",
};
