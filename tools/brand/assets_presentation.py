#!/usr/bin/env python3
"""16:9 deck slides and a video-call background, all at 1920x1080."""

from __future__ import annotations

from system import (
    INK, MAGENTA, WHITE, SERVICES, PROCESS, TAGLINE, WEB, EMAIL,
    page, logo_img, watermark, blades, wedge,
)

W, H = 1920, 1080


def _footer(text: str, right: str = WEB, dark: bool = False) -> str:
    cls = "meta meta-dark" if dark else "meta"
    return f"""
      <div class="row" style="justify-content:space-between;align-items:center;width:100%;">
        <div class="row" style="gap:16px;align-items:center;">
          <div class="tick" style="width:36px;height:3px;"></div>
          <div class="{cls}" style="font-size:15px;">{text}</div>
        </div>
        <div class="{cls}" style="font-size:15px;">{right}</div>
      </div>"""


def slide_title():
    body = f"""
    <div class="canvas bg-gradient" style="width:{W}px;height:{H}px;">
      <div class="stripes"></div>
      {watermark('ax-mark-mono-white.png', size='1150px', top='-260px', right='-300px', opacity=0.07)}
      {blades(1560, 690, 520, count=3, thickness=14, gap=44)}
      <div class="col" style="height:100%;padding:100px 120px;justify-content:space-between;
           align-items:flex-start;">
        {logo_img('ax-logo-white-on-dark.png', height=96)}
        <div class="col" style="gap:34px;align-items:flex-start;">
          <div class="eyebrow" style="font-size:18px;">Client proposal · 2026</div>
          <div class="display" style="font-size:104px;max-width:1220px;">
            Designing digital experiences that <span class="accent">perform</span>.
          </div>
          <div class="body" style="font-size:28px;max-width:860px;">
            Prepared for [Client name] · [Date]
          </div>
        </div>
        {_footer('AX-Channels')}
      </div>
    </div>"""
    return dict(out="presentation/slide-01-title-1920x1080.png",
                html=page(W, H, body), width=W, height=H, scale=1)


def slide_section():
    body = f"""
    <div class="canvas bg-magenta" style="width:{W}px;height:{H}px;">
      <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(
           38.4deg, rgba(255,255,255,.08) 0 2px, rgba(255,255,255,0) 2px 32px);"></div>
      {watermark('ax-mark-mono-white.png', size='1000px', bottom='-280px', left='-300px', opacity=0.13)}
      <div class="col" style="height:100%;padding:100px 120px;justify-content:space-between;
           align-items:flex-start;">
        <div class="row" style="justify-content:space-between;width:100%;align-items:center;">
          <div class="eyebrow" style="font-size:18px;color:rgba(255,255,255,.8);">Section 02</div>
          {logo_img('ax-mark-mono-white.png', height=46)}
        </div>
        <div class="col" style="gap:28px;align-items:flex-start;">
          <div class="display" style="font-size:118px;">The approach</div>
          <div class="body" style="font-size:30px;color:rgba(255,255,255,.88);max-width:900px;">
            How we get from the brief you have to the numbers you need.
          </div>
        </div>
        <div class="meta" style="font-size:15px;color:rgba(255,255,255,.75);">{WEB}</div>
      </div>
    </div>"""
    return dict(out="presentation/slide-02-section-1920x1080.png",
                html=page(W, H, body), width=W, height=H, scale=1)


def slide_content():
    cards = "".join(f"""
      <div class="col" style="flex:1;gap:16px;justify-content:flex-end;padding:52px 40px;
           background:rgba(255,255,255,.045);border-top:3px solid {MAGENTA};">
        <div class="num" style="font-size:20px;font-weight:700;color:rgba(255,255,255,.45);">{n}</div>
        <div class="headline" style="font-size:38px;">{title}</div>
        <div class="body" style="font-size:20px;">{note}</div>
      </div>""" for n, title, note in PROCESS)
    body = f"""
    <div class="canvas bg-ink" style="width:{W}px;height:{H}px;">
      {watermark('ax-mark-mono-white.png', size='820px', bottom='-250px', right='-260px', opacity=0.05)}
      <div class="col" style="height:100%;padding:90px 120px;justify-content:space-between;">
        <div class="row" style="justify-content:space-between;align-items:center;">
          <div class="col" style="gap:16px;">
            <div class="eyebrow" style="font-size:18px;">How we work</div>
            <div class="headline" style="font-size:64px;">Four steps, start to live.</div>
          </div>
          {logo_img('ax-mark-mono-white.png', height=44)}
        </div>
        <div class="row" style="gap:30px;align-items:stretch;flex:1;margin:62px 0;">{cards}</div>
        {_footer('The approach')}
      </div>
    </div>"""
    return dict(out="presentation/slide-03-content-1920x1080.png",
                html=page(W, H, body), width=W, height=H, scale=1)


def slide_stats():
    stats = [("01", "Discovery", "Weeks 1-2"), ("02", "Design", "Weeks 3-6"),
             ("03", "Build", "Weeks 7-11"), ("04", "Optimise", "Ongoing")]
    cells = "".join(f"""
      <div class="col" style="flex:1;gap:12px;padding:52px 40px;justify-content:flex-end;
           background:{'rgba(214,47,108,.10)' if i == 1 else 'rgba(12,12,12,.04)'};
           border-left:3px solid {MAGENTA if i == 1 else 'rgba(12,12,12,.12)'};">
        <div class="num" style="font-size:18px;font-weight:700;color:{MAGENTA};">{n}</div>
        <div class="headline" style="font-size:36px;color:{INK};">{label}</div>
        <div class="body-dark" style="font-size:20px;">{when}</div>
      </div>""" for i, (n, label, when) in enumerate(stats))
    body = f"""
    <div class="canvas bg-white" style="width:{W}px;height:{H}px;">
      <div class="stripes-dark"></div>
      {watermark('ax-mark-mono-black.png', size='720px', top='-220px', right='-230px', opacity=0.045)}
      <div class="col" style="height:100%;padding:90px 120px;justify-content:space-between;">
        <div class="row" style="justify-content:space-between;align-items:center;">
          <div class="col" style="gap:16px;">
            <div class="eyebrow" style="font-size:18px;">Timeline</div>
            <div class="headline" style="font-size:64px;color:{INK};">A twelve week runway.</div>
          </div>
          {logo_img('ax-logo-primary-on-light.png', height=74)}
        </div>
        <div class="row" style="gap:26px;align-items:stretch;flex:1;margin:62px 0;">{cells}</div>
        {_footer('Indicative schedule — confirmed at kick-off', WEB, dark=True)}
      </div>
    </div>"""
    return dict(out="presentation/slide-04-timeline-1920x1080.png",
                html=page(W, H, body), width=W, height=H, scale=1)


def slide_closing():
    body = f"""
    <div class="canvas bg-gradient" style="width:{W}px;height:{H}px;">
      <div class="stripes"></div>
      {watermark('ax-mark-mono-white.png', size='1250px', bottom='-330px', left='-330px', opacity=0.07)}
      {blades(1530, 400, 480, count=3, thickness=14, gap=44)}
      <div class="col" style="height:100%;padding:100px 120px;justify-content:space-between;
           align-items:flex-start;">
        {logo_img('ax-logo-white-on-dark.png', height=90)}
        <div class="col" style="gap:36px;align-items:flex-start;">
          <div class="display" style="font-size:96px;max-width:1150px;">Thank you.</div>
          <div class="subhead" style="font-size:34px;max-width:900px;">{TAGLINE}</div>
          <div class="row" style="gap:20px;margin-top:10px;">
            <div class="pill" style="font-size:24px;padding:22px 40px;">{EMAIL}</div>
            <div class="pill-outline" style="font-size:24px;padding:22px 40px;">{WEB}</div>
          </div>
        </div>
        {_footer('Questions welcome')}
      </div>
    </div>"""
    return dict(out="presentation/slide-05-closing-1920x1080.png",
                html=page(W, H, body), width=W, height=H, scale=1)


def video_background():
    """A call background: the middle of the frame stays clear for the speaker."""
    body = f"""
    <div class="canvas" style="width:{W}px;height:{H}px;background:
         radial-gradient(90% 110% at 15% 0%, rgba(214,47,108,.30) 0%, rgba(214,47,108,0) 58%),
         linear-gradient(155deg, #16161A 0%, {INK} 58%, #08080A 100%);">
      <div class="stripes"></div>
      {watermark('ax-mark-mono-white.png', size='900px', top='-240px', left='-250px', opacity=0.05)}
      {blades(1820, 210, 340, count=3, thickness=10, gap=32, opacity=0.85)}
      <div class="col" style="position:absolute;left:100px;bottom:86px;gap:18px;align-items:flex-start;">
        {logo_img('ax-logo-white-on-dark.png', height=76)}
        <div class="meta" style="font-size:15px;">{TAGLINE}</div>
      </div>
      <div class="meta" style="position:absolute;right:100px;bottom:92px;font-size:15px;">{WEB}</div>
    </div>"""
    return dict(out="presentation/video-call-background-1920x1080.png",
                html=page(W, H, body), width=W, height=H, scale=1)


def all_assets():
    return [slide_title(), slide_section(), slide_content(), slide_stats(),
            slide_closing(), video_background()]
