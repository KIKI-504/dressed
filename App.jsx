import { useState, useRef, useEffect } from 'react'
import { supabase, supabaseAdmin } from './supabase.js'

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@300;400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream: #F7F4EF;
    --ink: #1A1916;
    --warm-mid: #8C8072;
    --accent: #C9A96E;
    --soft: #E8E2D9;
    --love: #C47A6A;
    --unsure: #8C9BAF;
  }

  body { background: var(--cream); font-family: 'Montserrat', sans-serif; color: var(--ink); }
  .app { min-height: 100vh; display: flex; flex-direction: column; }

  /* ── HEADER ── */
  .header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 28px 48px 20px; border-bottom: 1px solid var(--soft);
    position: sticky; top: 0; background: var(--cream); z-index: 100;
  }
  .logo {
    font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 300;
    letter-spacing: 0.18em; font-style: italic; color: var(--ink);
  }
  .logo span { color: var(--accent); }
  .header-nav { display: flex; gap: 32px; align-items: center; }
  .nav-btn {
    background: none; border: none; cursor: pointer; font-family: 'Montserrat', sans-serif;
    font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--warm-mid);
    padding: 4px 0; border-bottom: 1px solid transparent; transition: all 0.2s;
  }
  .nav-btn:hover, .nav-btn.active { color: var(--ink); border-bottom-color: var(--accent); }

  .main { flex: 1; }
  .inner-pad { padding: 0 48px 48px; }

  /* ── UPLOAD ── */
  .upload-section { padding: 48px 0 32px; }
  .upload-intro {
    font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-style: italic;
    color: var(--warm-mid); margin-bottom: 28px; line-height: 1.6;
  }

  .upload-toggle {
    display: flex; gap: 0; margin-bottom: 32px; border: 1px solid var(--soft);
    border-radius: 2px; overflow: hidden; width: fit-content;
  }
  .toggle-btn {
    padding: 10px 28px; background: transparent; border: none; cursor: pointer;
    font-family: 'Montserrat', sans-serif; font-size: 0.62rem; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--warm-mid); transition: all 0.2s;
  }
  .toggle-btn.active { background: var(--ink); color: var(--cream); }
  .toggle-btn:not(.active):hover { background: var(--soft); }

  .upload-area {
    border: 1px dashed var(--warm-mid); border-radius: 2px; padding: 56px 32px;
    text-align: center; cursor: pointer; transition: all 0.25s; position: relative;
    overflow: hidden; background: transparent;
  }
  .upload-area:hover { border-color: var(--accent); background: rgba(201,169,110,0.03); }
  .upload-icon { font-size: 1.8rem; margin-bottom: 12px; opacity: 0.4; }
  .upload-label {
    font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-style: italic;
    color: var(--warm-mid); display: block; margin-bottom: 6px;
  }
  .upload-sub { font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--warm-mid); opacity: 0.7; }
  .upload-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }

  .queue { margin-top: 32px; display: flex; flex-direction: column; gap: 12px; }
  .queue-item {
    display: flex; align-items: center; gap: 16px; background: white; padding: 12px 16px;
    border-radius: 2px; box-shadow: 0 1px 3px rgba(26,25,22,0.06);
  }
  .queue-thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 1px; flex-shrink: 0; }
  .queue-name { font-size: 0.62rem; color: var(--ink); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .queue-status { font-size: 0.58rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--warm-mid); flex-shrink: 0; }
  .queue-status.done { color: var(--accent); }
  .queue-status.processing { animation: pulse 1.4s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }

  /* ── CATEGORY PICKER MODAL ── */
  .cat-modal-backdrop {
    position: fixed; inset: 0; background: rgba(26,25,22,0.55);
    z-index: 500; display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(8px); animation: fadeIn 0.2s ease;
  }
  .cat-modal {
    background: var(--cream); padding: 48px 40px; border-radius: 2px;
    max-width: 440px; width: 90%; text-align: center;
    animation: slideUp 0.25s ease;
    box-shadow: 0 24px 64px rgba(26,25,22,0.18);
  }
  .cat-modal-thumb {
    width: 100px; height: 130px; object-fit: cover; border-radius: 1px;
    margin: 0 auto 24px; display: block;
    box-shadow: 0 4px 16px rgba(26,25,22,0.12);
  }
  .cat-modal-title {
    font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-style: italic;
    color: var(--ink); margin-bottom: 6px;
  }
  .cat-modal-sub {
    font-size: 0.58rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--warm-mid); margin-bottom: 28px;
  }
  .cat-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .cat-option {
    padding: 16px 12px; border: 1px solid var(--soft); background: transparent;
    cursor: pointer; font-family: 'Montserrat', sans-serif; font-size: 0.6rem;
    letter-spacing: 0.2em; text-transform: uppercase; color: var(--warm-mid);
    border-radius: 2px; transition: all 0.18s;
  }
  .cat-option:hover { border-color: var(--accent); color: var(--ink); background: rgba(201,169,110,0.06); }
  .cat-option.selected { background: var(--ink); color: var(--cream); border-color: var(--ink); }
  .cat-option-icon { font-size: 1.2rem; display: block; margin-bottom: 6px; }
  .cat-confirm-btn {
    margin-top: 20px; width: 100%; padding: 14px; background: var(--accent); color: white;
    border: none; cursor: pointer; font-family: 'Montserrat', sans-serif;
    font-size: 0.62rem; letter-spacing: 0.22em; text-transform: uppercase;
    border-radius: 2px; transition: background 0.2s;
  }
  .cat-confirm-btn:hover { background: var(--ink); }
  .cat-confirm-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── WARDROBE FILTERS ── */
  .filter-bar {
    display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
    padding: 24px 0 28px; border-bottom: 1px solid var(--soft); margin-bottom: 36px;
  }
  .filter-label { font-size: 0.58rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--warm-mid); margin-right: 4px; }
  .filter-tag {
    padding: 5px 14px; border-radius: 20px; font-size: 0.58rem; letter-spacing: 0.12em;
    text-transform: uppercase; cursor: pointer; border: 1px solid var(--soft);
    background: transparent; font-family: 'Montserrat', sans-serif; transition: all 0.18s; color: var(--warm-mid);
  }
  .filter-tag:hover { border-color: var(--warm-mid); color: var(--ink); }
  .filter-tag.active { background: var(--ink); color: var(--cream); border-color: var(--ink); }
  .search-input {
    margin-left: auto; padding: 6px 16px; border: 1px solid var(--soft); background: transparent;
    font-family: 'Montserrat', sans-serif; font-size: 0.62rem; letter-spacing: 0.1em; color: var(--ink);
    outline: none; border-radius: 20px; transition: border-color 0.2s; width: 180px;
  }
  .search-input:focus { border-color: var(--warm-mid); }
  .search-input::placeholder { color: var(--warm-mid); opacity: 0.6; }

  .category-tabs { display: flex; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; width: 100%; }
  .cat-tab {
    padding: 5px 14px; border-radius: 20px; border: 1px solid var(--soft);
    background: transparent; cursor: pointer; font-family: 'Montserrat', sans-serif;
    font-size: 0.58rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--warm-mid); transition: all 0.18s;
  }
  .cat-tab:hover { border-color: var(--warm-mid); color: var(--ink); }
  .cat-tab.active { background: var(--accent); color: white; border-color: var(--accent); }

  .category-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .cat-btn {
    padding: 5px 14px; border-radius: 20px; border: 1px solid var(--soft);
    background: transparent; cursor: pointer; font-family: 'Montserrat', sans-serif;
    font-size: 0.58rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--warm-mid); transition: all 0.18s;
  }
  .cat-btn:hover { border-color: var(--warm-mid); color: var(--ink); }
  .cat-btn.active { background: var(--accent); color: white; border-color: var(--accent); }

  /* ── OUTFIT GRID ── */
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 28px; }
  .card {
    background: white; border-radius: 2px; overflow: hidden; cursor: pointer;
    transition: transform 0.25s, box-shadow 0.25s; box-shadow: 0 1px 3px rgba(26,25,22,0.06);
  }
  .card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(26,25,22,0.1); }
  .card.inspiration { outline: 3px solid #e63946; }
  .card-img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; }
  .card-body { padding: 16px; }
  .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .card-date { font-size: 0.55rem; color: var(--warm-mid); opacity: 0.7; }
  .card-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 10px; }
  .tag {
    font-size: 0.5rem; letter-spacing: 0.12em; text-transform: uppercase;
    padding: 3px 8px; background: var(--soft); border-radius: 10px; color: var(--warm-mid);
  }
  .tag.cat-tag { background: var(--ink); color: var(--cream); }
  .card-note { font-size: 0.65rem; color: var(--warm-mid); font-style: italic; line-height: 1.5; margin-bottom: 8px; }
  .delete-btn {
    margin-top: 10px; padding: 4px 12px; font-size: 0.55rem; letter-spacing: 0.15em;
    text-transform: uppercase; background: none; border: 1px solid var(--soft);
    color: var(--warm-mid); cursor: pointer; border-radius: 2px; font-family: 'Montserrat', sans-serif; transition: all 0.18s;
  }
  .delete-btn:hover { border-color: var(--love); color: var(--love); }

  .add-tag-row { display: flex; gap: 8px; margin-top: 8px; width: 100%; }
  .tag-input {
    flex: 1; padding: 5px 10px; border: 1px solid var(--soft); background: white;
    font-family: 'Montserrat', sans-serif; font-size: 0.62rem; outline: none; border-radius: 2px; color: var(--ink);
  }
  .tag-input:focus { border-color: var(--warm-mid); }
  .add-tag-btn {
    padding: 5px 12px; background: var(--ink); color: var(--cream); border: none;
    cursor: pointer; font-size: 0.58rem; letter-spacing: 0.12em; text-transform: uppercase;
    border-radius: 2px; font-family: 'Montserrat', sans-serif;
  }

  /* ── STATS ── */
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding-top: 36px; }
  .stat-card { background: white; padding: 28px; border-radius: 2px; box-shadow: 0 1px 3px rgba(26,25,22,0.06); }
  .stat-title { font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--warm-mid); margin-bottom: 20px; }
  .stat-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .stat-bar-label { font-size: 0.62rem; color: var(--ink); width: 110px; flex-shrink: 0; text-transform: capitalize; }
  .stat-bar-track { flex: 1; height: 3px; background: var(--soft); border-radius: 2px; overflow: hidden; }
  .stat-bar-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.6s ease; }
  .stat-count { font-size: 0.6rem; color: var(--warm-mid); width: 24px; text-align: right; }
  .stat-big { font-family: 'Cormorant Garamond', serif; font-size: 3.5rem; font-weight: 300; color: var(--ink); }
  .stat-big-label { font-size: 0.58rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--warm-mid); margin-top: 4px; }

  /* ── OUTFIT DETAIL MODAL ── */
  .modal-backdrop {
    position: fixed; inset: 0; background: rgba(26,25,22,0.6); z-index: 300;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(6px); padding: 24px; animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal {
    background: var(--cream); max-width: 800px; width: 100%; border-radius: 2px;
    overflow: hidden; max-height: 90vh; display: grid; grid-template-columns: 1fr 1fr;
    animation: slideUp 0.25s ease;
  }
  @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
  .modal-img { width: 100%; height: 100%; object-fit: cover; min-height: 400px; display: block; }
  .modal-body { padding: 36px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; }
  .modal-header { display: flex; justify-content: space-between; align-items: flex-start; }
  .modal-date { font-size: 0.6rem; color: var(--warm-mid); opacity: 0.7; }
  .modal-close {
    background: none; border: none; cursor: pointer; font-size: 1.2rem;
    color: var(--warm-mid); line-height: 1; padding: 0; margin-left: auto; transition: color 0.2s;
  }
  .modal-close:hover { color: var(--ink); }
  .modal-section-label { font-size: 0.55rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--warm-mid); margin-bottom: 8px; }
  .modal-tags { display: flex; gap: 6px; flex-wrap: wrap; }
  .reaction-row { display: flex; gap: 10px; }
  .reaction-btn {
    flex: 1; padding: 10px; border-radius: 2px; border: 1px solid var(--soft);
    background: transparent; cursor: pointer; font-family: 'Montserrat', sans-serif;
    font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; transition: all 0.18s;
    display: flex; align-items: center; justify-content: center; gap: 6px; color: var(--warm-mid);
  }
  .reaction-btn.love.active { background: var(--love); color: white; border-color: var(--love); }
  .reaction-btn.unsure.active { background: var(--unsure); color: white; border-color: var(--unsure); }
  .reaction-btn:hover { border-color: var(--warm-mid); color: var(--ink); }
  .notes-input {
    width: 100%; border: 1px solid var(--soft); background: white; padding: 12px 14px;
    font-family: 'Montserrat', sans-serif; font-size: 0.65rem; color: var(--ink);
    resize: none; outline: none; border-radius: 2px; line-height: 1.6;
    transition: border-color 0.2s; min-height: 80px;
  }
  .notes-input:focus { border-color: var(--warm-mid); }
  .notes-input::placeholder { color: var(--warm-mid); opacity: 0.6; font-style: italic; }
  .save-btn {
    padding: 12px; background: var(--ink); color: var(--cream); border: none; cursor: pointer;
    font-family: 'Montserrat', sans-serif; font-size: 0.6rem; letter-spacing: 0.2em;
    text-transform: uppercase; border-radius: 2px; transition: background 0.2s; margin-top: auto;
  }
  .save-btn:hover { background: var(--warm-mid); }
  .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .empty { text-align: center; padding: 80px 32px; }
  .empty-title { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-style: italic; color: var(--warm-mid); margin-bottom: 8px; }
  .empty-sub { font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--warm-mid); opacity: 0.6; }
  .page-title {
    font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-weight: 300;
    letter-spacing: 0.3em; text-transform: uppercase; color: var(--warm-mid); padding: 32px 0 0;
  }
  .loading { text-align: center; padding: 80px 32px; }
  .loading-text {
    font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-style: italic;
    color: var(--warm-mid); animation: pulse 1.8s ease-in-out infinite;
  }

  /* ════════════════════════════════════════
     HOME PAGE
  ════════════════════════════════════════ */
  .home-page {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; padding: 52px 24px 80px;
  }
  .home-logo {
    font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 300;
    font-size: clamp(56px, 10vw, 88px); color: var(--ink);
    line-height: 1; text-align: center;
  }
  .home-logo-rule {
    display: block; width: 72px; height: 1px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    margin: 8px auto 0;
  }
  .home-tagline { font-size: 13px; letter-spacing: 0.12em; color: var(--warm-mid); margin-top: 14px; text-align: center; }
  .home-stats { margin-top: 16px; display: flex; align-items: center; gap: 16px; font-size: 12px; color: var(--warm-mid); }
  .home-looks-count span { color: var(--accent); font-weight: 500; }
  .home-upload-link {
    color: var(--accent); background: none; border: none; cursor: pointer;
    font-family: 'Montserrat', sans-serif; font-size: 12px; letter-spacing: 0.12em; padding: 0;
  }
  .home-upload-link:hover { color: var(--ink); }

  /* ── Door grid layout ── */
  .home-content {
    position: relative; width: 100%; max-width: 900px; margin-top: 36px;
    display: flex; align-items: center; gap: 0;
  }

  .door-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 18px;
    flex: 1;
  }

  /* ════════════════════════════════════════
     WARDROBE DOOR — realistic look
  ════════════════════════════════════════ */
  .door-wrapper {
    position: relative; aspect-ratio: 3/4; cursor: pointer; user-select: none;
  }

  /* ── Deep outer shadow — multiple layers for realism ── */
  .door-outer {
    position: absolute; inset: 0; border-radius: 6px;
    box-shadow:
      0 1px 2px rgba(30,20,10,0.20),
      0 4px 8px rgba(30,20,10,0.18),
      0 12px 28px rgba(30,20,10,0.16),
      0 28px 56px rgba(30,20,10,0.12),
      0 0 0 1px rgba(140,110,60,0.18);
  }

  /* ── Wooden frame/casing ── */
  .door-frame {
    position: absolute; inset: 0; border-radius: 6px; z-index: 1;
    /* Rich oak/walnut wood grain simulation */
    background:
      repeating-linear-gradient(
        92deg,
        transparent 0px, transparent 18px,
        rgba(120,80,20,0.04) 18px, rgba(120,80,20,0.04) 19px,
        transparent 19px, transparent 36px,
        rgba(80,50,10,0.03) 36px, rgba(80,50,10,0.03) 37px
      ),
      repeating-linear-gradient(
        178deg,
        transparent 0px, transparent 80px,
        rgba(100,65,15,0.025) 80px, rgba(100,65,15,0.025) 81px
      ),
      linear-gradient(168deg,
        #EDE0C4 0%,
        #DDD0A8 5%,
        #CEC098 10%,
        #D8CAA4 18%,
        #E4D8B8 28%,
        #EAE0C4 38%,
        #E0D4B0 50%,
        #D4C6A0 62%,
        #C8BA90 72%,
        #D0C4A0 82%,
        #DED2B2 90%,
        #E6DCC0 100%
      );
  }
  /* Top highlight bevel */
  .door-frame::before {
    content: ''; position: absolute; inset: 0; border-radius: 6px;
    background:
      linear-gradient(180deg,
        rgba(255,255,255,0.55) 0%,
        rgba(255,255,255,0.15) 6%,
        transparent 18%
      ),
      linear-gradient(90deg,
        rgba(255,255,255,0.25) 0%,
        transparent 10%,
        transparent 90%,
        rgba(0,0,0,0.12) 100%
      );
  }
  /* Inner shadow for depth + border definition */
  .door-frame::after {
    content: ''; position: absolute; inset: 0; border-radius: 6px;
    box-shadow:
      inset 4px 4px 8px rgba(255,255,255,0.4),
      inset -4px -4px 8px rgba(0,0,0,0.14),
      inset 0 0 0 1.5px rgba(160,130,80,0.35),
      inset 0 0 0 3px rgba(200,170,110,0.10);
  }

  /* ── Hinges ── */
  .hinge {
    position: absolute; left: 11px; width: 15px; height: 30px; z-index: 3;
    background: linear-gradient(180deg,
      #F4E498 0%, #D8B458 15%, #B89040 35%,
      #CAA848 50%, #D8B85A 65%, #C2A040 82%, #A88030 100%
    );
    border-radius: 3px;
    box-shadow:
      1px 0 0 rgba(255,255,255,0.5),
      2px 2px 6px rgba(0,0,0,0.35),
      inset 0 1px 0 rgba(255,255,255,0.55),
      inset 0 -1px 0 rgba(0,0,0,0.25),
      inset 1px 0 0 rgba(255,255,255,0.2),
      inset -1px 0 0 rgba(0,0,0,0.15);
  }
  .hinge::before {
    content: ''; position: absolute; top: 50%; left: 50%;
    transform: translate(-50%,-50%); width: 7px; height: 7px; border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #D8B040, #7A5A10);
    box-shadow: 0 1px 3px rgba(0,0,0,0.6), inset 0 0 2px rgba(0,0,0,0.4);
  }
  .hinge::after {
    content: ''; position: absolute; top: 5px; left: 50%;
    transform: translateX(-50%); width: 3px; height: 3px; border-radius: 50%;
    background: radial-gradient(circle, #C09030, #6A4A10);
    box-shadow: 0 14px 0 rgba(90,60,10,0.85);
  }
  .hinge-top { top: 16%; }
  .hinge-bottom { bottom: 16%; }

  /* ── Dark interior ── */
  .door-interior {
    position: absolute; inset: 16px; border-radius: 3px;
    overflow: hidden; z-index: 2;
  }
  .interior-business    { background: linear-gradient(170deg, #0e0e20 0%, #181630 60%, #0c0c1c 100%); }
  .interior-casual      { background: linear-gradient(170deg, #0c1828 0%, #142038 60%, #0a1220 100%); }
  .interior-party       { background: linear-gradient(170deg, #140818 0%, #1e0c28 60%, #0e0610 100%); }
  .interior-inspiration { background: linear-gradient(170deg, #141008 0%, #1e1810 60%, #100c06 100%); }

  .door-interior::before {
    content: ''; position: absolute;
    top: 0; left: 10%; right: 10%; height: 40%;
    background: radial-gradient(ellipse at 50% 0%, rgba(255,240,200,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .interior-content {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding-bottom: 10px;
  }

  /* ── Clothing items (unchanged) ── */
  .blazer-hanger { display: flex; flex-direction: column; align-items: center; width: 58%; }
  .hanger-hook { width: 2px; height: 20px; background: linear-gradient(180deg, #E0C070, #A08040); }
  .hanger-shoulders {
    width: 100%; height: 3px; position: relative;
    background: linear-gradient(90deg, transparent, #C8A050 20%, #E0C070 50%, #C8A050 80%, transparent);
    border-radius: 2px;
  }
  .blazer-body {
    width: 92%; height: 78px;
    background: linear-gradient(175deg, #1C1C50 0%, #14143A 50%, #0C0C28 100%);
    border-radius: 2px 2px 12px 12px; margin-top: 1px; position: relative;
    box-shadow: -8px 8px 24px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.5);
  }
  .blazer-lapel-l {
    position: absolute; top: 0; left: 0; width: 40%; height: 44px;
    background: linear-gradient(140deg, #242468 0%, #1a1a4e 60%, #121236 100%);
    clip-path: polygon(0 0, 100% 0, 58% 100%, 0 80%);
  }
  .blazer-lapel-r {
    position: absolute; top: 0; right: 0; width: 40%; height: 44px;
    background: linear-gradient(220deg, #242468 0%, #1a1a4e 60%, #121236 100%);
    clip-path: polygon(0 0, 100% 0, 100% 80%, 42% 100%);
  }
  .blazer-btn {
    position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
    width: 5px; height: 5px; border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #E0C070, #908030);
    box-shadow: 0 0 5px rgba(200,160,50,0.5);
  }

  .casual-items { display: flex; flex-direction: column; align-items: center; gap: 12px; width: 68%; }
  .denim-fold {
    width: 100%; height: 50px;
    background: linear-gradient(175deg, #5070A8 0%, #3C5888 40%, #283E6C 100%);
    border-radius: 4px; position: relative; overflow: hidden;
    box-shadow: 0 6px 18px rgba(0,0,0,0.6);
  }
  .denim-fold::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 10px;
    background: linear-gradient(180deg, rgba(255,255,255,0.2), transparent);
  }
  .denim-fold::after {
    content: ''; position: absolute; bottom: 0; left: 15%; right: 15%; height: 1px;
    background: rgba(255,255,255,0.12);
  }
  .sneaker-pair { display: flex; gap: 8px; width: 88%; }
  .sneaker {
    flex: 1; height: 20px;
    background: linear-gradient(155deg, #F8F4EE 0%, #EAE6DF 60%, #DDD8D0 100%);
    border-radius: 22px 22px 4px 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.45);
    position: relative;
  }
  .sneaker::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px;
    background: rgba(0,0,0,0.12); border-radius: 0 0 4px 4px;
  }

  .party-items { display: flex; flex-direction: column; align-items: center; gap: 14px; width: 66%; }
  .sequin-dress {
    width: 100%; height: 60px;
    background: linear-gradient(145deg, #5A0830 0%, #8C1040 30%, #6A0C38 60%, #A01848 100%);
    border-radius: 4px; position: relative; overflow: hidden;
    box-shadow: 0 6px 22px rgba(140,16,64,0.6), 0 0 40px rgba(160,24,72,0.2);
  }
  .sequin-dress::before {
    content: ''; position: absolute; inset: 0;
    background:
      radial-gradient(circle at 20% 30%, rgba(255,210,80,0.25) 0%, transparent 25%),
      radial-gradient(circle at 70% 60%, rgba(255,180,60,0.2) 0%, transparent 25%),
      radial-gradient(circle at 50% 80%, rgba(255,200,100,0.15) 0%, transparent 30%),
      repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,200,80,0.08) 2px, rgba(255,200,80,0.08) 3px);
  }
  .sequin-shimmer {
    position: absolute; inset: 0;
    background: linear-gradient(110deg, transparent 15%, rgba(255,255,255,0.5) 50%, transparent 85%);
    animation: shimmer 2.8s ease-in-out infinite;
  }
  @keyframes shimmer { 0%,100%{transform:translateX(-140%) skewX(-10deg)} 60%{transform:translateX(140%) skewX(-10deg)} }
  .heel-pair { display: flex; gap: 12px; align-items: flex-end; }
  .heel { position: relative; width: 24px; height: 36px; }
  .heel-upper {
    position: absolute; top: 0; left: 0; right: 0; height: 20px;
    background: linear-gradient(135deg, #B89070 0%, #8A6848 60%, #9A7858 100%);
    border-radius: 8px 12px 0 0;
    box-shadow: 0 3px 10px rgba(0,0,0,0.5);
  }
  .heel-stem {
    position: absolute; bottom: 0; right: 6px; width: 4px; height: 20px;
    background: linear-gradient(180deg, #8A6848, #4A3020);
    border-radius: 0 0 3px 3px;
    box-shadow: 1px 0 4px rgba(0,0,0,0.4);
  }

  .moodboard { width: 78%; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .pin-card {
    height: 38px; border-radius: 2px; position: relative;
    box-shadow: 1px 3px 10px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3);
  }
  .pin-card::after {
    content: ''; position: absolute; top: 3px; left: 50%; transform: translateX(-50%);
    width: 7px; height: 7px; border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #F8E090, #C8A040);
    box-shadow: 0 1px 4px rgba(0,0,0,0.5), 0 0 6px rgba(200,160,40,0.6);
    z-index: 2;
  }
  .pin-1 { background: linear-gradient(135deg, #E0D0B0, #C8B890); }
  .pin-2 { background: linear-gradient(135deg, #B0C0D4, #8898B8); }
  .pin-3 { background: linear-gradient(135deg, #D0B8A4, #B89880); }
  .pin-4 { background: linear-gradient(135deg, #C0D0B0, #A0B890); }

  /* ════════════════════════════════════════
     DOOR PANELS — realistic linen + recessed
  ════════════════════════════════════════ */
  .door-panels {
    position: absolute; inset: 16px; z-index: 3; border-radius: 3px;
    display: flex;
  }

  .door-panel {
    position: absolute; top: 0; height: 100%; width: 50%;
    transition: transform 0.78s cubic-bezier(0.4, 0, 0.15, 1);
    will-change: transform;
    /* Layered linen: base warm linen colour + fine weave + cross-grain */
    background:
      repeating-linear-gradient(
        0deg,
        transparent 0px, transparent 2px,
        rgba(100,75,40,0.028) 2px, rgba(100,75,40,0.028) 3px,
        transparent 3px, transparent 5px,
        rgba(120,90,50,0.018) 5px, rgba(120,90,50,0.018) 6px
      ),
      repeating-linear-gradient(
        90deg,
        transparent 0px, transparent 2px,
        rgba(100,75,40,0.022) 2px, rgba(100,75,40,0.022) 3px,
        transparent 3px, transparent 5px,
        rgba(80,60,30,0.015) 5px, rgba(80,60,30,0.015) 6px
      ),
      linear-gradient(168deg,
        #EDE4D0 0%,
        #E4DABC 15%,
        #DDD2B4 30%,
        #D8CDB0 45%,
        #E0D6BC 60%,
        #E6DEC8 75%,
        #DDD4B8 88%,
        #D4CAA8 100%
      );
  }

  /* Recessed panel inset — the key realism detail */
  .door-panel::before {
    content: ''; position: absolute; pointer-events: none;
    /* Outer recess border */
    top: 12%; left: 10%; right: 10%; bottom: 12%;
    border-radius: 2px;
    box-shadow:
      /* Deep inset shadow top-left (light comes from top-right) */
      inset 2px 2px 5px rgba(60,40,10,0.22),
      inset 1px 1px 2px rgba(40,25,5,0.18),
      /* Bright highlight bottom-right */
      inset -2px -2px 4px rgba(255,248,220,0.45),
      inset -1px -1px 2px rgba(255,245,210,0.3),
      /* Outer border of the recess */
      0 0 0 1px rgba(160,130,80,0.22),
      /* Subtle outer highlight above recess */
      0 -1px 0 rgba(255,250,230,0.5);
  }

  /* Second recessed panel (inner, smaller) for double-panel door look */
  .door-panel::after {
    content: ''; position: absolute; pointer-events: none;
    top: 20%; left: 18%; right: 18%; bottom: 20%;
    border-radius: 1px;
    box-shadow:
      inset 1px 1px 3px rgba(60,40,10,0.16),
      inset -1px -1px 3px rgba(255,248,220,0.35),
      0 0 0 1px rgba(170,140,90,0.16);
  }

  .door-panel-left {
    left: 0; transform-origin: left center;
    transform: none;
    box-shadow:
      inset -10px 0 18px rgba(20,12,4,0.18),
      inset -2px 0 4px rgba(0,0,0,0.12),
      /* Right edge seam line */
      inset -1px 0 0 rgba(80,55,20,0.3);
  }
  .door-panel-right {
    right: 0; transform-origin: right center;
    transform: none;
    box-shadow:
      inset 10px 0 18px rgba(20,12,4,0.18),
      inset 2px 0 4px rgba(0,0,0,0.12),
      /* Left edge seam line */
      inset 1px 0 0 rgba(80,55,20,0.3);
  }

  /* Top edge highlight on both panels */
  .door-panel-left::before, .door-panel-right::before {
    /* Reuse ::before for recessed panel — top bevel handled by panel bg */
  }

  /* Open state */
  .door-wrapper.open .door-panel-left  { transform: perspective(1000px) rotateY(-30deg); }
  .door-wrapper.open .door-panel-right { transform: perspective(1000px) rotateY(30deg); }

  /* ── Category label ── */
  .door-label {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: clamp(9px, 1.6vw, 12px); letter-spacing: 0.34em;
    color: rgba(50,35,15,0.52);
    z-index: 4; pointer-events: none;
    text-transform: uppercase; font-weight: 400;
    transition: opacity 0.3s ease;
    /* Subtle text shadow for embossed feel */
    text-shadow: 0 1px 0 rgba(255,248,220,0.6), 0 -1px 0 rgba(40,25,5,0.15);
  }
  .door-wrapper.open .door-label { opacity: 0; }

  /* ── Brass lever handles ── */
  .door-handle { position: absolute; top: 50%; z-index: 5; }
  .handle-left  { right: 6px; transform: translateY(-50%); }
  .handle-right { left: 6px;  transform: translateY(-50%); }

  .lever { display: flex; flex-direction: column; align-items: center; }
  .lever-rose {
    width: 14px; height: 9px;
    background: linear-gradient(180deg,
      #F8E898 0%, #E0C060 30%, #C8A040 60%, #B89030 100%
    );
    border-radius: 3px 3px 1px 1px;
    box-shadow:
      0 -1px 0 rgba(255,255,255,0.5),
      0 2px 5px rgba(0,0,0,0.35),
      inset 0 1px 0 rgba(255,255,255,0.5),
      inset 1px 0 0 rgba(255,255,255,0.2),
      inset -1px 0 0 rgba(0,0,0,0.15);
  }
  .lever-shaft {
    width: 7px; height: 30px;
    background: linear-gradient(90deg,
      #906820 0%,
      #C8A040 20%,
      #F0D870 45%,
      #E0C058 55%,
      #C0A038 78%,
      #906820 100%
    );
    border-radius: 1px;
    box-shadow:
      2px 0 4px rgba(0,0,0,0.28),
      -1px 0 2px rgba(255,255,255,0.15),
      inset 0 0 0 0.5px rgba(255,255,255,0.1);
  }
  .lever-end {
    width: 16px; height: 7px;
    background: linear-gradient(180deg,
      #C8A040 0%, #F0D870 40%, #E0C058 70%, #C0A038 100%
    );
    border-radius: 4px;
    box-shadow:
      0 3px 6px rgba(0,0,0,0.38),
      0 1px 0 rgba(255,255,255,0.25),
      inset 0 1px 0 rgba(255,255,255,0.3);
  }

  /* ── Tap hint ── */
  .door-hint {
    position: absolute; bottom: 16px; left: 0; right: 0; z-index: 6;
    pointer-events: none; text-align: center;
    font-size: 7px; letter-spacing: 0.25em; text-transform: uppercase;
    color: rgba(255,255,255,0.28);
    opacity: 0; transition: opacity 0.35s ease 0.6s;
  }
  .door-wrapper.open .door-hint { opacity: 1; }

  /* ════════════════════════════════════════
     SCRAPBOOK — floats RIGHT of grid
  ════════════════════════════════════════ */
  .scrapbook-zone {
    width: 200px; flex-shrink: 0;
    display: flex; flex-direction: column; align-items: center;
    margin-left: 28px;
  }
  .polaroid-stack { position: relative; width: 160px; height: 210px; }
  .polaroid {
    position: absolute; background: white; padding: 7px 7px 22px;
    box-shadow: 2px 4px 16px rgba(44,36,32,0.22), 0 1px 3px rgba(0,0,0,0.1);
  }
  .polaroid-1 { width: 92px; height: 112px; bottom: 30px; left: 0; transform: rotate(-9deg); }
  .polaroid-2 { width: 84px; height: 102px; bottom: 52px; left: 30px; transform: rotate(5deg); z-index: 2; }
  .polaroid-3 { width: 88px; height: 108px; bottom: 20px; right: 0; transform: rotate(-3deg); z-index: 1; }
  .pol-img { width: 100%; height: 72%; }
  .pol-img-1 { background: linear-gradient(135deg, #D8C8A8, #C0B088); }
  .pol-img-2 { background: linear-gradient(135deg, #A8B8CC, #8898B8); }
  .pol-img-3 { background: linear-gradient(135deg, #CCB8A4, #B0988A); }
  .pol-cap { font-size: 7px; color: var(--warm-mid); text-align: center; margin-top: 3px; font-style: italic; }

  /* Camera widget */
  .scrapbook-cam { margin-top: 12px; transform: rotate(4deg); width: 160px; }

  .scrapbook-text { text-align: center; margin-top: 14px; }
  .fim-label {
    font-size: 7px; letter-spacing: 0.28em; color: var(--warm-mid);
    text-transform: uppercase; display: block; font-weight: 300;
  }
  .fim-sub {
    font-size: 12px; color: var(--accent); display: block; margin-top: 3px;
    font-style: italic; font-family: 'Cormorant Garamond', serif;
  }

  /* ════════════════════════════════════════
     RECENT LOOKS
  ════════════════════════════════════════ */
  .recent-strip { width: 100%; max-width: 800px; margin: 64px auto 0; }
  .recent-label {
    font-size: 10px; letter-spacing: 0.35em; color: var(--accent);
    text-transform: uppercase; font-weight: 300; margin-bottom: 16px;
    display: flex; align-items: center; gap: 14px;
  }
  .recent-label::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, var(--soft), transparent); }
  .editorial-grid { display: grid; grid-template-columns: 1.8fr 1fr; grid-template-rows: auto auto; gap: 10px; }
  .look-card { position: relative; overflow: hidden; border-radius: 2px; cursor: pointer; background: var(--soft); }
  .look-card-main { grid-row: span 2; aspect-ratio: 2/3; }
  .look-card-sm { aspect-ratio: 3/4; }
  .look-card img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.6s cubic-bezier(0.4,0,0.2,1); }
  .look-card:hover img { transform: scale(1.04); }
  .look-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 50%, rgba(26,25,22,0.5) 100%); opacity: 0; transition: opacity 0.4s; }
  .look-card:hover .look-overlay { opacity: 1; }
  .look-meta { position: absolute; bottom: 10px; left: 12px; right: 12px; opacity: 0; transform: translateY(4px); transition: all 0.4s; }
  .look-card:hover .look-meta { opacity: 1; transform: translateY(0); }
  .look-tag-pill { font-size: 8px; letter-spacing: 0.15em; text-transform: uppercase; background: rgba(255,255,255,0.15); backdrop-filter: blur(4px); padding: 3px 7px; border-radius: 20px; color: rgba(255,255,255,0.9); border: 1px solid rgba(255,255,255,0.2); margin-right: 4px; }

  @media (max-width: 640px) {
    .header { padding: 20px 20px 16px; }
    .inner-pad { padding: 0 20px 40px; }
    .modal { grid-template-columns: 1fr; }
    .modal-img { min-height: 240px; }
    .stats-grid { grid-template-columns: 1fr; }
    .header-nav { gap: 16px; }
    .door-grid { gap: 12px; }
    .scrapbook-zone { display: none; }
  }
`

/* ── helpers ── */
function getTagFrequency(outfits) {
  const freq = {}
  outfits.forEach(o => (o.tags || []).forEach(t => { freq[t] = (freq[t] || 0) + 1 }))
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10)
}

const MAX_BYTES = 4.5 * 1024 * 1024
const MAX_DIM   = 1500

async function compressImage(file) {
  if (file.size <= MAX_BYTES) return file
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > height) { if (width > MAX_DIM)  { height = Math.round(height * MAX_DIM / width); width = MAX_DIM } }
      else                { if (height > MAX_DIM) { width  = Math.round(width * MAX_DIM / height); height = MAX_DIM } }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.82)
    }
    img.src = url
  })
}

/* ── Camera SVG — bigger, more realistic ── */
function CameraSVG() {
  return (
    <svg viewBox="0 0 220 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'auto'}}>
      <defs>
        <linearGradient id="camBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F2EDE2"/>
          <stop offset="35%" stopColor="#E8E0D0"/>
          <stop offset="100%" stopColor="#C8BEA8"/>
        </linearGradient>
        <linearGradient id="camTop" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E4DCC8"/>
          <stop offset="100%" stopColor="#CCC0A4"/>
        </linearGradient>
        <linearGradient id="lensBarrel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E0C868"/>
          <stop offset="25%" stopColor="#C8A840"/>
          <stop offset="50%" stopColor="#B09030"/>
          <stop offset="75%" stopColor="#C8A840"/>
          <stop offset="100%" stopColor="#E0C868"/>
        </linearGradient>
        <linearGradient id="lensGlass" x1="25%" y1="20%" x2="75%" y2="80%">
          <stop offset="0%" stopColor="#3A3A50"/>
          <stop offset="25%" stopColor="#181828"/>
          <stop offset="60%" stopColor="#0A0A16"/>
          <stop offset="100%" stopColor="#222238"/>
        </linearGradient>
        <radialGradient id="lensGlow" cx="38%" cy="32%" r="55%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.38)"/>
          <stop offset="45%" stopColor="rgba(255,255,255,0.06)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
        <linearGradient id="shutterBtn" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E8C860"/>
          <stop offset="50%" stopColor="#C0A040"/>
          <stop offset="100%" stopColor="#A08030"/>
        </linearGradient>
        <filter id="bodyShadow" x="-5%" y="-5%" width="115%" height="120%">
          <feDropShadow dx="2" dy="5" stdDeviation="7" floodOpacity="0.32"/>
        </filter>
        <filter id="lensShadow">
          <feDropShadow dx="1" dy="2" stdDeviation="4" floodOpacity="0.45"/>
        </filter>
      </defs>

      {/* ── Main camera body ── */}
      <rect x="8" y="32" width="204" height="104" rx="10" ry="10"
        fill="url(#camBody)" filter="url(#bodyShadow)"/>

      {/* Body top ridge — slightly darker */}
      <rect x="8" y="32" width="204" height="18" rx="10" ry="10" fill="url(#camTop)"/>
      <rect x="8" y="44" width="204" height="6" fill="url(#camTop)"/>

      {/* Subtle body texture line */}
      <rect x="8" y="118" width="204" height="1.5" rx="0.75" fill="rgba(100,75,35,0.12)"/>
      <rect x="8" y="50" width="204" height="1" rx="0.5" fill="rgba(255,255,255,0.35)"/>

      {/* ── Viewfinder bump ── */}
      <rect x="62" y="16" width="68" height="20" rx="6" ry="6" fill="#DDD6C0"/>
      <rect x="63" y="17" width="66" height="18" rx="5" ry="5" fill="#D4CCBA"/>
      {/* Viewfinder window */}
      <rect x="70" y="20" width="32" height="13" rx="2.5" fill="#1A1A28"/>
      <rect x="71" y="21" width="30" height="11" rx="2" fill="#0E0E1C"/>
      {/* Viewfinder glass sheen */}
      <rect x="72" y="22" width="12" height="4" rx="1" fill="rgba(255,255,255,0.22)"/>
      <rect x="85" y="25" width="6" height="2" rx="1" fill="rgba(255,255,255,0.1)"/>

      {/* ── Flash unit ── */}
      <rect x="112" y="18" width="30" height="18" rx="4" fill="#E8E2D4"/>
      <rect x="113" y="19" width="28" height="16" rx="3" fill="#EEF4FF"/>
      <rect x="114" y="20" width="14" height="7" rx="1.5" fill="rgba(255,255,248,0.9)"/>
      {/* Flash reflection */}
      <rect x="115" y="21" width="5" height="2" rx="1" fill="rgba(255,255,255,0.7)"/>

      {/* ── Strap lugs ── */}
      <rect x="5" y="50" width="9" height="16" rx="3" fill="#BEB4A0"/>
      <rect x="6" y="51" width="7" height="14" rx="2" fill="#B0A698"/>
      <rect x="206" y="50" width="9" height="16" rx="3" fill="#BEB4A0"/>
      <rect x="207" y="51" width="7" height="14" rx="2" fill="#B0A698"/>

      {/* ── Lens barrel — outermost gold ring ── */}
      <circle cx="84" cy="88" r="50" fill="url(#lensBarrel)" filter="url(#lensShadow)"/>
      {/* Lens barrel grooves */}
      <circle cx="84" cy="88" r="50" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
      <circle cx="84" cy="88" r="47" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1"/>
      <circle cx="84" cy="88" r="44" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8"/>

      {/* Lens dark barrel body */}
      <circle cx="84" cy="88" r="41" fill="#201C18"/>
      {/* Inner gold ring */}
      <circle cx="84" cy="88" r="38" fill="none" stroke="#D4B050" strokeWidth="1.5"/>
      <circle cx="84" cy="88" r="36" fill="none" stroke="rgba(200,160,60,0.4)" strokeWidth="0.6"/>

      {/* Lens glass element */}
      <circle cx="84" cy="88" r="34" fill="url(#lensGlass)"/>
      {/* Inner aperture rings */}
      <circle cx="84" cy="88" r="28" fill="none" stroke="rgba(180,160,100,0.25)" strokeWidth="1"/>
      <circle cx="84" cy="88" r="22" fill="none" stroke="rgba(160,140,80,0.2)" strokeWidth="0.8"/>
      {/* Centre aperture */}
      <circle cx="84" cy="88" r="16" fill="#060610"/>
      {/* Lens coating glow */}
      <circle cx="84" cy="88" r="34" fill="url(#lensGlow)"/>
      {/* Main lens shine — large */}
      <ellipse cx="74" cy="77" rx="7" ry="5" fill="rgba(255,255,255,0.18)" transform="rotate(-25 74 77)"/>
      {/* Small secondary glint */}
      <circle cx="95" cy="99" rx="2.5" ry="2.5" fill="rgba(255,255,255,0.1)"/>
      <circle cx="72" cy="75" r="2" fill="rgba(255,255,255,0.35)"/>

      {/* ── Shutter button ── */}
      <circle cx="178" cy="40" r="11" fill="#C8BCA8"/>
      <circle cx="178" cy="40" r="8" fill="url(#shutterBtn)"/>
      <circle cx="178" cy="40" r="4.5" fill="#C8A848"/>
      {/* Shutter highlight */}
      <circle cx="175" cy="37" r="2" fill="rgba(255,255,255,0.3)"/>

      {/* ── Film advance knob ── */}
      <rect x="168" y="100" width="34" height="26" rx="5" fill="#C0B8A4"/>
      <rect x="170" y="102" width="30" height="22" rx="4" fill="#B4ACAA"/>
      {/* Knurl lines */}
      <line x1="174" y1="104" x2="186" y2="122" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5"/>
      <line x1="179" y1="103" x2="191" y2="121" stroke="rgba(0,0,0,0.10)" strokeWidth="1.5"/>
      <line x1="184" y1="103" x2="196" y2="121" stroke="rgba(0,0,0,0.10)" strokeWidth="1.5"/>
      <line x1="198" y1="104" x2="186" y2="122" stroke="rgba(0,0,0,0.10)" strokeWidth="1.5"/>

      {/* ── Brand label plate ── */}
      <rect x="138" y="74" width="52" height="12" rx="1.5" fill="rgba(160,140,100,0.15)"/>
      <text x="164" y="83" fontFamily="Georgia, serif" fontSize="7.5" fill="rgba(80,60,30,0.65)"
        textAnchor="middle" letterSpacing="1.5">dressed</text>

      {/* ── Mode dial (top right) ── */}
      <circle cx="192" cy="36" r="10" fill="#D0C8B4"/>
      <circle cx="192" cy="36" r="8" fill="#C4BCAA"/>
      <circle cx="192" cy="36" r="5" fill="#B8B0A0"/>
      <line x1="192" y1="28" x2="192" y2="31" stroke="rgba(80,60,30,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="192" y1="41" x2="192" y2="44" stroke="rgba(80,60,30,0.2)" strokeWidth="1" strokeLinecap="round"/>
      <line x1="184" y1="36" x2="187" y2="36" stroke="rgba(80,60,30,0.2)" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  )
}

/* ── Door component ── */
function Door({ id, label, interior, isOpen, onClick }) {
  return (
    <div className={`door-wrapper ${isOpen ? 'open' : ''}`} onClick={onClick}>
      <div className="door-outer"></div>
      <div className="door-frame">
        <div className="hinge hinge-top"></div>
        <div className="hinge hinge-bottom"></div>
      </div>
      <div className={`door-interior interior-${id}`}>
        <div className="interior-content">{interior}</div>
      </div>
      <div className="door-panels">
        <div className="door-panel door-panel-left">
          <div className="door-label">{label}</div>
          <div className="door-handle handle-left">
            <div className="lever">
              <div className="lever-rose"></div>
              <div className="lever-shaft"></div>
              <div className="lever-end"></div>
            </div>
          </div>
        </div>
        <div className="door-panel door-panel-right">
          <div className="door-handle handle-right">
            <div className="lever">
              <div className="lever-rose"></div>
              <div className="lever-shaft"></div>
              <div className="lever-end"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="door-hint">tap again to enter</div>
    </div>
  )
}

/* ── Category picker modal ── */
function CategoryPickerModal({ imagePreview, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(null)
  const cats = [
    { id: 'business',    icon: 'briefcase', label: 'Business' },
    { id: 'casual',      icon: 'sun',       label: 'Casual' },
    { id: 'party',       icon: 'star',      label: 'Party' },
    { id: 'inspiration', icon: 'heart',     label: 'Inspiration' },
  ]
  const icons = { briefcase: '💼', sun: '☀️', star: '✨', heart: '♡' }
  return (
    <div className="cat-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="cat-modal">
        {imagePreview && <img className="cat-modal-thumb" src={imagePreview} alt="" />}
        <div className="cat-modal-title">Where does this belong?</div>
        <div className="cat-modal-sub">Choose a wardrobe section</div>
        <div className="cat-options">
          {cats.map(c => (
            <button
              key={c.id}
              className={`cat-option ${selected === c.id ? 'selected' : ''}`}
              onClick={() => setSelected(c.id)}
            >
              <span className="cat-option-icon">{icons[c.icon]}</span>
              {c.label}
            </button>
          ))}
        </div>
        <button
          className="cat-confirm-btn"
          disabled={!selected}
          onClick={() => onConfirm(selected)}
        >
          Save to {selected ? selected.charAt(0).toUpperCase() + selected.slice(1) : 'Wardrobe'}
        </button>
      </div>
    </div>
  )
}

/* ── Home page ── */
function HomePage({ outfits, onDoorClick, onUploadClick }) {
  const [openDoor, setOpenDoor] = useState(null)
  const recentThree = outfits.slice(0, 3)

  function handleDoorClick(cat) {
    if (openDoor === cat) { onDoorClick(cat) }
    else { setOpenDoor(cat) }
  }

  return (
    <div className="home-page">
      <div className="home-logo">
        dressed
        <span className="home-logo-rule"></span>
      </div>
      <p className="home-tagline">Your personal wardrobe archive and styling lab</p>
      <div className="home-stats">
        <span className="home-looks-count"><span>{outfits.length}</span> looks archived</span>
        <span style={{ width:3, height:3, borderRadius:'50%', background:'#E8E2D9', display:'inline-block' }}></span>
        <button className="home-upload-link" onClick={onUploadClick}>+ Upload New Look</button>
      </div>

      {/* Grid + floating scrapbook */}
      <div className="home-content">
        <div className="door-grid">

          <Door id="business" label="Business" isOpen={openDoor === 'business'} onClick={() => handleDoorClick('business')} interior={
            <div className="blazer-hanger">
              <div className="hanger-hook"></div>
              <div className="hanger-shoulders"></div>
              <div className="blazer-body">
                <div className="blazer-lapel-l"></div>
                <div className="blazer-lapel-r"></div>
                <div className="blazer-btn"></div>
              </div>
            </div>
          } />

          <Door id="casual" label="Casual" isOpen={openDoor === 'casual'} onClick={() => handleDoorClick('casual')} interior={
            <div className="casual-items">
              <div className="denim-fold"></div>
              <div className="sneaker-pair">
                <div className="sneaker"></div>
                <div className="sneaker"></div>
              </div>
            </div>
          } />

          <Door id="party" label="Party" isOpen={openDoor === 'party'} onClick={() => handleDoorClick('party')} interior={
            <div className="party-items">
              <div className="sequin-dress"><div className="sequin-shimmer"></div></div>
              <div className="heel-pair">
                {[0,1].map(i => (
                  <div key={i} className="heel">
                    <div className="heel-upper"></div>
                    <div className="heel-stem"></div>
                  </div>
                ))}
              </div>
            </div>
          } />

          <Door id="inspiration" label="Inspiration" isOpen={openDoor === 'inspiration'} onClick={() => handleDoorClick('inspiration')} interior={
            <div className="moodboard">
              {['pin-1','pin-2','pin-3','pin-4'].map(c => <div key={c} className={`pin-card ${c}`}></div>)}
            </div>
          } />

        </div>

        {/* Scrapbook / camera widget */}
        <div className="scrapbook-zone">
          <div className="polaroid-stack">
            <div className="polaroid polaroid-1">
              <div className="pol-img pol-img-1"></div>
              <div className="pol-cap">summer fits</div>
            </div>
            <div className="polaroid polaroid-2">
              <div className="pol-img pol-img-2"></div>
              <div className="pol-cap">brunch look</div>
            </div>
            <div className="polaroid polaroid-3">
              <div className="pol-img pol-img-3"></div>
              <div className="pol-cap">night out</div>
            </div>
          </div>
          <div className="scrapbook-cam"><CameraSVG /></div>
          <div className="scrapbook-text">
            <span className="fim-label">Fashion in Motion</span>
            <span className="fim-sub">Upload moments with friends</span>
          </div>
        </div>

      </div>

      {/* Recent looks */}
      {recentThree.length > 0 && (
        <div className="recent-strip">
          <div className="recent-label">Recent Looks</div>
          <div className="editorial-grid">
            {recentThree.map((outfit, i) => (
              <div key={outfit.id} className={`look-card ${i === 0 ? 'look-card-main' : 'look-card-sm'}`} onClick={() => onDoorClick('all')}>
                <img src={outfit.image_url} alt="outfit" />
                <div className="look-overlay"></div>
                <div className="look-meta">
                  {(outfit.tags || []).slice(0, i === 0 ? 3 : 2).map(t => (
                    <span key={t} className="look-tag-pill">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════
   MAIN APP
════════════════════════════════════════ */
export default function App() {
  const [view, setView]                   = useState('home')
  const [outfits, setOutfits]             = useState([])
  const [loading, setLoading]             = useState(true)
  const [queue, setQueue]                 = useState([])
  const [selected, setSelected]           = useState(null)
  const [activeFilter, setActiveFilter]   = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch]               = useState('')
  const [modalNote, setModalNote]         = useState('')
  const [modalReaction, setModalReaction] = useState(null)
  const [saving, setSaving]               = useState(false)
  const [newTag, setNewTag]               = useState('')
  const [uploadMode, setUploadMode]       = useState('wardrobe')
  const [catPicker, setCatPicker]         = useState(null)

  const nextId = useRef(Date.now())
  const processingRef = useRef(false)

  useEffect(() => { loadOutfits() }, [])

  async function loadOutfits() {
    setLoading(true)
    const { data, error } = await supabase
      .from('outfits').select('*').order('created_at', { ascending: false })
    if (!error && data) setOutfits(data)
    setLoading(false)
  }

  useEffect(() => {
    const waiting = queue.find(q => q.status === 'waiting')
    if (!waiting || processingRef.current) return
    processItem(waiting)
  }, [queue])

  function askCategory(item) {
    return new Promise(resolve => setCatPicker({ item, resolve }))
  }

  async function processItem(item) {
    processingRef.current = true
    setQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'processing' } : i))
    try {
      const ext = item.file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      if (item.mode === 'memory') {
        const { error: upErr } = await supabaseAdmin.storage
          .from('outfit-memories').upload(path, item.file, { contentType: item.file.type })
        if (upErr) throw upErr
        setQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'done' } : i))
      } else {
        const { error: upErr } = await supabaseAdmin.storage
          .from('outfit-images').upload(path, item.file, { contentType: item.file.type })
        if (upErr) throw upErr

        const { data: { publicUrl } } = supabaseAdmin.storage.from('outfit-images').getPublicUrl(path)

        const chosenCategory = await askCategory({ ...item, publicUrl })
        setCatPicker(null)

        const resp = await fetch('/api/analyse', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: publicUrl })
        })
        const aiData = await resp.json()
        const t = aiData.tags || {}
        const aiTags = [...(t.garments||[]), ...(t.colours||[]), ...(t.style||[]), ...(t.occasion||[]), ...(t.season||[])]

        const { data: newOutfit, error: dbErr } = await supabase
          .from('outfits')
          .insert({
            date: new Date().toISOString().slice(0,10),
            tags: aiTags,
            categories: [chosenCategory],
            reaction: null,
            note: '',
            image_url: publicUrl
          })
          .select().single()
        if (dbErr) throw dbErr

        setOutfits(prev => [newOutfit, ...prev])
        setQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'done' } : i))
      }
    } catch (e) {
      console.error(e)
      setCatPicker(null)
      setQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'error' } : i))
    }
    processingRef.current = false
  }

  async function deleteOutfit(outfit) {
    if (!confirm('Delete this look?')) return
    const path = outfit.image_url.split('/outfit-images/')[1]
    await supabase.storage.from('outfit-images').remove([path])
    await supabase.from('outfits').delete().eq('id', outfit.id)
    setOutfits(prev => prev.filter(o => o.id !== outfit.id))
  }

  async function handleFiles(files) {
    const images = Array.from(files).filter(f => f.type.startsWith('image/'))
    const compressed = await Promise.all(images.map(compressImage))
    const newItems = compressed.map(file => ({
      id: nextId.current++, file,
      preview: URL.createObjectURL(file),
      status: 'waiting', name: file.name,
      mode: uploadMode,
    }))
    setQueue(prev => [...prev, ...newItems])
    setView('upload')
  }

  function openModal(outfit) {
    setSelected(outfit); setModalNote(outfit.note || '')
    setModalReaction(outfit.reaction || null); setNewTag('')
  }

  async function toggleCategory(category) {
    if (!selected) return
    const current = selected.categories || []
    const updated = current.includes(category) ? current.filter(c => c !== category) : [...current, category]
    const { error } = await supabase.from('outfits').update({ categories: updated }).eq('id', selected.id)
    if (!error) {
      setOutfits(prev => prev.map(o => o.id === selected.id ? { ...o, categories: updated } : o))
      setSelected(prev => ({ ...prev, categories: updated }))
    }
  }

  async function addTag(tag) {
    if (!tag.trim() || !selected) return
    const updatedTags = [...(selected.tags || []), tag.trim().toLowerCase()]
    const { error } = await supabase.from('outfits').update({ tags: updatedTags }).eq('id', selected.id)
    if (!error) {
      setOutfits(prev => prev.map(o => o.id === selected.id ? { ...o, tags: updatedTags } : o))
      setSelected(prev => ({ ...prev, tags: updatedTags })); setNewTag('')
    }
  }

  async function saveModal() {
    setSaving(true)
    const { error } = await supabase.from('outfits')
      .update({ note: modalNote, reaction: modalReaction }).eq('id', selected.id)
    if (!error) setOutfits(prev => prev.map(o => o.id === selected.id ? { ...o, note: modalNote, reaction: modalReaction } : o))
    setSaving(false); setSelected(null)
  }

  const allTags = [...new Set(outfits.flatMap(o => o.tags || []))].sort()
  const filtered = outfits.filter(o => {
    if (activeFilter && !(o.tags || []).includes(activeFilter)) return false
    if (activeCategory !== 'all' && !(o.categories || []).includes(activeCategory)) return false
    if (search) {
      const s = search.toLowerCase()
      if (!(o.tags || []).some(t => t.includes(s)) && !(o.note || '').toLowerCase().includes(s)) return false
    }
    return true
  })

  const tagFreq    = getTagFrequency(outfits)
  const maxFreq    = tagFreq[0]?.[1] || 1
  const loveCount  = outfits.filter(o => o.reaction === 'love').length
  const unsureCount= outfits.filter(o => o.reaction === 'unsure').length
  const pendingCount = queue.filter(q => q.status !== 'done' && q.status !== 'error').length

  return (
    <>
      <style>{STYLE}</style>
      <div className="app">

        <header className="header">
          <div className="logo">dr<span>e</span>ssed</div>
          <nav className="header-nav">
            <button className={`nav-btn ${view === 'home'     ? 'active' : ''}`} onClick={() => setView('home')}>Home</button>
            <button className={`nav-btn ${view === 'wardrobe' ? 'active' : ''}`} onClick={() => setView('wardrobe')}>
              Wardrobe{outfits.length > 0 ? ` (${outfits.length})` : ''}
            </button>
            <button className={`nav-btn ${view === 'upload'   ? 'active' : ''}`} onClick={() => setView('upload')}>
              Upload{pendingCount > 0 ? ` · ${pendingCount} left` : ''}
            </button>
            <button className={`nav-btn ${view === 'stats'    ? 'active' : ''}`} onClick={() => setView('stats')}>Stats</button>
          </nav>
        </header>

        <main className="main">

          {view === 'home' && (
            <HomePage
              outfits={outfits}
              onDoorClick={cat => { setActiveCategory(cat); setView('wardrobe'); }}
              onUploadClick={() => setView('upload')}
            />
          )}

          {view === 'upload' && (
            <div className="inner-pad">
              <div className="upload-section">
                <div className="page-title" style={{ marginBottom: 20 }}>Add Looks</div>

                <div className="upload-toggle">
                  <button
                    className={`toggle-btn ${uploadMode === 'wardrobe' ? 'active' : ''}`}
                    onClick={() => setUploadMode('wardrobe')}
                  >
                    Wardrobe Look
                  </button>
                  <button
                    className={`toggle-btn ${uploadMode === 'memory' ? 'active' : ''}`}
                    onClick={() => setUploadMode('memory')}
                  >
                    Memory Moment
                  </button>
                </div>

                <p className="upload-intro">
                  {uploadMode === 'wardrobe'
                    ? "Drop in your outfit photos. Each will be AI-tagged and you'll choose which wardrobe section it lives in."
                    : "Upload fun moments and group shots. These go into your Fashion in Motion memory album — separate from your wardrobe."}
                </p>

                <label className="upload-area">
                  <input className="upload-input" type="file" accept="image/*" multiple
                    onChange={e => { if (e.target.files.length) handleFiles(e.target.files) }} />
                  <div className="upload-icon">{uploadMode === 'wardrobe' ? '✦' : '✿'}</div>
                  <span className="upload-label">{uploadMode === 'wardrobe' ? 'Drop your looks here' : 'Drop memory moments here'}</span>
                  <span className="upload-sub">Select multiple · jpg, png, heic</span>
                </label>

                {queue.length > 0 && (
                  <div className="queue">
                    {queue.map(item => (
                      <div key={item.id} className="queue-item">
                        <img className="queue-thumb" src={item.preview} alt="" />
                        <span className="queue-name">{item.name}</span>
                        <span style={{ fontSize:'0.52rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--warm-mid)', opacity:0.7, marginRight:8 }}>
                          {item.mode === 'memory' ? 'Memory' : 'Wardrobe'}
                        </span>
                        <span className={`queue-status ${item.status === 'done' ? 'done' : item.status === 'processing' ? 'processing' : ''}`}>
                          {item.status === 'done'       ? '✓ Saved'
                           : item.status === 'processing' ? 'Analysing...'
                           : item.status === 'error'      ? '✕ Error'
                           : 'Waiting'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'wardrobe' && (
            <div className="inner-pad">
              <div className="page-title">Emery's Looks</div>
              <div className="filter-bar">
                <span className="filter-label">Filter</span>
                <div className="category-tabs">
                  {['all', 'casual', 'business', 'party', 'inspiration'].map(cat => (
                    <button key={cat} className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
                      onClick={() => setActiveCategory(cat)}>{cat}</button>
                  ))}
                </div>
                {allTags.slice(0, 14).map(t => (
                  <button key={t} className={`filter-tag ${activeFilter === t ? 'active' : ''}`}
                    onClick={() => setActiveFilter(activeFilter === t ? null : t)}>{t}</button>
                ))}
                <input className="search-input" placeholder="Search tags, notes..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {loading ? (
                <div className="loading"><div className="loading-text">Loading your wardrobe...</div></div>
              ) : filtered.length === 0 ? (
                <div className="empty">
                  <div className="empty-title">{outfits.length === 0 ? 'Nothing here yet' : 'No matches'}</div>
                  <div className="empty-sub">{outfits.length === 0 ? 'Upload a look to get started' : 'Try a different filter'}</div>
                </div>
              ) : (
                <div className="grid">
                  {filtered.map(outfit => (
                    <div key={outfit.id}
                      className={`card ${(outfit.categories||[]).includes('inspiration') ? 'inspiration' : ''}`}
                      onClick={() => openModal(outfit)}>
                      {outfit.image_url && <img className="card-img" src={outfit.image_url} alt="outfit" />}
                      <div className="card-body">
                        <div className="card-top">
                          <span className="card-date">{outfit.date}</span>
                          {outfit.reaction && <span style={{ fontSize:'1rem' }}>{outfit.reaction === 'love' ? '♥' : '?'}</span>}
                        </div>
                        <div className="card-tags">
                          {(outfit.categories||[]).map(c => <span key={c} className="tag cat-tag">{c}</span>)}
                          {(outfit.tags||[]).slice(0,4).map(t => <span key={t} className="tag">{t}</span>)}
                          {(outfit.tags||[]).length > 4 && <span className="tag">+{outfit.tags.length - 4}</span>}
                        </div>
                        {outfit.note && <div className="card-note">{outfit.note}</div>}
                        <button className="delete-btn" onClick={e => { e.stopPropagation(); deleteOutfit(outfit); }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'stats' && (
            <div className="inner-pad">
              <div className="page-title">Style Stats</div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-title">Archive</div>
                  <div className="stat-big">{outfits.length}</div>
                  <div className="stat-big-label">looks saved</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Reactions</div>
                  <div style={{ display:'flex', gap:28 }}>
                    <div>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'2.5rem', fontWeight:300 }}>♥ {loveCount}</div>
                      <div style={{ fontSize:'0.55rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--warm-mid)' }}>Loved it</div>
                    </div>
                    <div>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'2.5rem', fontWeight:300 }}>? {unsureCount}</div>
                      <div style={{ fontSize:'0.55rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--warm-mid)' }}>Not sure</div>
                    </div>
                  </div>
                </div>
                <div className="stat-card" style={{ gridColumn:'1/-1' }}>
                  <div className="stat-title">Most Worn Tags</div>
                  {tagFreq.length === 0
                    ? <div style={{ fontSize:'0.65rem', color:'var(--warm-mid)', fontStyle:'italic' }}>Upload some looks to see your style patterns emerge.</div>
                    : tagFreq.map(([tag, count]) => (
                      <div key={tag} className="stat-row">
                        <span className="stat-bar-label">{tag}</span>
                        <div className="stat-bar-track"><div className="stat-bar-fill" style={{ width:`${(count/maxFreq)*100}%` }}/></div>
                        <span className="stat-count">{count}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

        </main>

        {catPicker && (
          <CategoryPickerModal
            imagePreview={catPicker.item.preview}
            onConfirm={cat => catPicker.resolve(cat)}
            onCancel={() => {
              catPicker.resolve('casual')
              setCatPicker(null)
            }}
          />
        )}

        {selected && (
          <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
            <div className="modal">
              {selected.image_url && <img className="modal-img" src={selected.image_url} alt="outfit" />}
              <div className="modal-body">
                <div className="modal-header">
                  <div className="modal-date">{selected.date}</div>
                  <button className="modal-close" onClick={() => setSelected(null)}>x</button>
                </div>
                <div>
                  <div className="modal-section-label">Tags</div>
                  <div className="modal-tags">{(selected.tags||[]).map(t => <span key={t} className="tag">{t}</span>)}</div>
                  <div className="add-tag-row">
                    <input className="tag-input" placeholder="Add a tag..." value={newTag} onChange={e => setNewTag(e.target.value)} />
                    <button className="add-tag-btn" onClick={() => addTag(newTag)}>Add</button>
                  </div>
                </div>
                <div>
                  <div className="modal-section-label">Wardrobe Section</div>
                  <div className="category-row">
                    {['casual','business','party','inspiration'].map(cat => (
                      <button key={cat} className={`cat-btn ${(selected.categories||[]).includes(cat) ? 'active' : ''}`}
                        onClick={() => toggleCategory(cat)}>{cat}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="modal-section-label">Reaction</div>
                  <div className="reaction-row">
                    <button className={`reaction-btn love ${modalReaction === 'love' ? 'active' : ''}`}
                      onClick={() => setModalReaction(modalReaction === 'love' ? null : 'love')}>♥ Love it</button>
                    <button className={`reaction-btn unsure ${modalReaction === 'unsure' ? 'active' : ''}`}
                      onClick={() => setModalReaction(modalReaction === 'unsure' ? null : 'unsure')}>? Not sure</button>
                  </div>
                </div>
                <div>
                  <div className="modal-section-label">Notes</div>
                  <textarea className="notes-input"
                    placeholder="How did you feel in this? What worked, what didn't..."
                    value={modalNote} onChange={e => setModalNote(e.target.value)} />
                </div>
                <button className="save-btn" onClick={saveModal} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Look'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
