#!/usr/bin/env python3
"""Longer-form collateral: web hero, capability one-pager and a promo poster."""

from __future__ import annotations

from system import (
    INK, MAGENTA, SLATE, WHITE, SERVICES, PROCESS, PROOF, TAGLINE, WEB, EMAIL, PHONE,
    page, logo_img, watermark, blades, wedge,
)

A4_W, A4_H = 2480, 3508   # A4 at 300 dpi


def web_hero():
    """Homepage hero banner — also works as a website OG/preview image."""
    w, h = 1920, 960
    body = f"""
    <div class="canvas bg-gradient" style="width:{w}px;height:{h}px;">
      <div class="stripes"></div>
      {watermark('ax-mark-mono-white.png', size='1250px', top='-180px', right='-260px', opacity=0.09)}
      {blades(1180, 820, 460, count=3, thickness=12, gap=40)}
      <div class="row" style="height:100%;padding:0 110px;align-items:center;">
        <div class="col" style="gap:34px;align-items:flex-start;max-width:1000px;">
          <div class="row" style="gap:20px;align-items:center;">
            <div class="tick" style="width:40px;height:3px;"></div>
            <div class="eyebrow" style="font-size:17px;">Digital Experience Studio · South Africa</div>
          </div>
          <div class="display" style="font-size:92px;">
            We design digital experiences that <span class="accent">perform</span>.
          </div>
          <div class="body" style="font-size:27px;max-width:760px;">
            Strategy, interface design and build for brands that need their website,
            product or campaign to do more than look good.
          </div>
          <div class="row" style="gap:18px;margin-top:14px;">
            <div class="pill" style="font-size:21px;padding:22px 40px;">Start a project</div>
            <div class="pill-outline" style="font-size:21px;padding:22px 40px;">See our work</div>
          </div>
        </div>
      </div>
      <div class="row" style="position:absolute;left:110px;bottom:56px;gap:40px;align-items:center;">
        {logo_img('ax-mark-mono-white.png', height=34)}
        <div class="meta" style="font-size:14px;">
          UI/UX  ·  Web Design &amp; Build  ·  Brand Identity  ·  Digital Marketing
        </div>
      </div>
    </div>"""
    return dict(out="collateral/web-hero-1920x960.png",
                html=page(w, h, body), width=w, height=h, scale=1)


def one_pager():
    """A4 capability sheet — leave-behind after a pitch, or an email attachment."""
    cards = "".join(f"""
      <div class="col" style="gap:18px;padding:66px 58px;background:rgba(12,12,12,.035);
           border-top:5px solid {MAGENTA};">
        <div class="headline" style="font-size:66px;color:{INK};">{name}</div>
        <div class="body-dark" style="font-size:40px;">{note}.</div>
      </div>""" for name, note in SERVICES)

    steps = "".join(f"""
      <div class="col" style="flex:1;gap:14px;">
        <div class="num" style="font-size:34px;font-weight:700;color:{MAGENTA};">{n}</div>
        <div class="headline" style="font-size:48px;color:{INK};">{title}</div>
        <div class="body-dark" style="font-size:34px;">{note}</div>
      </div>""" for n, title, note in PROCESS)

    proof = "".join(f"""
      <div class="col" style="flex:1;gap:10px;">
        <div class="display" style="font-size:96px;color:{INK};">{figure}</div>
        <div class="body-dark" style="font-size:34px;">{label}</div>
      </div>""" for figure, label in PROOF)

    body = f"""
    <div class="canvas bg-white" style="width:{A4_W}px;height:{A4_H}px;">
      <div class="stripes-dark"></div>
      {watermark('ax-mark-mono-black.png', size='900px', top='-240px', right='-260px', opacity=0.04)}
      <div class="col" style="height:100%;padding:190px 200px 380px;">
        <div class="row" style="justify-content:space-between;align-items:flex-start;">
          {logo_img('ax-logo-primary-on-light.png', height=160)}
          <div class="col" style="align-items:flex-end;gap:12px;margin-top:14px;">
            <div class="eyebrow" style="font-size:26px;">Capability sheet</div>
            <div style="font-size:34px;color:{SLATE};">2026</div>
          </div>
        </div>

        <div class="col" style="gap:34px;margin-top:120px;">
          <div class="display" style="font-size:132px;color:{INK};max-width:2000px;">
            Designing digital experiences that <span class="accent">perform</span>.
          </div>
          <div class="body-dark" style="font-size:46px;max-width:1780px;">
            AX-Channels is a digital design studio. We take the brief you have, work out
            what actually needs to change, and design and build it — then keep measuring
            it against the outcome it was meant to deliver.
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:110px;">{cards}</div>

        <div class="col" style="margin-top:110px;gap:44px;">
          <div class="row" style="gap:26px;align-items:center;">
            <div class="tick" style="width:70px;height:5px;"></div>
            <div class="eyebrow" style="font-size:26px;">How we work</div>
          </div>
          <div class="row" style="gap:60px;align-items:flex-start;">{steps}</div>
        </div>

        <div class="col" style="margin-top:auto;padding-top:110px;gap:52px;">
          <div class="row" style="gap:60px;align-items:flex-start;
               border-top:1px solid rgba(12,12,12,.14);padding-top:56px;">{proof}</div>
          <div class="col" style="gap:20px;background:rgba(12,12,12,.035);padding:60px 64px;
               border-left:6px solid {MAGENTA};">
            <div class="subhead" style="font-size:46px;color:{INK};">
              "They rebuilt the enquiry journey and we felt it inside a month."
            </div>
            <div class="body-dark" style="font-size:32px;">[Client name] · [Role, Company]</div>
          </div>
        </div>
      </div>

      <div class="row" style="position:absolute;left:0;bottom:0;width:100%;height:280px;
           background:{INK};padding:0 200px;justify-content:space-between;align-items:center;">
        <div class="col" style="gap:14px;">
          <div class="subhead" style="font-size:46px;color:{WHITE};">Let's talk.</div>
          <div class="meta" style="font-size:28px;">{TAGLINE}</div>
        </div>
        <div class="col" style="align-items:flex-end;gap:12px;">
          <div style="font-size:38px;color:{WHITE};font-weight:500;">{EMAIL}</div>
          <div style="font-size:38px;color:rgba(255,255,255,.6);">{PHONE}  ·  {WEB}</div>
        </div>
      </div>
    </div>"""
    return dict(out="collateral/one-pager-a4-capability-2480x3508.png",
                html=page(A4_W, A4_H, body), width=A4_W, height=A4_H, scale=1)


def poster():
    """A4 promo poster for a lead-magnet offer — print or post as a graphic."""
    points = [
        "A page-by-page review of what's costing you enquiries",
        "The three fixes worth doing first, ranked by impact",
        "A written summary you keep, whether you work with us or not",
    ]
    bullets = "".join(f"""
      <div class="row" style="gap:28px;align-items:flex-start;">
        <div style="width:18px;height:18px;background:{MAGENTA};margin-top:18px;flex:none;"></div>
        <div class="body" style="font-size:48px;color:rgba(255,255,255,.82);">{p}</div>
      </div>""" for p in points)

    body = f"""
    <div class="canvas bg-gradient" style="width:{A4_W}px;height:{A4_H}px;">
      <div class="stripes"></div>
      {watermark('ax-mark-mono-white.png', size='1700px', top='-380px', right='-520px', opacity=0.08)}
      {blades(2150, 1450, 900, count=3, thickness=22, gap=72)}
      <div class="col" style="height:100%;padding:230px 200px 200px;justify-content:space-between;
           align-items:flex-start;">
        <div class="row" style="width:100%;justify-content:space-between;align-items:center;">
          {logo_img('ax-logo-white-on-dark.png', height=150)}
          <div class="eyebrow" style="font-size:28px;">Free this month</div>
        </div>

        <div class="col" style="gap:56px;align-items:flex-start;">
          <div class="display" style="font-size:196px;max-width:2100px;">
            Your website<br>audit. On us.
          </div>
          <div class="body" style="font-size:52px;max-width:1700px;">
            Forty-five minutes, a real person, and a straight answer about why your
            site isn't converting.
          </div>
          <div class="col" style="gap:34px;margin-top:40px;">
            <div class="eyebrow" style="font-size:26px;">What you get</div>
            {bullets}
          </div>
        </div>

        <div class="col" style="gap:40px;align-items:flex-start;width:100%;">
          <div class="subhead" style="font-size:56px;max-width:1800px;">
            Six audits a month. Book yours.
          </div>
          <div class="rule" style="width:100%;"></div>
          <div class="row" style="justify-content:space-between;align-items:center;width:100%;">
            <div class="pill" style="font-size:52px;padding:44px 74px;">{EMAIL}</div>
            <div class="col" style="align-items:flex-end;gap:12px;">
              <div class="meta" style="font-size:30px;">{WEB}</div>
              <div class="meta" style="font-size:30px;">{PHONE}</div>
            </div>
          </div>
        </div>
      </div>
    </div>"""
    return dict(out="collateral/poster-a4-offer-2480x3508.png",
                html=page(A4_W, A4_H, body), width=A4_W, height=A4_H, scale=1)


def all_assets():
    return [web_hero(), one_pager(), poster()]
