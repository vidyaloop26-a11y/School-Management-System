import React from 'react';

const stemCoursesHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VidyaLoop — STEM Courses, Live September 12</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Poppins:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  body {
    font-family: 'Poppins', sans-serif;
    background: #F7F8FA;
    color: #16232F;
    overflow-x: hidden;
    font-weight: 300;
  }

  .mono { font-family: 'JetBrains Mono', monospace; }
  .serif { font-family: 'Playfair Display', serif; }

  .hero {
    position: relative;
    padding: 128px 64px 108px;
    text-align: center;
    overflow: hidden;
    background:
      radial-gradient(circle at 18% 25%, rgba(56,182,255,0.10), transparent 45%),
      radial-gradient(circle at 82% 15%, rgba(201,162,75,0.12), transparent 45%),
      #FCFDFE;
  }
  .hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: linear-gradient(#EDF1F5 1px, transparent 1px), linear-gradient(90deg, #EDF1F5 1px, transparent 1px);
    background-size: 52px 52px;
    mask-image: radial-gradient(ellipse 55% 45% at 50% 25%, black 15%, transparent 80%);
    opacity: 0.6;
  }

  @keyframes riseIn {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .hero-anim {
    opacity: 0;
    animation: riseIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .hero-anim.d1 { animation-delay: 0.05s; }
  .hero-anim.d1b { animation-delay: 0.12s; }
  .hero-anim.d2 { animation-delay: 0.2s; }
  .hero-anim.d3 { animation-delay: 0.38s; }
  .hero-anim.d4 { animation-delay: 0.55s; }

  @keyframes drift {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-14px) rotate(4deg); }
  }
  .float-shape {
    position: absolute;
    z-index: 1;
    border-radius: 14px;
    animation: drift 7s ease-in-out infinite;
    opacity: 0.9;
  }
  .float-1 {
    top: 96px; left: 9%;
    width: 54px; height: 54px;
    background: linear-gradient(135deg, #E6F1FB, #B5D4F4);
    animation-delay: 0s;
  }
  .float-2 {
    top: 210px; right: 11%;
    width: 40px; height: 40px;
    background: linear-gradient(135deg, #FAEEDA, #FAC775);
    border-radius: 50%;
    animation-delay: 1.2s;
    animation-duration: 8s;
  }
  .float-3 {
    bottom: 60px; left: 16%;
    width: 30px; height: 30px;
    background: linear-gradient(135deg, #EAF3DE, #C0DD97);
    border-radius: 50%;
    animation-delay: 2.4s;
    animation-duration: 6.5s;
  }
  .float-4 {
    bottom: 100px; right: 8%;
    width: 46px; height: 46px;
    background: linear-gradient(135deg, #FAECE7, #F0997B);
    animation-delay: 0.8s;
    animation-duration: 9s;
  }

  .launch-badge {
    position: relative;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: #FFFFFF;
    border: 1px solid #DCE4EC;
    color: #16232F;
    padding: 9px 20px;
    border-radius: 999px;
    font-size: 12.5px;
    font-weight: 400;
    margin-bottom: 34px;
    letter-spacing: 0.3px;
    box-shadow: 0 6px 18px rgba(16,32,46,0.05);
  }
  .launch-badge .live-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #4ADE80;
    animation: pulse 1.8s infinite ease-in-out;
  }
  @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
  .launch-badge b { color: #185FA5; font-weight: 600; }

  .hero h1 {
    position: relative;
    z-index: 2;
    font-family: 'Playfair Display', serif;
    font-size: 26px;
    font-weight: 500;
    font-style: italic;
    line-height: 1.4;
    max-width: 780px;
    margin: 0 auto;
    color: #5C6B78;
  }
  .hero h1 .grad {
    color: #5C6B78;
  }

  .hero p {
    position: relative;
    z-index: 2;
    max-width: 540px;
    margin: 24px auto 0;
    font-size: 16px;
    line-height: 1.75;
    color: #5C6B78;
    font-weight: 300;
  }
  .stem-highlight {
    font-weight: 700;
    color: #185FA5;
    background: linear-gradient(180deg, transparent 62%, rgba(56,182,255,0.22) 62%);
    padding: 0 2px;
  }
  .stem-eyebrow {
    position: relative;
    z-index: 2;
    font-family: 'Playfair Display', serif;
    font-size: 58px;
    font-weight: 700;
    letter-spacing: 0.2px;
    text-transform: none;
    color: #16232F;
    margin-bottom: 18px;
    line-height: 1.2;
  }
  .stem-highlight-eyebrow {
    font-weight: 700;
    background: linear-gradient(100deg, #185FA5, #38B6FF 50%, #C9A24B 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-style: italic;
    padding: 0;
  }

  .track-row {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: center;
    gap: 14px;
    margin-top: 44px;
    flex-wrap: wrap;
  }
  .track-chip {
    display: flex;
    align-items: center;
    gap: 9px;
    background: #FCFDFE;
    border: 1px solid #E9EDF2;
    padding: 11px 20px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 400;
    color: #33414D;
  }
  .track-chip .sq { width: 8px; height: 8px; border-radius: 2px; }
  .sq-game { background: #38B6FF; }
  .sq-app { background: #C9A24B; }

  .why {
    padding: 108px 64px 100px;
    background: #FCFDFE;
    border-top: 1px solid #F0F2F5;
  }
  .why-head {
    text-align: center;
    max-width: 600px;
    margin: 0 auto 60px;
  }
  .eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11.5px;
    font-weight: 400;
    color: #185FA5;
    letter-spacing: 1px;
    margin-bottom: 14px;
    text-transform: uppercase;
  }
  .why-head h2 {
    font-family: 'Playfair Display', serif;
    font-size: 30px;
    font-weight: 600;
    line-height: 1.3;
  }
  .why-head p {
    margin-top: 14px;
    font-size: 14.5px;
    color: #6B7885;
    line-height: 1.7;
    font-weight: 300;
  }

  .why-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    max-width: 1180px;
    margin: 0 auto;
  }
  .why-card {
    background: #F3F7FC;
    padding: 34px 26px;
    border: 1px solid #E4EDF6;
    border-radius: 16px;
    box-shadow: 0 2px 6px rgba(16,32,46,0.03);
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  }
  .why-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(16,32,46,0.08);
    border-color: #C9DEF2;
  }
  .why-icon {
    width: 42px; height: 42px;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    margin-bottom: 22px;
  }
  .wi-1 { background: linear-gradient(135deg, #E6F1FB, #D3E7FA); }
  .wi-2 { background: linear-gradient(135deg, #FAECE7, #F6DED4); }
  .wi-3 { background: linear-gradient(135deg, #FAEEDA, #F5E2C0); }
  .wi-4 { background: linear-gradient(135deg, #EAF3DE, #DCEAC9); }
  .why-card h3 { font-size: 16px; font-weight: 600; margin-bottom: 10px; letter-spacing: 0.1px; }
  .why-card p { font-size: 12.5px; color: #6B7885; line-height: 1.65; font-weight: 300; }

  .course-section {
    padding: 112px 64px;
    position: relative;
    overflow: hidden;
  }
  .course-section.game {
    background: linear-gradient(155deg, #EAF5FF 0%, #F5FAFF 45%, #FFFFFF 100%);
    color: #16232F;
  }
  .course-section.app {
    background: linear-gradient(155deg, #FFF6E6 0%, #FFFBF2 45%, #FFFFFF 100%);
    color: #16232F;
  }
  .course-section::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(16,32,46,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(16,32,46,0.035) 1px, transparent 1px);
    background-size: 44px 44px;
    pointer-events: none;
  }
  .course-section.game::after {
    content: "";
    position: absolute;
    top: -120px; right: -100px;
    width: 460px; height: 460px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(56,182,255,0.22), transparent 70%);
    pointer-events: none;
  }
  .course-section.app::after {
    content: "";
    position: absolute;
    top: -120px; right: -100px;
    width: 460px; height: 460px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(239,159,39,0.20), transparent 70%);
    pointer-events: none;
  }

  .course-inner {
    position: relative;
    z-index: 2;
    max-width: 1180px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 0.85fr;
    gap: 64px;
    align-items: center;
  }

  .course-tagline-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 15px;
    font-weight: 500;
    padding: 10px 20px;
    border-radius: 999px;
    margin-bottom: 26px;
    letter-spacing: 1.2px;
  }
  .course-tagline-badge::before {
    content: "";
    width: 8px; height: 8px;
    border-radius: 50%;
  }
  .game .course-tagline-badge { background: rgba(56,182,255,0.14); color: #0C447C; border: 1px solid rgba(56,182,255,0.4); box-shadow: 0 4px 16px rgba(56,182,255,0.12); }
  .game .course-tagline-badge::before { background: #38B6FF; box-shadow: 0 0 8px #38B6FF; }
  .app .course-tagline-badge { background: rgba(239,159,39,0.14); color: #854F0B; border: 1px solid rgba(239,159,39,0.4); box-shadow: 0 4px 16px rgba(239,159,39,0.12); }
  .app .course-tagline-badge::before { background: #EF9F27; box-shadow: 0 0 8px #EF9F27; }

  .course-inner h2 {
    font-family: 'Playfair Display', serif;
    font-size: 34px;
    font-weight: 600;
    line-height: 1.24;
    max-width: 460px;
    color: #16232F;
  }
  .game .course-inner h2 em { color: #185FA5; font-style: italic; }
  .app .course-inner h2 em { color: #B5760F; font-style: italic; }

  .course-copy > p.desc {
    margin-top: 16px;
    font-size: 14px;
    line-height: 1.75;
    color: #4E5B68;
    max-width: 440px;
    font-weight: 300;
  }

  .stack-row2 { display: flex; gap: 9px; flex-wrap: wrap; margin-top: 22px; }
  .stack-pill2 {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11.5px;
    padding: 7px 14px;
    border-radius: 14px;
    background: #FFFFFF;
    color: #0F6E56;
    border: 1px solid #9FE1CB;
  }

  .benefit-list2 {
    margin-top: 26px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .benefit2 { display: flex; gap: 11px; align-items: flex-start; }
  .benefit2-dash {
    width: 14px; height: 1px;
    background: currentColor;
    margin-top: 9px;
    flex-shrink: 0;
    opacity: 0.6;
  }
  .game .benefit2-dash { color: #185FA5; }
  .app .benefit2-dash { color: #B5760F; }
  .benefit2-text { font-size: 12.5px; line-height: 1.6; color: #4E5B68; font-weight: 300; }
  .benefit2-text b { color: #16232F; font-weight: 500; }

  .course-footer-note { margin-top: 28px; font-size: 12px; color: #6B7885; font-family: 'JetBrains Mono', monospace; }

  .panel-stack { display: flex; flex-direction: column; gap: 14px; position: relative; z-index: 2; }
  .hud-card2 {
    background: #FFFFFF;
    border-radius: 14px;
    padding: 20px 22px;
  }
  .game .hud-card2 { border: 1px solid #D3E7FA; box-shadow: 0 12px 28px rgba(24,95,165,0.08); }
  .app .hud-card2 { border: 1px solid #FAE0AE; box-shadow: 0 12px 28px rgba(181,118,15,0.08); }

  .hud-title2 {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 12px;
    letter-spacing: 0.3px;
  }
  .game .hud-title2 { color: #185FA5; }
  .app .hud-title2 { color: #B5760F; }
  .hud-title2::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: #3B6D11; }

  .stage-list2 {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11.5px;
    display: flex; flex-direction: column; gap: 7px;
    color: #4E5B68;
  }
  .stage-list2 .done { color: #3B6D11; }

  .progress-track2 { height: 5px; background: #EDF1F5; border-radius: 4px; overflow: hidden; margin-top: 10px; }
  .game .progress-fill2 { background: #38B6FF; }
  .app .progress-fill2 { background: #EF9F27; }
  .progress-fill2 { height: 100%; border-radius: 4px; }

  .more-courses {
    padding: 96px 64px;
    background: #FCFDFE;
    text-align: center;
    border-top: 1px solid #F0F2F5;
  }
  .more-courses h2 {
    font-family: 'Playfair Display', serif;
    font-size: 26px;
    font-weight: 600;
    margin-top: 6px;
  }
  .more-courses > p {
    margin-top: 14px;
    font-size: 13.5px;
    color: #6B7885;
    max-width: 480px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.7;
    font-weight: 300;
  }
  .coming-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
    max-width: 900px;
    margin: 40px auto 0;
  }
  .coming-card {
    border-radius: 16px;
    padding: 28px 22px;
    text-align: left;
    box-shadow: 0 2px 6px rgba(16,32,46,0.03);
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    border: 1px solid transparent;
  }
  .coming-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 18px 36px rgba(16,32,46,0.07);
  }
  .coming-icon {
    width: 38px; height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    margin-bottom: 16px;
  }
  .ci-1 { background: linear-gradient(135deg, #EEEDFE, #CECBF6); }
  .ci-2 { background: linear-gradient(135deg, #FBEAF0, #F4C0D1); }
  .ci-3 { background: linear-gradient(135deg, #E1F5EE, #9FE1CB); }
  .coming-card h4 { font-size: 14.5px; font-weight: 500; margin-bottom: 6px; }
  .coming-card span {
    display: inline-block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #9AA7B2;
    letter-spacing: 0.3px;
  }

  footer {
    padding: 30px 68px;
    background: #FCFDFE;
    border-top: 1px solid #E9EDF2;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12.5px;
    color: #9AA7B2;
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-anim { animation: none; opacity: 1; }
    .float-shape { animation: none; }
  }

  @media (max-width: 1000px) {
    .hero { padding: 88px 24px 64px; }
    .stem-eyebrow { font-size: 34px; }
    .hero h1 { font-size: 18px; }
    .why, .course-section, .more-courses { padding: 56px 24px; }
    .why-grid { grid-template-columns: 1fr 1fr; }
    .course-inner { grid-template-columns: 1fr; }
    .coming-row { grid-template-columns: 1fr; }
    .float-shape { display: none; }
  }
</style>
</head>
<body>

<section class="hero">
  <div class="float-shape float-1"></div>
  <div class="float-shape float-2"></div>
  <div class="float-shape float-3"></div>
  <div class="float-shape float-4"></div>
  <div class="launch-badge hero-anim d1"><span class="live-dot"></span>Live from <b>September 12</b> &middot; open to everyone</div>
  <div class="stem-eyebrow hero-anim d1b">Introducing <span class="stem-highlight-eyebrow">STEM</span> Courses</div>
  <h1 class="hero-anim d2">Where curiosity <span class="grad">learns to build</span></h1>
  <p class="hero-anim d3">A space for students to turn imagination into something real through hands-on <b class="stem-highlight">STEM</b> learning — designing games and apps from the ground up, using free, open-source tools, and growing the habits of mind that carry into everything they build next.</p>
  <div class="track-row hero-anim d4">
    <div class="track-chip"><span class="sq sq-game"></span>Game Development</div>
    <div class="track-chip"><span class="sq sq-app"></span>App Development</div>
  </div>
</section>

<section class="why" id="why">
  <div class="why-head">
    <div class="eyebrow">Why it matters</div>
    <h2>Building trains the mind differently</h2>
    <p>Designing a game or an app asks students to plan, imagine, and reason all at once — sharpening the instincts they'll use to build far more later on.</p>
  </div>
  <div class="why-grid">
    <div class="why-card" style="background:#F1F7FD; border-color:#DCEBFA;">
      <div class="why-icon wi-1">&#129504;</div>
      <h3>Sharper thinking</h3>
      <p>Sequencing, logic, and pattern recognition — trained the same way math and science are.</p>
    </div>
    <div class="why-card" style="background:#FDF3F0; border-color:#F8E1D8;">
      <div class="why-icon wi-2">&#127912;</div>
      <h3>Real creativity</h3>
      <p>Every character, level, and screen is a creative decision, not just a technical one.</p>
    </div>
    <div class="why-card" style="background:#FDF7EC; border-color:#F5E2C0;">
      <div class="why-icon wi-3">&#128295;</div>
      <h3>Confidence to build</h3>
      <p>Shipping something real teaches students they can build what they imagine.</p>
    </div>
    <div class="why-card" style="background:#F3F8ED; border-color:#E1EDCF;">
      <div class="why-icon wi-4">&#127919;</div>
      <h3>A lasting habit</h3>
      <p>Breaking ideas into steps, debugging, iterating — skills that scale to bigger builds ahead.</p>
    </div>
  </div>
</section>

<section class="course-section game" id="game">
  <div class="course-inner">
    <div class="course-copy">
      <div class="course-tagline-badge">GAME DEVELOPMENT</div>
      <h2>Design worlds, <em>code the rules</em></h2>
      <p class="desc">Students build a complete, playable game from scratch, using the same free, open-source engines professional studios rely on.</p>
      <div class="stack-row2">
        <div class="stack-pill2">Godot Engine</div>
        <div class="stack-pill2">Scratch</div>
        <div class="stack-pill2">GDScript</div>
      </div>
      <div class="benefit-list2">
        <div class="benefit2"><div class="benefit2-dash"></div><div class="benefit2-text"><b>Computational thinking</b> — loops and logic, learned by building, not memorizing.</div></div>
        <div class="benefit2"><div class="benefit2-dash"></div><div class="benefit2-text"><b>Creative ownership</b> — every student designs their own characters and story.</div></div>
        <div class="benefit2"><div class="benefit2-dash"></div><div class="benefit2-text"><b>Portfolio-ready</b> — a finished, playable game to show, not just a certificate.</div></div>
      </div>
      <div class="course-footer-note">Open to Classes 6–12 &middot; free, open-source tools</div>
    </div>
    <div class="panel-stack">
      <div class="hud-card2">
        <div class="hud-title2">build_progress.log</div>
        <div class="stage-list2">
          <span class="done">[✓] world &amp; character design</span>
          <span class="done">[✓] movement &amp; physics</span>
          <span>[ ] enemy logic &amp; scoring</span>
        </div>
        <div class="progress-track2"><div class="progress-fill2" style="width:55%"></div></div>
      </div>
      <div class="hud-card2">
        <div class="hud-title2">student.output</div>
        <div class="stage-list2">
          <span>&gt; engine: Godot 4</span>
          <span>&gt; skills: logic, design, art</span>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="course-section app" id="app">
  <div class="course-inner">
    <div class="course-copy">
      <div class="course-tagline-badge">APP DEVELOPMENT</div>
      <h2>Turn an idea into <em>a working app</em></h2>
      <p class="desc">Students design and build a real mobile app, learning interface design, data, and logic with free, open-source tools used by beginners and startups alike.</p>
      <div class="stack-row2">
        <div class="stack-pill2">MIT App Inventor</div>
        <div class="stack-pill2">Python</div>
        <div class="stack-pill2">SQLite</div>
      </div>
      <div class="benefit-list2">
        <div class="benefit2"><div class="benefit2-dash"></div><div class="benefit2-text"><b>Systems thinking</b> — how screens, data, and logic connect into one product.</div></div>
        <div class="benefit2"><div class="benefit2-dash"></div><div class="benefit2-text"><b>Design sense</b> — hands-on practice laying out screens people enjoy using.</div></div>
        <div class="benefit2"><div class="benefit2-dash"></div><div class="benefit2-text"><b>Launch-ready</b> — a working app students can install and demo themselves.</div></div>
      </div>
      <div class="course-footer-note">Open to Classes 6–12 &middot; free, open-source tools</div>
    </div>
    <div class="panel-stack">
      <div class="hud-card2">
        <div class="hud-title2">build_progress.log</div>
        <div class="stage-list2">
          <span class="done">[✓] wireframes &amp; screens</span>
          <span class="done">[✓] app logic</span>
          <span>[ ] database connection</span>
        </div>
        <div class="progress-track2"><div class="progress-fill2" style="width:55%"></div></div>
      </div>
      <div class="hud-card2">
        <div class="hud-title2">student.output</div>
        <div class="stage-list2">
          <span>&gt; platform: App Inventor</span>
          <span>&gt; skills: UI, logic, data</span>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="more-courses">
  <div class="eyebrow">What's ahead</div>
  <h2>More STEM courses are on the way</h2>
  <p>Game Development and App Development are the first of several STEM courses joining VidyaLoop — each built around the same idea: learn by building something real.</p>
  <div class="coming-row">
    <div class="coming-card" style="background:#F3F1FC;">
      <div class="coming-icon ci-1">&#129302;</div>
      <h4>Robotics</h4>
      <span>Coming soon</span>
    </div>
    <div class="coming-card" style="background:#FBEAF0;">
      <div class="coming-icon ci-2">&#128202;</div>
      <h4>Data &amp; AI basics</h4>
      <span>Coming soon</span>
    </div>
    <div class="coming-card" style="background:#EEF9F3;">
      <div class="coming-icon ci-3">&#127760;</div>
      <h4>Web design</h4>
      <span>Coming soon</span>
    </div>
  </div>
</section>

<footer>
  <div class="serif">VidyaLoop</div>
  <div class="mono">CBSE-aligned &middot; NEP 2020</div>
</footer>

</body>
</html>`;

function StemCourses() {
  return (
    <div dangerouslySetInnerHTML={{ __html: stemCoursesHtml }} />
  );
}

export default StemCourses;
