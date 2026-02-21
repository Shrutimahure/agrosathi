import { useState, useEffect, useRef, useCallback } from "react";

// ─── Enhanced Intent Detection Engine ──────────────────────────────────────────
const INTENT_CONFIG = [
  {
    name: "doctor", route: "doctor", label: "Pashu Doctor",
    emoji: "🩺", color: "#e74c3c",
    keywords: [
      { word: "bukhar", weight: 10 }, { word: "bimaar", weight: 10 },
      { word: "doctor", weight: 10 }, { word: "vet", weight: 10 },
      { word: "pashu doctor", weight: 10 }, { word: "animal sick", weight: 10 },
      { word: "taklif", weight: 8 }, { word: "behoosh", weight: 8 },
      { word: "injection", weight: 7 }, { word: "ilaaj", weight: 8 },
      { word: "dawai", weight: 6 }, { word: "gaay bimaar", weight: 10 },
      { word: "bhains bimaar", weight: 10 }, { word: "emergency", weight: 10 },
      { word: "help", weight: 9 }, { word: "madad", weight: 9 },
    ],
  },
  {
    name: "scheme", route: "schemes", label: "Sarkari Yojana",
    emoji: "📋", color: "#2980b9",
    keywords: [
      { word: "scheme", weight: 10 }, { word: "yojana", weight: 10 },
      { word: "subsidy", weight: 10 }, { word: "government", weight: 8 },
      { word: "sarkar", weight: 8 }, { word: "loan", weight: 7 },
      { word: "mudra", weight: 7 }, { word: "nabard", weight: 9 },
      { word: "pm kisan", weight: 10 }, { word: "insurance", weight: 7 },
      { word: "bima", weight: 8 }, { word: "sahayata", weight: 6 },
      { word: "paisa", weight: 5 }, { word: "financial", weight: 7 },
    ],
  },
  {
    name: "product", route: "products", label: "Products & Feed",
    emoji: "🛒", color: "#27ae60",
    keywords: [
      { word: "kharidna", weight: 10 }, { word: "buy", weight: 10 },
      { word: "product", weight: 9 }, { word: "feed", weight: 9 },
      { word: "cattle feed", weight: 10 }, { word: "dawa", weight: 8 },
      { word: "dawai", weight: 8 }, { word: "milk", weight: 6 },
      { word: "dudh", weight: 6 }, { word: "supplement", weight: 7 },
      { word: "mineral", weight: 7 }, { word: "vitamin", weight: 7 },
      { word: "cart", weight: 8 }, { word: "shopping", weight: 8 },
    ],
  },
];

function detectIntent(transcript) {
  const lower = transcript.toLowerCase().trim();
  const scores = INTENT_CONFIG.map((intent) => {
    let score = 0;
    const matched = [];
    intent.keywords.forEach(({ word, weight }) => {
      if (lower.includes(word)) { 
        score += weight; 
        matched.push(word); 
      }
    });
    const maxScore = intent.keywords.reduce((s, k) => s + k.weight, 0);
    const confidence = maxScore > 0 ? Math.min(100, Math.round((score / maxScore) * 100)) : 0;
    return { ...intent, score, matched, confidence };
  });
  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];
  return best.score > 0
    ? { ...best, found: true }
    : { found: false, label: "Samajh nahi aaya", emoji: "🤔" };
}

// ─── Sample Data ───────────────────────────────────────────────────────────────
const DOCTORS = [
  { id: 1, name: "Dr. Ramesh Patil",   spec: "Pashu Chikitsa",        phone: "9876543210", district: "Pune",       rating: 4.8, available: true,  experience: "15 years", clinic: "Pune Vet Hospital" },
  { id: 2, name: "Dr. Sunita Jadhav",  spec: "Dairy Cattle Expert",   phone: "9876543211", district: "Nashik",     rating: 4.6, available: true,  experience: "12 years", clinic: "Nashik Dairy Care" },
  { id: 3, name: "Dr. Anil Shinde",    spec: "Large Animal Vet",      phone: "9876543212", district: "Kolhapur",   rating: 4.7, available: false, experience: "20 years", clinic: "Kolhapur Vet Center" },
  { id: 4, name: "Dr. Priya Kulkarni", spec: "Goat & Sheep Vet",      phone: "9876543213", district: "Aurangabad", rating: 4.5, available: true,  experience: "8 years", clinic: "Aurangabad Animal Care" },
  { id: 5, name: "Dr. Vikas More",     spec: "Buffalo Specialist",    phone: "9876543214", district: "Solapur",    rating: 4.9, available: true,  experience: "18 years", clinic: "Solapur Vet Clinic" },
  { id: 6, name: "Dr. Meena Gaikwad",  spec: "Poultry & Small Farm",  phone: "9876543215", district: "Latur",      rating: 4.4, available: true,  experience: "10 years", clinic: "Latur Poultry Care" },
];

const SCHEMES = [
  { id: 1, name: "PM Kisan Samman Nidhi",           benefit: "₹6,000 / year",              eligibility: "All small farmers",    deadline: "Mar 2025", category: "income_support", emoji: "💰", applied: false },
  { id: 2, name: "Rashtriya Pashudhan Bima Yojana", benefit: "100% premium subsidy",        eligibility: "BPL farmers",          deadline: "Jun 2025", category: "insurance",      emoji: "🛡️", applied: false },
  { id: 3, name: "Kisan Credit Card (KCC)",          benefit: "Loan up to ₹3 lakh at 4%",  eligibility: "All farmers",          deadline: "Ongoing",  category: "credit",         emoji: "💳", applied: false },
  { id: 4, name: "Gokul Mission",                    benefit: "Subsidy on cattle purchase", eligibility: "Dairy farmers",        deadline: "Dec 2025", category: "dairy",          emoji: "🐄", applied: false },
  { id: 5, name: "National Livestock Mission",        benefit: "50% subsidy on feed",       eligibility: "Livestock owners",     deadline: "Sep 2025", category: "livestock",      emoji: "🌾", applied: false },
];

const PRODUCTS = [
  { id: 1, name: "Premium Cattle Feed",     price: 850,   unit: "50kg bag",   category: "feed",       brand: "Amul Agro",      rating: 4.7, inStock: true,  emoji: "🌾", quantity: 1 },
  { id: 2, name: "Mineral Mixture",         price: 320,   unit: "5kg pack",   category: "supplement", brand: "Godrej Agrovet", rating: 4.5, inStock: true,  emoji: "💊", quantity: 1 },
  { id: 3, name: "Maize Silage",            price: 450,   unit: "25kg bag",   category: "feed",       brand: "Local Farm",     rating: 4.3, inStock: true,  emoji: "🌽", quantity: 1 },
  { id: 4, name: "Vitamin A+D3",            price: 180,   unit: "500ml",      category: "supplement", brand: "Vetcare",        rating: 4.6, inStock: false, emoji: "💉", quantity: 1 },
  { id: 5, name: "Automatic Milk Machine",  price: 18500, unit: "per unit",   category: "equipment",  brand: "DairyTech",      rating: 4.8, inStock: true,  emoji: "🐄", quantity: 1 },
  { id: 6, name: "Deworming Tablet",        price: 95,    unit: "10 tablets", category: "medicine",   brand: "Vetoquinol",     rating: 4.4, inStock: true,  emoji: "🔵", quantity: 1 },
  { id: 7, name: "Urea Molasses Block",     price: 550,   unit: "5kg block",  category: "supplement", brand: "NutriFeeds",    rating: 4.5, inStock: true,  emoji: "🧱", quantity: 1 },
  { id: 8, name: "Milking Machine",         price: 12500, unit: "per unit",   category: "equipment",  brand: "DairyTech",      rating: 4.6, inStock: true,  emoji: "🥛", quantity: 1 },
];

// ─── Styles ────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --green:       #2d7a2d;
    --green-light: #4caf50;
    --green-pale:  #e8f5e9;
    --green-dark:  #1b5e20;
    --gold:        #f9a825;
    --gold-light:  #fff8e1;
    --red:         #c62828;
    --red-light:   #ffebee;
    --blue:        #1565c0;
    --blue-light:  #e3f2fd;
    --soil:        #5d4037;
    --white:       #ffffff;
    --gray:        #f5f5f5;
    --gray-dark:   #757575;
    --text:        #1a1a1a;
    --shadow:      0 4px 20px rgba(0,0,0,0.12);
    --shadow-lg:   0 8px 40px rgba(0,0,0,0.18);
  }

  body { 
    font-family: 'Baloo 2', sans-serif; 
    background: var(--green-pale); 
    color: var(--text); 
    overflow-x: hidden;
  }

  /* ── NAV ── */
  .nav {
    background: linear-gradient(135deg, var(--green-dark) 0%, var(--green) 100%);
    padding: 0 20px;
    display: flex; align-items: center; justify-content: space-between;
    height: 70px; position: sticky; top: 0; z-index: 100;
    box-shadow: 0 2px 12px rgba(0,0,0,0.25);
  }
  .nav-logo { display: flex; align-items: center; gap: 10px; cursor: pointer; }
  .nav-logo-icon { font-size: 32px; }
  .nav-logo-text { color: white; font-size: 20px; font-weight: 800; line-height: 1.1; }
  .nav-logo-sub  { color: #a5d6a7; font-size: 12px; font-weight: 500; }
  .nav-actions { display: flex; gap: 10px; align-items: center; }
  .nav-btn {
    background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
    color: white; padding: 8px 16px; border-radius: 25px; cursor: pointer;
    font-family: inherit; font-size: 14px; font-weight: 600;
    transition: all 0.2s;
  }
  .nav-btn:hover { background: rgba(255,255,255,0.25); transform: translateY(-2px); }
  .nav-btn.active { background: var(--gold); color: var(--green-dark); border-color: var(--gold); }
  
  /* ── CART ICON ── */
  .cart-icon {
    position: relative;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.3);
    color: white;
    width: 45px;
    height: 45px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .cart-icon:hover {
    background: rgba(255,255,255,0.25);
    transform: scale(1.1);
  }
  .cart-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: var(--gold);
    color: var(--green-dark);
    font-size: 12px;
    font-weight: 700;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
  }

  /* ── HERO ── */
  .hero {
    background: linear-gradient(160deg, var(--green-dark) 0%, #2e7d32 50%, #388e3c 100%);
    padding: 48px 20px 60px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute; inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C%3C/g%3E%3C%3C/g%3E%3C/svg%3E");
  }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(249,168,37,0.2); border: 1px solid rgba(249,168,37,0.5);
    color: var(--gold); padding: 6px 18px; border-radius: 25px;
    font-size: 13px; font-weight: 600; margin-bottom: 16px;
    text-transform: uppercase; letter-spacing: 1px;
  }
  .hero h1 { color: white; font-size: clamp(28px, 5vw, 48px); font-weight: 800; line-height: 1.2; margin-bottom: 8px; }
  .hero h1 span { color: var(--gold); }
  .hero-tagline { color: #a5d6a7; font-size: 18px; margin-bottom: 36px; }
  
  /* ── MIC BUTTON ── */
  .mic-wrapper { position: relative; display: inline-flex; flex-direction: column; align-items: center; gap: 16px; }
  .mic-ripple {
    position: absolute; inset: -20px; border-radius: 50%;
    background: rgba(76,175,80,0.2); animation: ripple 2s ease-out infinite;
  }
  .mic-ripple:nth-child(2) { inset: -35px; animation-delay: 0.5s; opacity: 0.6; }
  .mic-ripple:nth-child(3) { inset: -55px; animation-delay: 1s; opacity: 0.3; }
  @keyframes ripple { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.2); opacity: 0; } }
  
  .mic-btn {
    width: 130px; height: 130px; border-radius: 50%;
    background: linear-gradient(135deg, var(--green-light), var(--green));
    border: 4px solid rgba(255,255,255,0.4);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 52px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 8px rgba(76,175,80,0.2);
    transition: all 0.3s; position: relative; z-index: 1;
    -webkit-tap-highlight-color: transparent;
  }
  .mic-btn:hover { transform: scale(1.08); box-shadow: 0 12px 40px rgba(0,0,0,0.4); }
  .mic-btn.listening {
    background: linear-gradient(135deg, #ef5350, #c62828);
    animation: pulse-mic 1s ease-in-out infinite;
    box-shadow: 0 8px 32px rgba(198,40,40,0.5), 0 0 0 8px rgba(239,83,80,0.2);
  }
  @keyframes pulse-mic { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
  
  .mic-label {
    color: white; font-size: 16px; font-weight: 600;
    background: rgba(0,0,0,0.2); padding: 8px 24px; border-radius: 30px;
    backdrop-filter: blur(4px);
  }
  
  /* ── TRANSCRIPT BOX ── */
  .transcript-box {
    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
    border-radius: 20px; padding: 18px 24px; margin: 24px auto 0;
    max-width: 550px; min-height: 70px; text-align: left;
    backdrop-filter: blur(8px);
  }
  .transcript-label { color: #a5d6a7; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .transcript-text { color: white; font-size: 18px; font-weight: 500; min-height: 30px; }
  .cursor { display: inline-block; width: 2px; height: 18px; background: var(--gold); margin-left: 3px; animation: blink 1s step-end infinite; vertical-align: middle; }
  @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
  
  /* ── TEXT INPUT ALTERNATIVE ── */
  .text-input-wrap { display: flex; gap: 10px; max-width: 550px; margin: 20px auto 0; }
  .text-input {
    flex: 1; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
    color: white; padding: 12px 20px; border-radius: 15px; font-family: inherit;
    font-size: 16px; outline: none;
  }
  .text-input::placeholder { color: rgba(255,255,255,0.5); }
  .text-submit {
    background: var(--gold); color: var(--green-dark); border: none;
    padding: 12px 24px; border-radius: 15px; cursor: pointer;
    font-family: inherit; font-weight: 700; font-size: 16px;
    transition: all 0.2s;
  }
  .text-submit:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
  
  /* ── QUICK DEMOS ── */
  .demo-queries { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin: 20px auto 0; max-width: 600px; }
  .demo-chip {
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25);
    color: rgba(255,255,255,0.9); padding: 8px 18px; border-radius: 25px;
    font-size: 14px; cursor: pointer; transition: all 0.2s; font-family: inherit;
  }
  .demo-chip:hover { background: rgba(255,255,255,0.22); transform: translateY(-2px); }
  
  /* ── INTENT RESULT BANNER ── */
  .intent-banner {
    margin: 20px auto 0; max-width: 550px; border-radius: 20px;
    padding: 18px 24px; display: flex; align-items: center; gap: 15px;
    animation: slideUp 0.4s ease;
  }
  @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .intent-banner.success { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); }
  .intent-banner.error   { background: rgba(239,83,80,0.2); border: 1px solid rgba(239,83,80,0.4); }
  .intent-emoji { font-size: 32px; }
  .intent-info { flex: 1; }
  .intent-title { color: white; font-weight: 700; font-size: 16px; }
  .intent-sub   { color: rgba(255,255,255,0.7); font-size: 14px; }
  .confidence-bar { width: 100%; height: 5px; background: rgba(255,255,255,0.2); border-radius: 3px; margin-top: 6px; }
  .confidence-fill { height: 100%; border-radius: 3px; background: var(--gold); transition: width 0.6s ease; }
  .intent-go-btn {
    background: var(--gold); color: var(--green-dark); border: none;
    padding: 10px 20px; border-radius: 15px; cursor: pointer;
    font-family: inherit; font-weight: 700; font-size: 14px; white-space: nowrap;
    transition: all 0.2s;
  }
  .intent-go-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }

  /* ── ERROR MSG ── */
  .error-msg { 
    background: rgba(198,40,40,0.15); border: 1px solid rgba(198,40,40,0.3);
    color: #ffcdd2; border-radius: 15px; padding: 12px 20px;
    margin: 15px auto 0; max-width: 550px; font-size: 15px; text-align: center;
  }

  /* ── QUICK ACCESS CARDS ── */
  .quick-access { padding: 40px 20px; }
  .quick-access h2 { text-align: center; color: var(--green-dark); font-size: 24px; font-weight: 700; margin-bottom: 24px; }
  .cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 800px; margin: 0 auto; }
  .quick-card {
    background: white; border-radius: 25px; padding: 30px 20px;
    text-align: center; cursor: pointer; box-shadow: var(--shadow);
    border: 2px solid transparent; transition: all 0.3s;
  }
  .quick-card:hover { transform: translateY(-8px); box-shadow: var(--shadow-lg); }
  .quick-card.doctor:hover { border-color: var(--red); }
  .quick-card.scheme:hover { border-color: var(--blue); }
  .quick-card.product:hover { border-color: var(--green-light); }
  .quick-card-icon { font-size: 48px; margin-bottom: 12px; }
  .quick-card-title { font-size: 18px; font-weight: 700; color: var(--text); }
  .quick-card-sub   { font-size: 14px; color: #666; margin-top: 5px; }

  /* ── PAGE WRAPPER ── */
  .page { padding: 24px 20px; max-width: 1200px; margin: 0 auto; }
  .page-header { display: flex; align-items: center; gap: 15px; margin-bottom: 24px; flex-wrap: wrap; }
  .page-back {
    background: white; border: none; border-radius: 15px;
    width: 45px; height: 45px; cursor: pointer; font-size: 20px;
    box-shadow: var(--shadow); display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .page-back:hover { transform: scale(1.1); }
  .page-title { font-size: 26px; font-weight: 800; color: var(--green-dark); }
  .page-subtitle { font-size: 14px; color: #666; font-weight: 500; }
  .voice-query-tag {
    background: var(--green-pale); border: 1px solid #c8e6c9;
    color: var(--green-dark); padding: 8px 18px; border-radius: 25px;
    font-size: 14px; margin-left: auto; font-weight: 600;
  }

  /* ── DOCTOR CARDS ── */
  .doctor-card {
    background: white; border-radius: 25px; padding: 24px;
    display: flex; gap: 20px; align-items: flex-start;
    box-shadow: var(--shadow); margin-bottom: 15px;
    border-left: 4px solid transparent; transition: all 0.3s;
  }
  .doctor-card:hover { border-left-color: var(--red); transform: translateX(8px); box-shadow: var(--shadow-lg); }
  .doctor-avatar { 
    width: 70px; height: 70px; border-radius: 20px; 
    background: linear-gradient(135deg, #fce4ec, #f8bbd0); 
    display: flex; align-items: center; justify-content: center; 
    font-size: 32px; flex-shrink: 0; 
  }
  .doctor-info { flex: 1; }
  .doctor-name { font-size: 20px; font-weight: 700; color: var(--text); }
  .doctor-spec { font-size: 14px; color: #777; margin-top: 3px; }
  .doctor-experience { font-size: 13px; color: var(--green-dark); margin-top: 2px; }
  .doctor-meta { display: flex; gap: 15px; margin-top: 10px; flex-wrap: wrap; }
  .doctor-badge { 
    display: flex; align-items: center; gap: 5px; font-size: 13px; 
    color: #555; background: var(--gray); padding: 5px 15px; 
    border-radius: 25px; 
  }
  .available-dot { width: 10px; height: 10px; border-radius: 50%; }
  .available-dot.yes { background: var(--green-light); box-shadow: 0 0 0 2px rgba(76,175,80,0.2); }
  .available-dot.no  { background: #bbb; }
  .call-btn {
    background: var(--green-light); color: white; border: none;
    padding: 12px 24px; border-radius: 15px; cursor: pointer;
    font-family: inherit; font-weight: 700; font-size: 15px;
    white-space: nowrap; align-self: center; transition: all 0.2s;
  }
  .call-btn:hover { background: var(--green-dark); transform: scale(1.05); }

  /* ── SCHEME CARDS ── */
  .scheme-card {
    background: white; border-radius: 25px; padding: 24px;
    box-shadow: var(--shadow); margin-bottom: 15px;
    border-top: 4px solid var(--blue); transition: all 0.3s;
  }
  .scheme-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
  .scheme-header { display: flex; gap: 15px; align-items: flex-start; }
  .scheme-emoji { font-size: 40px; }
  .scheme-name { font-size: 18px; font-weight: 700; color: var(--text); }
  .scheme-benefit { font-size: 24px; font-weight: 800; color: var(--blue); margin: 5px 0; }
  .scheme-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 15px; }
  .scheme-field { background: var(--gray); border-radius: 12px; padding: 12px 15px; }
  .scheme-field-label { font-size: 11px; color: #888; font-weight: 600; text-transform: uppercase; }
  .scheme-field-value { font-size: 14px; color: var(--text); font-weight: 600; margin-top: 3px; }
  .apply-btn {
    width: 100%; margin-top: 15px; background: var(--blue); color: white;
    border: none; padding: 14px; border-radius: 15px; cursor: pointer;
    font-family: inherit; font-weight: 700; font-size: 16px;
    transition: all 0.2s;
  }
  .apply-btn:hover { background: #0d47a1; transform: translateY(-2px); }
  .apply-btn.applied { background: var(--gray-dark); cursor: default; }
  .apply-btn.applied:hover { transform: none; }

  /* ── PRODUCT CARDS ── */
  .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
  .product-card {
    background: white; border-radius: 25px; padding: 24px;
    box-shadow: var(--shadow); transition: all 0.3s;
    position: relative;
  }
  .product-card:hover { transform: translateY(-8px); box-shadow: var(--shadow-lg); }
  .product-emoji { font-size: 48px; margin-bottom: 15px; }
  .product-name { font-size: 18px; font-weight: 700; color: var(--text); }
  .product-brand { font-size: 13px; color: #888; margin-top: 3px; }
  .product-price { font-size: 26px; font-weight: 800; color: var(--green-dark); margin: 12px 0; }
  .product-unit { font-size: 13px; color: #999; font-weight: 400; }
  .product-footer { 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    margin-top: 15px;
    flex-wrap: wrap;
    gap: 10px;
  }
  .in-stock   { color: var(--green-light); font-size: 13px; font-weight: 700; }
  .out-stock  { color: #bbb; font-size: 13px; font-weight: 700; }
  
  .quantity-control {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--gray);
    padding: 5px 10px;
    border-radius: 25px;
  }
  .quantity-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: white;
    color: var(--green-dark);
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .quantity-btn:hover { background: var(--green-light); color: white; }
  .quantity-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .quantity-btn:disabled:hover { background: white; color: var(--green-dark); }
  .quantity-value {
    font-weight: 700;
    font-size: 16px;
    min-width: 25px;
    text-align: center;
  }
  
  .buy-btn {
    background: var(--green-light); color: white; border: none;
    padding: 10px 20px; border-radius: 12px; cursor: pointer;
    font-family: inherit; font-weight: 700; font-size: 14px;
    transition: all 0.2s;
    flex: 1;
  }
  .buy-btn:hover:not(:disabled) { background: var(--green-dark); transform: scale(1.05); }
  .buy-btn:disabled { background: #ddd; cursor: not-allowed; }
  .buy-btn.in-cart {
    background: var(--gold);
    color: var(--green-dark);
  }

  /* ── CART SIDEBAR ── */
  .cart-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 1000;
    display: flex;
    justify-content: flex-end;
    animation: fadeIn 0.3s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .cart-sidebar {
    width: 100%;
    max-width: 400px;
    background: white;
    height: 100%;
    padding: 24px;
    overflow-y: auto;
    animation: slideIn 0.3s ease;
    box-shadow: -5px 0 30px rgba(0,0,0,0.2);
  }
  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  .cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid var(--green-pale);
  }
  .cart-header h2 {
    font-size: 24px;
    color: var(--green-dark);
  }
  .close-cart {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    transition: all 0.2s;
  }
  .close-cart:hover { color: var(--red); transform: scale(1.1); }
  
  .cart-item {
    display: flex;
    gap: 15px;
    padding: 15px 0;
    border-bottom: 1px solid #eee;
  }
  .cart-item-emoji { font-size: 32px; }
  .cart-item-info { flex: 1; }
  .cart-item-name { font-weight: 700; font-size: 16px; }
  .cart-item-price { color: var(--green-dark); font-weight: 600; margin-top: 3px; }
  .cart-item-quantity {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
  }
  .cart-qty-btn {
    width: 25px;
    height: 25px;
    border-radius: 50%;
    border: none;
    background: var(--green-pale);
    color: var(--green-dark);
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }
  .cart-qty-btn:hover { background: var(--green-light); color: white; }
  .cart-qty-value { font-weight: 600; min-width: 20px; text-align: center; }
  .cart-item-total {
    font-weight: 700;
    color: var(--green-dark);
    margin-top: 5px;
  }
  .remove-item {
    background: none;
    border: none;
    color: var(--red);
    font-size: 14px;
    cursor: pointer;
    padding: 5px;
    border-radius: 5px;
  }
  .remove-item:hover { text-decoration: underline; }
  
  .cart-footer {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 2px solid var(--green-pale);
  }
  .cart-total {
    display: flex;
    justify-content: space-between;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 16px;
  }
  .checkout-btn {
    width: 100%;
    background: var(--green-light);
    color: white;
    border: none;
    padding: 15px;
    border-radius: 15px;
    font-weight: 700;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .checkout-btn:hover { background: var(--green-dark); transform: translateY(-2px); }
  .empty-cart {
    text-align: center;
    padding: 40px 20px;
    color: #999;
    font-size: 16px;
  }

  /* ── STAR RATING ── */
  .stars { color: var(--gold); font-size: 14px; }

  /* ── FOOTER ── */
  .footer {
    background: var(--green-dark); color: #a5d6a7;
    text-align: center; padding: 30px 20px;
    font-size: 14px; margin-top: 40px;
  }
  .footer strong { color: white; font-size: 16px; }

  /* ── TOAST NOTIFICATION ── */
  .toast {
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: var(--green-dark);
    color: white;
    padding: 15px 25px;
    border-radius: 15px;
    box-shadow: var(--shadow-lg);
    animation: slideUp 0.3s ease;
    z-index: 1100;
    max-width: 300px;
  }
  .toast.success { background: var(--green-dark); }
  .toast.error { background: var(--red); }

  /* ── RESPONSIVE ── */
  @media (max-width: 600px) {
    .cards-grid { grid-template-columns: 1fr; }
    .quick-card { padding: 20px; }
    .quick-card-icon { font-size: 40px; }
    .quick-card-title { font-size: 16px; }
    .mic-btn { width: 110px; height: 110px; font-size: 45px; }
    .products-grid { grid-template-columns: 1fr; }
    .scheme-grid { grid-template-columns: 1fr; }
    .nav-actions { gap: 5px; }
    .nav-btn { padding: 6px 12px; font-size: 12px; }
    .doctor-card { flex-direction: column; }
    .call-btn { align-self: stretch; text-align: center; }
    .cart-sidebar { max-width: 100%; }
    .toast { left: 20px; right: 20px; bottom: 20px; max-width: none; }
  }
`;

// ─── Stars component ───────────────────────────────────────────────────────────
function Stars({ n }) {
  return <span className="stars">{"★".repeat(Math.round(n))}{"☆".repeat(5 - Math.round(n))} {n}</span>;
}

// ─── Toast Notification Component ──────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      {type === 'success' ? '✅ ' : '❌ '}{message}
    </div>
  );
}

// ─── Doctor Page ───────────────────────────────────────────────────────────────
function DoctorPage({ onBack, query }) {
  return (
    <div className="page">
      <div className="page-header">
        <button className="page-back" onClick={onBack}>←</button>
        <div>
          <div className="page-title">🩺 Pashu Doctor</div>
          <div className="page-subtitle">Apne nere ke doctor se bat karein</div>
        </div>
        {query && <span className="voice-query-tag">🎤 "{query}"</span>}
      </div>

      {/* Emergency Banner */}
      <div style={{ background: "var(--red-light)", border: "2px solid #ef9a9a", borderRadius: 20, padding: "16px 20px", marginBottom: 25, display: "flex", gap: 15, alignItems: "center" }}>
        <span style={{ fontSize: 32 }}>🚨</span>
        <div>
          <div style={{ fontWeight: 700, color: "var(--red)", fontSize: 16 }}>Pashu Emergency?</div>
          <div style={{ fontSize: 14, color: "#555", marginTop: 3 }}>Helpline: <strong>1962</strong> (National Animal Disease Reporting System)</div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>Toll Free · 24x7 Available</div>
        </div>
      </div>

      {DOCTORS.map(d => (
        <div key={d.id} className="doctor-card">
          <div className="doctor-avatar">👨‍⚕️</div>
          <div className="doctor-info">
            <div className="doctor-name">{d.name}</div>
            <div className="doctor-spec">{d.spec}</div>
            <div className="doctor-experience">⭐ {d.experience} experience</div>
            <div className="doctor-meta">
              <span className="doctor-badge">📍 {d.district}</span>
              <span className="doctor-badge">🏥 {d.clinic}</span>
              <Stars n={d.rating} />
              <span className="doctor-badge">
                <span className={`available-dot ${d.available ? "yes" : "no"}`} />
                {d.available ? "Available Now" : "Busy"}
              </span>
            </div>
          </div>
          <button className="call-btn" onClick={() => alert(`📞 Calling ${d.name} at ${d.phone}`)}>
            📞 Call Now
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Schemes Page ──────────────────────────────────────────────────────────────
function SchemesPage({ onBack, query, onApplyScheme, appliedSchemes }) {
  return (
    <div className="page">
      <div className="page-header">
        <button className="page-back" onClick={onBack}>←</button>
        <div>
          <div className="page-title">📋 Sarkari Yojana</div>
          <div className="page-subtitle">Apke liye sarkari sahayata</div>
        </div>
        {query && <span className="voice-query-tag">🎤 "{query}"</span>}
      </div>

      {SCHEMES.map(s => {
        const isApplied = appliedSchemes.includes(s.id);
        return (
          <div key={s.id} className="scheme-card">
            <div className="scheme-header">
              <span className="scheme-emoji">{s.emoji}</span>
              <div>
                <div className="scheme-name">{s.name}</div>
                <div className="scheme-benefit">{s.benefit}</div>
              </div>
            </div>
            <div className="scheme-grid">
              <div className="scheme-field">
                <div className="scheme-field-label">Eligibility</div>
                <div className="scheme-field-value">{s.eligibility}</div>
              </div>
              <div className="scheme-field">
                <div className="scheme-field-label">Deadline</div>
                <div className="scheme-field-value">📅 {s.deadline}</div>
              </div>
            </div>
            <button 
              className={`apply-btn ${isApplied ? 'applied' : ''}`}
              onClick={() => !isApplied && onApplyScheme(s.id)}
              disabled={isApplied}
            >
              {isApplied ? '✅ Already Applied' : 'Apply Karein →'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Products Page with Cart Integration ───────────────────────────────────────
function ProductsPage({ onBack, query, cart, onAddToCart, onUpdateQuantity }) {
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    const initialQuantities = {};
    cart.forEach(item => {
      initialQuantities[item.id] = item.quantity;
    });
    setQuantities(initialQuantities);
  }, [cart]);

  const handleQuantityChange = (productId, change) => {
    setQuantities(prev => {
      const currentQty = prev[productId] || 1;
      const newQty = Math.max(1, currentQty + change);
      return { ...prev, [productId]: newQty };
    });
  };

  const handleAddToCart = (product) => {
    const qty = quantities[product.id] || 1;
    onAddToCart(product, qty);
  };

  const isInCart = (productId) => {
    return cart.some(item => item.id === productId);
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="page-back" onClick={onBack}>←</button>
        <div>
          <div className="page-title">🛒 Products & Feed</div>
          <div className="page-subtitle">Apke pashu ke liye best products</div>
        </div>
        {query && <span className="voice-query-tag">🎤 "{query}"</span>}
      </div>

      <div className="products-grid">
        {PRODUCTS.map(p => {
          const inCart = isInCart(p.id);
          const currentQty = quantities[p.id] || 1;
          
          return (
            <div key={p.id} className="product-card">
              <div className="product-emoji">{p.emoji}</div>
              <div className="product-name">{p.name}</div>
              <div className="product-brand">{p.brand}</div>
              <Stars n={p.rating} />
              <div className="product-price">
                ₹{p.price.toLocaleString('en-IN')} 
                <span className="product-unit"> / {p.unit}</span>
              </div>
              
              <div className="product-footer">
                <span className={p.inStock ? "in-stock" : "out-stock"}>
                  {p.inStock ? "✅ In Stock" : "❌ Out of Stock"}
                </span>
                
                {p.inStock && (
                  <div className="quantity-control">
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(p.id, -1)}
                      disabled={currentQty <= 1}
                    >−</button>
                    <span className="quantity-value">{currentQty}</span>
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(p.id, 1)}
                    >+</button>
                  </div>
                )}
                
                <button 
                  className={`buy-btn ${inCart ? 'in-cart' : ''}`}
                  disabled={!p.inStock}
                  onClick={() => handleAddToCart(p)}
                >
                  {inCart ? '✓ Added to Cart' : 'Add to Cart'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Cart Sidebar Component ────────────────────────────────────────────────────
function CartSidebar({ cart, onClose, onUpdateQuantity, onRemoveItem, onCheckout }) {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-sidebar" onClick={e => e.stopPropagation()}>
        <div className="cart-header">
          <h2>🛒 Your Cart</h2>
          <button className="close-cart" onClick={onClose}>✕</button>
        </div>
        
        {cart.length === 0 ? (
          <div className="empty-cart">
            <span style={{ fontSize: 48 }}>🛒</span>
            <p>Your cart is empty</p>
            <p style={{ fontSize: 14, color: '#aaa', marginTop: 10 }}>Add products to get started</p>
          </div>
        ) : (
          <>
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <span className="cart-item-emoji">{item.emoji}</span>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">₹{item.price}</div>
                  
                  <div className="cart-item-quantity">
                    <button 
                      className="cart-qty-btn"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    >−</button>
                    <span className="cart-qty-value">{item.quantity}</span>
                    <button 
                      className="cart-qty-btn"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    >+</button>
                    <button 
                      className="remove-item"
                      onClick={() => onRemoveItem(item.id)}
                    >Remove</button>
                  </div>
                  
                  <div className="cart-item-total">
                    Total: ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))}
            
            <div className="cart-footer">
              <div className="cart-total">
                <span>Total Amount:</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
              <button className="checkout-btn" onClick={() => onCheckout(total)}>
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [intentResult, setIntent] = useState(null);
  const [error, setError] = useState("");
  const [textInput, setTextInput] = useState("");
  const [voiceQuery, setVoiceQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [appliedSchemes, setAppliedSchemes] = useState([]);
  const [toast, setToast] = useState(null);
  
  const recognitionRef = useRef(null);
  const [recognitionSupported, setRecognitionSupported] = useState(true);

  // Check if speech recognition is supported
  useEffect(() => {
    const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setRecognitionSupported(supported);
    if (!supported) {
      setError("Aapka browser voice input support nahi karta. Text type karein ya Google Chrome use karein.");
    }
  }, []);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('agroSathiCart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
      const savedSchemes = localStorage.getItem('agroSathiSchemes');
      if (savedSchemes) {
        setAppliedSchemes(JSON.parse(savedSchemes));
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('agroSathiCart', JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }, [cart]);

  // Save schemes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('agroSathiSchemes', JSON.stringify(appliedSchemes));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }, [appliedSchemes]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const processTranscript = useCallback((text) => {
    if (!text || !text.trim()) return;
    const result = detectIntent(text);
    setIntent(result);
    setVoiceQuery(text);
    
    if (result.found) {
      showToast(`${result.label} mil gaya! Redirecting...`, 'success');
      setTimeout(() => setPage(result.route), 1200);
    } else {
      showToast("Samajh nahi aaya, phir se try karein", 'error');
    }
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionSupported) {
      setError("Aapka browser voice input support nahi karta. Google Chrome use karein.");
      showToast("Voice input not supported in this browser", 'error');
      return;
    }

    try {
      setError("");
      setIntent(null);
      setTranscript("");

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Configure recognition
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      
      // Try multiple language codes for better Hindi/Marathi support
      recognition.lang = 'hi-IN'; // Hindi
      
      // Alternative languages to try if hi-IN doesn't work well
      // recognition.lang = 'mr-IN'; // Marathi
      // recognition.lang = 'en-IN'; // Indian English

      recognition.onstart = () => {
        setListening(true);
        showToast("🎤 Sun raha hoon... boliye", 'success');
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);

        if (finalTranscript) {
          processTranscript(finalTranscript);
          recognition.stop(); // Stop after getting final result
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setListening(false);
        
        let errorMessage = '';
        switch(event.error) {
          case 'no-speech':
            errorMessage = "Kuch bola nahi. Phir se try karein.";
            break;
          case 'audio-capture':
            errorMessage = "Microphone nahi mila. Microphone connect karein.";
            break;
          case 'not-allowed':
            errorMessage = "Microphone ka access dijiye. Browser settings mein allow karein.";
            break;
          case 'network':
            errorMessage = "Network error. Internet connection check karein.";
            break;
          default:
            errorMessage = "Kuch galat hua. Phir se try karein.";
        }
        
        setError(errorMessage);
        showToast(errorMessage, 'error');
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setListening(false);
      setError("Speech recognition start karne mein problem hui.");
      showToast("Voice recognition failed to start", 'error');
    }
  }, [recognitionSupported, processTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    setListening(false);
  }, []);

  const handleMicClick = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    setTranscript(textInput);
    processTranscript(textInput);
    setTextInput("");
  };

  const navigate = (p, q = "") => {
    setPage(p);
    if (q) setVoiceQuery(q);
    setShowCart(false);
  };

  const goHome = () => {
    setPage("home");
    setIntent(null);
    setTranscript("");
    setError("");
    setVoiceQuery("");
    setShowCart(false);
  };

  // Cart Functions
  const addToCart = (product, quantity) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        showToast(`${product.name} quantity updated in cart`, 'success');
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        showToast(`${product.name} added to cart`, 'success');
        return [...prevCart, { ...product, quantity }];
      }
    });
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const item = prevCart.find(i => i.id === productId);
      if (item) {
        showToast(`${item.name} removed from cart`, 'success');
      }
      return prevCart.filter(item => item.id !== productId);
    });
  };

  const handleCheckout = (total) => {
    alert(`✅ Order placed successfully!\n\nTotal Amount: ₹${total.toLocaleString('en-IN')}\n\nThank you for shopping with Agro Sathi!`);
    setCart([]);
    setShowCart(false);
    showToast('Order placed successfully!', 'success');
  };

  const applyScheme = (schemeId) => {
    setAppliedSchemes(prev => [...prev, schemeId]);
    showToast('Scheme applied successfully!', 'success');
  };

  // Render Pages
  if (page === "doctor") {
    return (
      <>
        <style>{css}</style>
        <Nav 
          onHome={goHome} 
          onNav={navigate} 
          current={page} 
          cartCount={cart.length} 
          onCartClick={() => setShowCart(true)} 
        />
        <DoctorPage onBack={goHome} query={voiceQuery} />
        <Footer />
        {showCart && (
          <CartSidebar
            cart={cart}
            onClose={() => setShowCart(false)}
            onUpdateQuantity={updateCartQuantity}
            onRemoveItem={removeFromCart}
            onCheckout={handleCheckout}
          />
        )}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  if (page === "schemes") {
    return (
      <>
        <style>{css}</style>
        <Nav 
          onHome={goHome} 
          onNav={navigate} 
          current={page} 
          cartCount={cart.length} 
          onCartClick={() => setShowCart(true)} 
        />
        <SchemesPage 
          onBack={goHome} 
          query={voiceQuery} 
          onApplyScheme={applyScheme}
          appliedSchemes={appliedSchemes}
        />
        <Footer />
        {showCart && (
          <CartSidebar
            cart={cart}
            onClose={() => setShowCart(false)}
            onUpdateQuantity={updateCartQuantity}
            onRemoveItem={removeFromCart}
            onCheckout={handleCheckout}
          />
        )}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  if (page === "products") {
    return (
      <>
        <style>{css}</style>
        <Nav 
          onHome={goHome} 
          onNav={navigate} 
          current={page} 
          cartCount={cart.length} 
          onCartClick={() => setShowCart(true)} 
        />
        <ProductsPage 
          onBack={goHome} 
          query={voiceQuery} 
          cart={cart}
          onAddToCart={addToCart}
          onUpdateQuantity={updateCartQuantity}
        />
        <Footer />
        {showCart && (
          <CartSidebar
            cart={cart}
            onClose={() => setShowCart(false)}
            onUpdateQuantity={updateCartQuantity}
            onRemoveItem={removeFromCart}
            onCheckout={handleCheckout}
          />
        )}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  // Home Page
  return (
    <>
      <style>{css}</style>
      <Nav 
        onHome={goHome} 
        onNav={navigate} 
        current="home" 
        cartCount={cart.length} 
        onCartClick={() => setShowCart(true)} 
      />

      {/* Hero Section */}
      <div className="hero">
        <div className="hero-badge">🌾 AI-Powered · Voice First · Made for Rural India</div>
        <h1>Agro <span>Sathi</span> AI</h1>
        <p className="hero-tagline">"Bolo, Sathi Sunega" — बोलो, साथी सुनेगा</p>

        {/* Big Mic Button */}
        <div className="mic-wrapper">
          {listening && <><div className="mic-ripple" /><div className="mic-ripple" /><div className="mic-ripple" /></>}
          <button 
            className={`mic-btn ${listening ? "listening" : ""}`} 
            onClick={handleMicClick}
            disabled={!recognitionSupported}
          >
            {listening ? "⏹" : "🎤"}
          </button>
          <div className="mic-label">
            {listening ? "🔴 Sun raha hoon... (tap to stop)" : 
             recognitionSupported ? "Tap karein aur bolo" : "Voice not supported"}
          </div>
        </div>

        {/* Browser Warning */}
        {!recognitionSupported && (
          <div className="error-msg">
            ⚠️ Voice input sirf Google Chrome aur Microsoft Edge mein kaam karta hai. 
            Text input use karein.
          </div>
        )}

        {/* Transcript */}
        {(transcript || listening) && (
          <div className="transcript-box">
            <div className="transcript-label">🎙️ Aapne kaha:</div>
            <div className="transcript-text">
              {transcript || <span style={{ opacity: 0.5 }}>Bol rahe hain...</span>}
              {listening && <span className="cursor" />}
            </div>
          </div>
        )}

        {/* Intent Result Banner */}
        {intentResult && (
          <div className={`intent-banner ${intentResult.found ? "success" : "error"}`}>
            <span className="intent-emoji">{intentResult.emoji}</span>
            <div className="intent-info">
              <div className="intent-title">
                {intentResult.found ? `${intentResult.label} mil gaya!` : "Samajh nahi aaya 🤔"}
              </div>
              <div className="intent-sub">
                {intentResult.found
                  ? `Confidence: ${intentResult.confidence}% · Redirecting...`
                  : "Phir se bolen ya neeche se choose karein"}
              </div>
              {intentResult.found && (
                <div className="confidence-bar">
                  <div className="confidence-fill" style={{ width: `${intentResult.confidence}%` }} />
                </div>
              )}
            </div>
            {intentResult.found && (
              <button className="intent-go-btn" onClick={() => navigate(intentResult.route, transcript)}>
                Jao →
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {error && <div className="error-msg">⚠️ {error}</div>}

        {/* Text Input Alternative */}
        <div className="text-input-wrap">
          <input
            className="text-input"
            placeholder="Ya yahan type karein... (text alternative)"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleTextSubmit()}
          />
          <button className="text-submit" onClick={handleTextSubmit}>→</button>
        </div>

        {/* Demo Chips */}
        <div className="demo-queries">
          {[
            { label: "Gaay ko bukhar hai", q: "Mere gaay ko bukhar hai" },
            { label: "Subsidy scheme batao", q: "Mujhe subsidy scheme batao" },
            { label: "Cattle feed kharidna", q: "Mujhe cattle feed kharidna hai" },
            { label: "Pashu doctor chahiye", q: "Mujhe pashu doctor chahiye" },
          ].map(({ label, q }) => (
            <button key={q} className="demo-chip" onClick={() => { setTranscript(q); processTranscript(q); }}>
              💬 {label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="quick-access">
        <h2>Seedha Jao 👇</h2>
        <div className="cards-grid">
          <div className="quick-card doctor" onClick={() => navigate("doctor")}>
            <div className="quick-card-icon">🩺</div>
            <div className="quick-card-title">Pashu Doctor</div>
            <div className="quick-card-sub">Vet dhundhein</div>
          </div>
          <div className="quick-card scheme" onClick={() => navigate("schemes")}>
            <div className="quick-card-icon">📋</div>
            <div className="quick-card-title">Sarkari Yojana</div>
            <div className="quick-card-sub">Subsidy & Schemes</div>
          </div>
          <div className="quick-card product" onClick={() => navigate("products")}>
            <div className="quick-card-icon">🛒</div>
            <div className="quick-card-title">Products</div>
            <div className="quick-card-sub">Feed & Dawa</div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div style={{ background: "white", padding: "40px 20px", textAlign: "center" }}>
        <h2 style={{ color: "var(--green-dark)", fontSize: 24, fontWeight: 800, marginBottom: 30 }}>Kaise Kaam Karta Hai?</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap", maxWidth: 900, margin: "0 auto" }}>
          {[
            { step: "1", icon: "🎤", title: "Bolein", desc: "Mic dabao, apni baat bolein" },
            { step: "2", icon: "🧠", title: "AI Samjhe", desc: "Hindi/Marathi detect hoti hai" },
            { step: "3", icon: "⚡", title: "Seedha Jao", desc: "Automatically sahi page" },
            { step: "4", icon: "🛒", title: "Shop Karein", desc: "Products add to cart" },
          ].map(s => (
            <div key={s.step} style={{ flex: "1 1 200px", background: "var(--green-pale)", borderRadius: 25, padding: "24px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{s.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "var(--green-dark)" }}>{s.title}</div>
              <div style={{ fontSize: 14, color: "#666", marginTop: 6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <CartSidebar
          cart={cart}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={updateCartQuantity}
          onRemoveItem={removeFromCart}
          onCheckout={handleCheckout}
        />
      )}

      {/* Toast Notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Footer />
    </>
  );
}

// ─── Navigation Component with Cart ────────────────────────────────────────────
function Nav({ onHome, onNav, current, cartCount, onCartClick }) {
  return (
    <nav className="nav">
      <div className="nav-logo" onClick={onHome}>
        <span className="nav-logo-icon">🌾</span>
        <div>
          <div className="nav-logo-text">Agro Sathi AI</div>
          <div className="nav-logo-sub">बोलो, साथी सुनेगा</div>
        </div>
      </div>
      <div className="nav-actions">
        <button className={`nav-btn ${current === "doctor" ? "active" : ""}`} onClick={() => onNav("doctor")}>
          🩺 Doctor
        </button>
        <button className={`nav-btn ${current === "schemes" ? "active" : ""}`} onClick={() => onNav("schemes")}>
          📋 Yojana
        </button>
        <button className={`nav-btn ${current === "products" ? "active" : ""}`} onClick={() => onNav("products")}>
          🛒 Shop
        </button>
        <div className="cart-icon" onClick={onCartClick}>
          🛒
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </div>
      </div>
    </nav>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="footer">
      <strong>🌾 Agro Sathi AI</strong> · Built for Rural India · No Login Required<br />
      <span style={{ fontSize: 12, marginTop: 6, display: "block" }}>
        Voice First · Hindi & Marathi · Hackathon 2025
      </span>
      <span style={{ fontSize: 11, marginTop: 4, display: "block", opacity: 0.7 }}>
        Emergency: 1962 · Support: 1800-180-1551
      </span>
    </footer>
  );
}