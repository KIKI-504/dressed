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
    --wood-dark: #B8A882;
    --wood-mid: #CEC0A0;
    --wood-light: #DDD3B8;
  }

  body { background: var(--cream); font-family: 'Montserrat', sans-serif; color: var(--ink); }
  .app { min-height: 100vh; display: flex; flex-direction: column; }

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

  .upload-section { padding: 48px 0 32px; }
  .upload-intro {
    font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-style: italic;
    color: var(--warm-mid); margin-bottom: 28px; line-height: 1.6;
  }
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

  /* ═══════════════════ HOME PAGE ═══════════════════ */
  .home-page {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; padding: 52px 24px 80px;
  }
  .home-logo {
    font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 300;
    font-size: clamp(56px, 10vw, 88px); color: var(--ink); letter-spacing: -0.01em;
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

  /* ═══════════════════ DOOR GRID ═══════════════════ */
  .door-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
    width: 100%; max-width: 760px; margin: 36px auto 0;
  }

  /* ── The whole wardrobe unit ── */
  .door-wrapper {
    position: relative; aspect-ratio: 3/4; cursor: pointer; user-select: none;
    filter: drop-shadow(0 10px 28px rgba(44,36,32,0.2)) drop-shadow(0 3px 6px rgba(44,36,32,0.12));
    transition: filter 0.3s ease;
  }
  .door-wrapper:hover {
    filter: drop-shadow(0 14px 36px rgba(44,36,32,0.26)) drop-shadow(0 4px 8px rgba(44,36,32,0.15));
  }

  /* ── Wooden outer casing ── */
  .door-casing {
    position: absolute; inset: 0; border-radius: 6px; z-index: 1;
    background: linear-gradient(160deg,
      #DDD3B8 0%, #CEC0A0 10%, #B8A882 18%,
      #CEC0A0 25%, #DDD3B8 50%,
      #CEC0A0 75%, #B8A882 82%,
      #CEC0A0 90%, #DDD3B8 100%
    );
    box-shadow:
      inset 0 2px 0 rgba(255,255,255,0.45),
      inset 0 -2px 0 rgba(0,0,0,0.12),
      inset 2px 0 0 rgba(255,255,255,0.2),
      inset -2px 0 0 rgba(0,0,0,0.08);
  }

  /* ── Gold hinges on casing ── */
  .hinge {
    position: absolute; left: 7px; width: 14px; height: 26px;
    background: linear-gradient(180deg, #E8D080, #C8A850, #A88030, #C8A850, #E8D080);
    border-radius: 3px; z-index: 2;
    box-shadow: 1px 1px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.4);
  }
  .hinge::before {
    content: ''; position: absolute; top: 50%; left: 50%;
    transform: translate(-50%,-50%); width: 5px; height: 5px;
    border-radius: 50%;
    background: radial-gradient(circle, #B09030, #786010);
    box-shadow: 0 0 3px rgba(0,0,0,0.5);
  }
  .hinge-top { top: 16%; }
  .hinge-bottom { bottom: 16%; }
  .door-wrapper.open .hinge { filter: brightness(1.15); }

  /* ── Dark interior (always visible behind panels) ── */
  .door-interior {
    position: absolute; inset: 13px; border-radius: 3px;
    overflow: hidden; z-index: 2;
  }
  .interior-business    { background: linear-gradient(170deg, #141428 0%, #1e1a30 50%, #141420 100%); }
  .interior-casual      { background: linear-gradient(170deg, #122038 0%, #1a3050 50%, #101828 100%); }
  .interior-party       { background: linear-gradient(170deg, #140818 0%, #200830 50%, #100618 100%); }
  .interior-inspiration { background: linear-gradient(170deg, #181410 0%, #241c10 50%, #141008 100%); }

  .interior-content {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
  }

  /* ── CLOTHING: Blazer ── */
  .blazer-hanger { display: flex; flex-direction: column; align-items: center; width: 55%; }
  .hanger-hook { width: 2px; height: 22px; background: linear-gradient(180deg, #D4AF7A, #A08040); margin: 0 auto; }
  .hanger-bar { width: 85%; height: 2px; background: linear-gradient(90deg, #8B6914, #D4AF7A, #C8A86B, #D4AF7A, #8B6914); border-radius: 1px; }
  .blazer-body {
    width: 100%; height: 82px;
    background: linear-gradient(185deg, #20205a 0%, #18183e 40%, #0e0e28 100%);
    border-radius: 3px 3px 10px 10px; margin-top: 2px;
    box-shadow: -6px 6px 20px rgba(0,0,0,0.7), 2px 0 8px rgba(0,0,0,0.4); position: relative;
  }
  .blazer-lapel-left {
    position: absolute; top: 0; left: 0; width: 42%; height: 42px;
    background: linear-gradient(135deg, #28286a 0%, #1c1c50 100%);
    clip-path: polygon(0 0, 100% 0, 55% 100%, 0 100%);
  }
  .blazer-lapel-right {
    position: absolute; top: 0; right: 0; width: 42%; height: 42px;
    background: linear-gradient(225deg, #28286a 0%, #1c1c50 100%);
    clip-path: polygon(0 0, 100% 0, 100% 100%, 45% 100%);
  }
  .blazer-button {
    position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
    width: 5px; height: 5px; border-radius: 50%;
    background: radial-gradient(circle, #D4AF7A, #A08040);
    box-shadow: 0 0 4px rgba(212,175,122,0.6);
  }

  /* ── CLOTHING: Casual ── */
  .casual-items { display: flex; flex-direction: column; align-items: center; gap: 10px; width: 65%; }
  .denim-fold {
    width: 100%; height: 54px;
    background: linear-gradient(180deg, #4a6fa5 0%, #3d5a8a 40%, #2a4070 100%);
    border-radius: 5px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); position: relative; overflow: hidden;
  }
  .denim-fold::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 8px;
    background: linear-gradient(180deg, rgba(255,255,255,0.18), transparent);
  }
  .sneaker-pair { display: flex; gap: 6px; width: 90%; }
  .sneaker {
    flex: 1; height: 22px;
    background: linear-gradient(160deg, #f5f2ed 0%, #e8e4de 50%, #d8d4cc 100%);
    border-radius: 24px 24px 5px 5px; box-shadow: 0 3px 10px rgba(0,0,0,0.4);
  }

  /* ── CLOTHING: Party ── */
  .party-items { display: flex; flex-direction: column; align-items: center; gap: 12px; width: 65%; }
  .sequin-fabric {
    width: 100%; height: 58px;
    background: linear-gradient(135deg, #6B0E4E, #A01840, #8B0E4E, #C41E3A, #6B0E4E);
    border-radius: 5px; overflow: hidden;
    box-shadow: 0 5px 20px rgba(139,14,78,0.6), 0 0 30px rgba(196,30,58,0.25);
    position: relative;
  }
  .sequin-fabric::before {
    content: ''; position: absolute; inset: 0;
    background: repeating-linear-gradient(
      45deg, transparent, transparent 2px,
      rgba(255,200,100,0.15) 2px, rgba(255,200,100,0.15) 3px
    );
  }
  .sequin-shimmer {
    position: absolute; inset: 0;
    background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.45) 50%, transparent 80%);
    animation: shimmer 2.5s ease-in-out infinite;
  }
  @keyframes shimmer { 0%,100%{transform:translateX(-130%)} 60%{transform:translateX(130%)} }
  .heel-pair { display: flex; gap: 10px; align-items: flex-end; }
  .heel { position: relative; width: 22px; height: 34px; }
  .heel-body {
    position: absolute; top: 0; left: 0; right: 0; height: 18px;
    background: linear-gradient(135deg, #A08060, #7a6040, #8B7355);
    border-radius: 6px 10px 0 0; box-shadow: 1px 2px 8px rgba(0,0,0,0.5);
  }
  .heel-stem {
    position: absolute; bottom: 0; right: 5px; width: 4px; height: 18px;
    background: linear-gradient(180deg, #7a6040, #4A3520);
    border-radius: 0 0 3px 3px; box-shadow: 1px 0 4px rgba(0,0,0,0.4);
  }

  /* ── CLOTHING: Moodboard ── */
  .moodboard { width: 75%; display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
  .pin-card {
    height: 36px; border-radius: 2px;
    box-shadow: 1px 3px 8px rgba(0,0,0,0.45); position: relative;
  }
  .pin-card::after {
    content: ''; position: absolute; top: 3px; left: 50%; transform: translateX(-50%);
    width: 6px; height: 6px; border-radius: 50%;
    background: radial-gradient(circle, #F0D080, #C8A850);
    box-shadow: 0 0 5px rgba(200,168,80,0.8); z-index: 2;
  }
  .pin-1 { background: linear-gradient(135deg, #D4C4A8, #C0B090); }
  .pin-2 { background: linear-gradient(135deg, #A8B8C8, #8898B0); }
  .pin-3 { background: linear-gradient(135deg, #C8B4A0, #B09880); }
  .pin-4 { background: linear-gradient(135deg, #B8C4A8, #A0B090); }

  /* ── Door panels (the linen surfaces) ── */
  .door-panels {
    position: absolute; inset: 13px; z-index: 3; border-radius: 3px;
    /* clip panels to the interior rect so they dont overlap the wood casing */
    overflow: hidden;
  }

  .door-panel {
    position: absolute; top: 0; height: 100%; width: 50%;
    transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
  }

  /* Default resting state: panels slightly ajar (3-4 deg) revealing seam */
  .door-panel-left {
    left: 0; transform-origin: left center;
    transform: perspective(1000px) rotateY(-4deg);
    background: linear-gradient(94deg,
      #BFAF90 0%, #D4C8AA 12%, #E2D8C2 40%,
      #DDD3BC 70%, #CABEA0 100%
    );
  }
  .door-panel-right {
    right: 0; transform-origin: right center;
    transform: perspective(1000px) rotateY(4deg);
    background: linear-gradient(266deg,
      #BFAF90 0%, #D4C8AA 12%, #E2D8C2 40%,
      #DDD3BC 70%, #CABEA0 100%
    );
  }

  /* Linen weave */
  .door-panel::before {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background-image:
      repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.015) 3px, rgba(0,0,0,0.015) 4px),
      repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.015) 3px, rgba(0,0,0,0.015) 4px);
  }

  /* Seam shadow — makes gap look real */
  .door-panel-left::after {
    content: ''; position: absolute; right: 0; top: 0; bottom: 0; width: 10px;
    background: linear-gradient(90deg, transparent, rgba(20,12,4,0.22));
    pointer-events: none;
  }
  .door-panel-right::after {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 10px;
    background: linear-gradient(270deg, transparent, rgba(20,12,4,0.22));
    pointer-events: none;
  }

  /* Open state */
  .door-wrapper.open .door-panel-left  { transform: perspective(1000px) rotateY(-30deg); }
  .door-wrapper.open .door-panel-right { transform: perspective(1000px) rotateY(30deg); }

  /* ── Door label ── */
  .door-label {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: clamp(10px, 1.8vw, 13px); letter-spacing: 0.32em;
    color: rgba(250,247,242,0.92);
    text-shadow: 0 1px 6px rgba(30,20,10,0.5);
    z-index: 4; pointer-events: none;
    text-transform: uppercase; font-weight: 300;
    transition: opacity 0.3s ease;
  }
  .door-wrapper.open .door-label { opacity: 0; }

  /* ── Brass lever handles ── */
  .door-handle { position: absolute; top: 50%; z-index: 5; transition: transform 0.7s cubic-bezier(0.4,0,0.2,1); }
  .handle-left  { right: 7px; transform: translateY(-50%); transform-origin: right center; }
  .handle-right { left: 7px; transform: translateY(-50%); transform-origin: left center; }

  .lever { display: flex; flex-direction: column; align-items: center; }
  .lever-base {
    width: 11px; height: 7px;
    background: linear-gradient(180deg, #EAD080, #C8A850, #A88030);
    border-radius: 2px 2px 0 0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.3);
  }
  .lever-bar {
    width: 5px; height: 26px;
    background: linear-gradient(180deg, #D8B860, #C09840, #D8B860);
    border-radius: 0 0 3px 3px;
    box-shadow: 1px 0 3px rgba(0,0,0,0.25), -1px 0 2px rgba(255,255,255,0.08);
  }
  .lever-foot {
    width: 13px; height: 5px;
    background: linear-gradient(90deg, #C8A850, #EAD080, #C8A850);
    border-radius: 3px; margin-top: -1px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }

  /* ── Tap hint inside open door ── */
  .door-hint {
    position: absolute; bottom: 18px; left: 0; right: 0; z-index: 6;
    pointer-events: none; text-align: center;
    font-size: 8px; letter-spacing: 0.22em; text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    opacity: 0; transition: opacity 0.35s ease 0.55s;
  }
  .door-wrapper.open .door-hint { opacity: 1; }

  /* ═══════════════════ SCRAPBOOK ═══════════════════ */
  .scrapbook-zone {
    position: absolute; bottom: -24px; right: -20px; width: 200px;
    transform: rotate(2deg); z-index: 10;
    filter: drop-shadow(0 8px 24px rgba(44,36,32,0.2));
  }
  .polaroid-stack { position: relative; width: 100%; height: 150px; }
  .polaroid { position: absolute; background: white; padding: 7px 7px 24px; box-shadow: 2px 4px 16px rgba(44,36,32,0.2); }
  .polaroid-1 { width: 90px; height: 110px; bottom: 10px; left: 5px; transform: rotate(-8deg); }
  .polaroid-2 { width: 82px; height: 100px; bottom: 18px; left: 44px; transform: rotate(4deg); z-index: 2; }
  .polaroid-3 { width: 86px; height: 105px; bottom: 4px; right: 5px; transform: rotate(-2deg); z-index: 1; }
  .polaroid-img { width: 100%; height: 75%; }
  .polaroid-img-1 { background: linear-gradient(135deg, #D4C0A8, #BCA888); }
  .polaroid-img-2 { background: linear-gradient(135deg, #A8B4C8, #8898B0); }
  .polaroid-img-3 { background: linear-gradient(135deg, #C8B4A0, #B0988A); }
  .polaroid-caption { font-size: 8px; color: var(--warm-mid); text-align: center; margin-top: 4px; font-style: italic; }
  .camera-body { position: relative; z-index: 5; transform: rotate(7deg); margin: -16px 0 0 55px; }
  .scrapbook-text { position: absolute; bottom: -44px; left: -10px; right: -10px; text-align: center; }
  .fashion-in-motion { font-size: 8px; letter-spacing: 0.25em; color: var(--warm-mid); text-transform: uppercase; display: block; font-weight: 300; }
  .upload-moments { font-size: 13px; color: var(--accent); display: block; margin-top: 2px; font-style: italic; font-family: 'Cormorant Garamond', serif; }

  /* ═══════════════════ RECENT LOOKS ═══════════════════ */
  .recent-strip { width: 100%; max-width: 760px; margin: 80px auto 0; }
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
  .look-tag { font-size: 8px; letter-spacing: 0.15em; text-transform: uppercase; background: rgba(255,255,255,0.15); backdrop-filter: blur(4px); padding: 3px 7px; border-radius: 20px; color: rgba(255,255,255,0.9); border: 1px solid rgba(255,255,255,0.2); margin-right: 4px; }

  @media (max-width: 640px) {
    .header { padding: 20px 20px 16px; }
    .inner-pad { padding: 0 20px 40px; }
    .modal { grid-template-columns: 1fr; }
    .modal-img { min-height: 240px; }
    .stats-grid { grid-template-columns: 1fr; }
    .header-nav { gap: 16px; }
    .door-grid { gap: 12px; }
  }
`

function getTagFrequency(outfits) {
  const freq = {}
  outfits.forEach(o => (o.tags || []).forEach(t => { freq[t] = (freq[t] || 0) + 1 }))
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10)
}

const MAX_BYTES = 4.5 * 1024 * 1024
const MAX_DIMENSION = 1500

async function compressImage(file) {
  if (file.size <= MAX_BYTES) return file
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > height) {
        if (width > MAX_DIMENSION) { height = Math.round(height * MAX_DIMENSION / width); width = MAX_DIMENSION }
      } else {
        if (height > MAX_DIMENSION) { width = Math.round(width * MAX_DIMENSION / height); height = MAX_DIMENSION }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })),
        'image/jpeg', 0.8
      )
    }
    img.src = url
  })
}

function HomePage({ outfits, onDoorClick, onUploadClick }) {
  const [openDoor, setOpenDoor] = useState(null)
  const recentThree = outfits.slice(0, 3)

  function handleDoorClick(cat) {
    if (openDoor === cat) {
      onDoorClick(cat)
    } else {
      setOpenDoor(cat)
    }
  }

  function Door({ id, label, interior }) {
    const isOpen = openDoor === id
    return (
      <div className={`door-wrapper ${isOpen ? 'open' : ''}`} onClick={() => handleDoorClick(id)}>

        {/* Wooden outer casing with hinges */}
        <div className="door-casing">
          <div className="hinge hinge-top"></div>
          <div className="hinge hinge-bottom"></div>
        </div>

        {/* Dark interior - always visible, clothing inside */}
        <div className={`door-interior interior-${id}`}>
          <div className="interior-content">
            {interior}
          </div>
        </div>

        {/* Linen door panels - slightly ajar by default */}
        <div className="door-panels">
          <div className="door-panel door-panel-left">
            <div className="door-label">{label}</div>
            <div className="door-handle handle-left">
              <div className="lever">
                <div className="lever-base"></div>
                <div className="lever-bar"></div>
                <div className="lever-foot"></div>
              </div>
            </div>
          </div>
          <div className="door-panel door-panel-right">
            <div className="door-handle handle-right">
              <div className="lever">
                <div className="lever-base"></div>
                <div className="lever-bar"></div>
                <div className="lever-foot"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="door-hint">tap again to enter</div>
      </div>
    )
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
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#E8E2D9', display: 'inline-block' }}></span>
        <button className="home-upload-link" onClick={onUploadClick}>+ Upload New Look</button>
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: 760 }}>
        <div className="door-grid">

          <Door id="business" label="Business" interior={
            <div className="blazer-hanger">
              <div className="hanger-hook"></div>
              <div className="hanger-bar"></div>
              <div className="blazer-body">
                <div className="blazer-lapel-left"></div>
                <div className="blazer-lapel-right"></div>
                <div className="blazer-button"></div>
              </div>
            </div>
          } />

          <Door id="casual" label="Casual" interior={
            <div className="casual-items">
              <div className="denim-fold"></div>
              <div className="sneaker-pair">
                <div className="sneaker"></div>
                <div className="sneaker"></div>
              </div>
            </div>
          } />

          <Door id="party" label="Party" interior={
            <div className="party-items">
              <div className="sequin-fabric"><div className="sequin-shimmer"></div></div>
              <div className="heel-pair">
                <div className="heel"><div className="heel-body"></div><div className="heel-stem"></div></div>
                <div className="heel"><div className="heel-body"></div><div className="heel-stem"></div></div>
              </div>
            </div>
          } />

          <Door id="inspiration" label="Inspiration" interior={
            <div className="moodboard">
              <div className="pin-card pin-1"></div>
              <div className="pin-card pin-2"></div>
              <div className="pin-card pin-3"></div>
              <div className="pin-card pin-4"></div>
            </div>
          } />

        </div>

        {/* Scrapbook / camera collage */}
        <div className="scrapbook-zone">
          <div className="polaroid-stack">
            <div className="polaroid polaroid-1">
              <div className="polaroid-img polaroid-img-1"></div>
              <div className="polaroid-caption">summer fits</div>
            </div>
            <div className="polaroid polaroid-2">
              <div className="polaroid-img polaroid-img-2"></div>
              <div className="polaroid-caption">brunch look</div>
            </div>
            <div className="polaroid polaroid-3">
              <div className="polaroid-img polaroid-img-3"></div>
              <div className="polaroid-caption">night out</div>
            </div>
          </div>
          <div className="camera-body">
            <svg width="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="20" width="104" height="52" rx="6" fill="#E8E4DC" stroke="#C8C0B0" strokeWidth="1.5"/>
              <rect x="8" y="20" width="104" height="14" rx="6" fill="#D8D4CC" stroke="#C8C0B0" strokeWidth="1.5"/>
              <rect x="30" y="10" width="28" height="14" rx="4" fill="#DDD8D0" stroke="#C8C0B0" strokeWidth="1.5"/>
              <circle cx="60" cy="52" r="20" fill="#C8C4BC" stroke="#B0ACA4" strokeWidth="1.5"/>
              <circle cx="60" cy="52" r="15" fill="#2A2A2A" stroke="#505050" strokeWidth="1"/>
              <circle cx="60" cy="52" r="10" fill="#1A1A1A"/>
              <circle cx="60" cy="52" r="6" fill="#0A0A0A"/>
              <circle cx="56" cy="48" r="2.5" fill="rgba(255,255,255,0.3)"/>
              <circle cx="92" cy="26" r="6" fill="#C8A86B" stroke="#B8975A" strokeWidth="1"/>
              <rect x="8" y="32" width="6" height="8" rx="2" fill="#B8B4AC"/>
              <rect x="106" y="32" width="6" height="8" rx="2" fill="#B8B4AC"/>
              <rect x="20" y="24" width="16" height="8" rx="2" fill="#E0E8F0" stroke="#C8D0D8" strokeWidth="1"/>
            </svg>
          </div>
          <div className="scrapbook-text">
            <span className="fashion-in-motion">Fashion in Motion</span>
            <span className="upload-moments">Upload moments with friends</span>
          </div>
        </div>
      </div>

      {recentThree.length > 0 && (
        <div className="recent-strip">
          <div className="recent-label">Recent Looks</div>
          <div className="editorial-grid">
            <div className="look-card look-card-main" onClick={() => onDoorClick('all')}>
              <img src={recentThree[0].image_url} alt="outfit" />
              <div className="look-overlay"></div>
              <div className="look-meta">
                {(recentThree[0].tags || []).slice(0, 3).map(t => <span key={t} className="look-tag">{t}</span>)}
              </div>
            </div>
            {recentThree[1] && (
              <div className="look-card look-card-sm" onClick={() => onDoorClick('all')}>
                <img src={recentThree[1].image_url} alt="outfit" />
                <div className="look-overlay"></div>
                <div className="look-meta">
                  {(recentThree[1].tags || []).slice(0, 2).map(t => <span key={t} className="look-tag">{t}</span>)}
                </div>
              </div>
            )}
            {recentThree[2] && (
              <div className="look-card look-card-sm" onClick={() => onDoorClick('all')}>
                <img src={recentThree[2].image_url} alt="outfit" />
                <div className="look-overlay"></div>
                <div className="look-meta">
                  {(recentThree[2].tags || []).slice(0, 2).map(t => <span key={t} className="look-tag">{t}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('home')
  const [outfits, setOutfits] = useState([])
  const [loading, setLoading] = useState(true)
  const [queue, setQueue] = useState([])
  const [selected, setSelected] = useState(null)
  const [activeFilter, setActiveFilter] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [modalNote, setModalNote] = useState('')
  const [modalReaction, setModalReaction] = useState(null)
  const [saving, setSaving] = useState(false)
  const [newTag, setNewTag] = useState('')

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

  async function processItem(item) {
    processingRef.current = true
    setQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'processing' } : i))
    try {
      const ext = item.file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabaseAdmin.storage
        .from('outfit-images').upload(path, item.file, { contentType: item.file.type })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabaseAdmin.storage.from('outfit-images').getPublicUrl(path)
      const resp = await fetch('/api/analyse', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: publicUrl })
      })
      const aiData = await resp.json()
      const t = aiData.tags || {}
      const tags = [...(t.garments||[]), ...(t.colours||[]), ...(t.style||[]), ...(t.occasion||[]), ...(t.season||[])]
      const { data: newOutfit, error: dbError } = await supabase
        .from('outfits')
        .insert({ date: new Date().toISOString().slice(0,10), tags, categories: [], reaction: null, note: '', image_url: publicUrl })
        .select().single()
      if (dbError) throw dbError
      setOutfits(prev => [newOutfit, ...prev])
      setQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'done' } : i))
    } catch (e) {
      console.error(e)
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
      preview: URL.createObjectURL(file), status: 'waiting', name: file.name,
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
    if (!error) {
      setOutfits(prev => prev.map(o => o.id === selected.id ? { ...o, note: modalNote, reaction: modalReaction } : o))
    }
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

  const tagFreq = getTagFrequency(outfits)
  const maxFreq = tagFreq[0]?.[1] || 1
  const loveCount = outfits.filter(o => o.reaction === 'love').length
  const unsureCount = outfits.filter(o => o.reaction === 'unsure').length
  const pendingCount = queue.filter(q => q.status !== 'done' && q.status !== 'error').length

  return (
    <>
      <style>{STYLE}</style>
      <div className="app">
        <header className="header">
          <div className="logo">dr<span>e</span>ssed</div>
          <nav className="header-nav">
            <button className={`nav-btn ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>Home</button>
            <button className={`nav-btn ${view === 'wardrobe' ? 'active' : ''}`} onClick={() => setView('wardrobe')}>
              Wardrobe{outfits.length > 0 ? ` (${outfits.length})` : ''}
            </button>
            <button className={`nav-btn ${view === 'upload' ? 'active' : ''}`} onClick={() => setView('upload')}>
              Upload{pendingCount > 0 ? ` · ${pendingCount} left` : ''}
            </button>
            <button className={`nav-btn ${view === 'stats' ? 'active' : ''}`} onClick={() => setView('stats')}>Stats</button>
          </nav>
        </header>

        <main className="main">

          {view === 'home' && (
            <HomePage
              outfits={outfits}
              onDoorClick={(cat) => { setActiveCategory(cat); setView('wardrobe'); }}
              onUploadClick={() => setView('upload')}
            />
          )}

          {view === 'upload' && (
            <div className="inner-pad">
              <div className="upload-section">
                <div className="page-title" style={{ marginBottom: 16 }}>Add Looks</div>
                <p className="upload-intro">Drop in one photo or a whole batch — each will be analysed and tagged automatically.</p>
                <label className="upload-area">
                  <input className="upload-input" type="file" accept="image/*" multiple
                    onChange={e => { if (e.target.files.length) handleFiles(e.target.files) }} />
                  <div className="upload-icon">✦</div>
                  <span className="upload-label">Drop your looks here</span>
                  <span className="upload-sub">Select multiple · jpg, png, heic</span>
                </label>
                {queue.length > 0 && (
                  <div className="queue">
                    {queue.map(item => (
                      <div key={item.id} className="queue-item">
                        <img className="queue-thumb" src={item.preview} alt="" />
                        <span className="queue-name">{item.name}</span>
                        <span className={`queue-status ${item.status === 'done' ? 'done' : item.status === 'processing' ? 'processing' : ''}`}>
                          {item.status === 'done' ? '✓ Saved' : item.status === 'processing' ? 'Analysing...' : item.status === 'error' ? '✕ Error' : 'Waiting'}
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
                    <div key={outfit.id} className={`card ${(outfit.categories||[]).includes('inspiration') ? 'inspiration' : ''}`} onClick={() => openModal(outfit)}>
                      {outfit.image_url && <img className="card-img" src={outfit.image_url} alt="outfit" />}
                      <div className="card-body">
                        <div className="card-top">
                          <span className="card-date">{outfit.date}</span>
                          {outfit.reaction && <span style={{ fontSize: '1rem' }}>{outfit.reaction === 'love' ? '♥' : '?'}</span>}
                        </div>
                        <div className="card-tags">
                          {(outfit.tags||[]).slice(0,4).map(t => <span key={t} className="tag">{t}</span>)}
                          {(outfit.tags||[]).length > 4 && <span className="tag">+{outfit.tags.length - 4}</span>}
                        </div>
                        {outfit.note && <div className="card-note">{outfit.note}</div>}
                        <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteOutfit(outfit); }}>Delete</button>
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
                  <div style={{ display: 'flex', gap: 28 }}>
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
                  <div className="modal-section-label">Categories</div>
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
