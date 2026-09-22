#!/usr/bin/env python3
"""Social media artwork: channel headers, feed posts, stories and link cards.

Each layout keeps the platform's own overlays in mind — profile pictures,
sticker-safe areas and centre crops — so nothing important gets covered.
"""

from __future__ import annotations

from system import (
    INK, MAGENTA, WHITE, SERVICES, PROCESS, TAGLINE, WEB, EMAIL,
    page, logo_img, watermark, blades, wedge,
)

SERVICE_LINE = "UI/UX  ·  Web  ·  Brand  ·  Digital Marketing"


def _service_rows(size: int) -> str:
    """The four services as evenly distributed rows that fill their container."""
    rows = "".join(f"""
        <div class="col" style="flex:1;justify-content:center;
             border-top:1px solid rgba(255,255,255,.14);">
          <div class="headline" style="font-size:{size}px;">{name}</div>
          <div class="body" style="font-size:{int(size * 0.36)}px;margin-top:{int(size * 0.14)}px;">{note}</div>
        </div>""" for name, note in SERVICES)
    return (f'<div class="col" style="flex:1;border-bottom:1px solid rgba(255,255,255,.14);">'
            f'{rows}</div>')


# ------------------------------------------------------------- headers ----

def linkedin_personal_banner():
    w, h = 1584, 396
    body = f"""
    <div class="canvas bg-gradient" style="width:{w}px;height:{h}px;">
      <div class="stripes"></div>
      {watermark('ax-mark-mono-white.png', size='760px', top='-170px', right='-180px', opacity=0.07)}
      {blades(170, 198, 460, count=3, thickness=10, gap=34)}
      <div class="row" style="height:100%;padding:0 92px 0 340px;gap:50px;">
        {logo_img('ax-logo-white-on-dark.png', height=102)}
        <div style="width:1px;height:118px;background:rgba(255,255,255,.18);"></div>
        <div class="col" style="gap:16px;">
          <div class="subhead" style="font-size:29px;white-space:nowrap;">{TAGLINE}</div>
          <div class="meta" style="font-size:15px;">{SERVICE_LINE}</div>
        </div>
        <div class="col" style="margin-left:auto;align-items:flex-end;gap:10px;">
          <div class="eyebrow" style="font-size:13px;">Let's talk</div>
          <div class="subhead" style="font-size:22px;">{WEB}</div>
        </div>
      </div>
    </div>"""
    return dict(out="social/linkedin-personal-banner-1584x396.png",
                html=page(w, h, body), width=w, height=h, scale=1)


def linkedin_company_banner():
    w, h = 1128, 191
    body = f"""
    <div class="canvas bg-ink" style="width:{w}px;height:{h}px;">
      {watermark('ax-mark-mono-white.png', size='360px', top='-80px', right='-60px', opacity=0.08)}
      {blades(110, 95, 250, count=3, thickness=7, gap=24)}
      <div class="row" style="height:100%;padding:0 56px 0 250px;gap:32px;">
        {logo_img('ax-logo-white-on-dark.png', height=56)}
        <div style="width:1px;height:62px;background:rgba(255,255,255,.18);"></div>
        <div class="subhead" style="font-size:19px;max-width:420px;">{TAGLINE}</div>
        <div class="meta" style="font-size:12px;margin-left:auto;">{WEB}</div>
      </div>
    </div>"""
    return dict(out="social/linkedin-company-cover-1128x191.png",
                html=page(w, h, body), width=w, height=h, scale=2)


def x_header():
    w, h = 1500, 500
    body = f"""
    <div class="canvas bg-gradient" style="width:{w}px;height:{h}px;">
      <div class="stripes"></div>
      {watermark('ax-mark-mono-white.png', size='840px', top='-200px', right='-210px', opacity=0.07)}
      {blades(190, 250, 520, count=3, thickness=11, gap=38)}
      <div class="col" style="height:100%;justify-content:center;padding:0 110px 0 410px;gap:26px;
           align-items:flex-start;">
        {logo_img('ax-logo-white-on-dark.png', height=118)}
        <div class="subhead" style="font-size:30px;">{TAGLINE}</div>
        <div class="meta" style="font-size:15px;">{SERVICE_LINE}</div>
      </div>
    </div>"""
    return dict(out="social/x-header-1500x500.png",
                html=page(w, h, body), width=w, height=h, scale=1)


def facebook_cover():
    w, h = 1640, 856
    body = f"""
    <div class="canvas bg-gradient" style="width:{w}px;height:{h}px;">
      <div class="stripes"></div>
      {watermark('ax-mark-mono-white.png', size='1050px', top='-290px', left='-280px', opacity=0.06)}
      {blades(1395, 660, 560, count=3, thickness=13, gap=42)}
      <div class="col" style="height:100%;align-items:center;justify-content:center;gap:34px;">
        {logo_img('ax-lockup-tagline-white-on-dark.png', width=600)}
        <div class="rule" style="width:180px;"></div>
        <div class="meta" style="font-size:18px;">{SERVICE_LINE}</div>
        <div class="pill" style="font-size:19px;padding:18px 36px;margin-top:6px;">{WEB}</div>
      </div>
    </div>"""
    return dict(out="social/facebook-cover-1640x856.png",
                html=page(w, h, body), width=w, height=h, scale=1)


def youtube_banner():
    w, h = 2560, 1440
    body = f"""
    <div class="canvas bg-gradient" style="width:{w}px;height:{h}px;">
      <div class="stripes"></div>
      {watermark('ax-mark-mono-white.png', size='1600px', top='-380px', right='-380px', opacity=0.06)}
      {blades(430, 720, 900, count=3, thickness=18, gap=62)}
      <!-- everything sits inside the 1546x423 all-device safe area -->
      <div class="col" style="position:absolute;left:507px;top:508px;width:1546px;height:423px;
           align-items:center;justify-content:center;gap:30px;">
        {logo_img('ax-logo-white-on-dark.png', height=168)}
        <div class="subhead" style="font-size:38px;">{TAGLINE}</div>
        <div class="meta" style="font-size:20px;">{SERVICE_LINE}</div>
      </div>
    </div>"""
    return dict(out="social/youtube-banner-2560x1440.png",
                html=page(w, h, body), width=w, height=h, scale=1)


# --------------------------------------------------------- feed squares ----

def instagram_brand():
    s = 1080
    body = f"""
    <div class="canvas bg-gradient" style="width:{s}px;height:{s}px;">
      <div class="stripes"></div>
      {watermark('ax-mark-mono-white.png', size='960px', top='-230px', right='-300px', opacity=0.07)}
      {blades(945, 560, 420, count=3, thickness=12, gap=38)}
      <div class="col" style="height:100%;padding:86px;justify-content:space-between;
           align-items:flex-start;">
        <div class="eyebrow" style="font-size:19px;">Digital Experience Studio</div>
        <div class="col" style="gap:40px;align-items:flex-start;">
          {logo_img('ax-logo-white-on-dark.png', width=540)}
          <div class="rule" style="width:120px;"></div>
          <div class="subhead" style="font-size:40px;max-width:700px;">{TAGLINE}</div>
        </div>
        <div class="row" style="justify-content:space-between;align-items:flex-end;width:100%;">
          <div class="meta" style="font-size:17px;">{WEB}</div>
          <div class="meta" style="font-size:17px;">AX—01</div>
        </div>
      </div>
    </div>"""
    return dict(out="social/instagram-01-brand-1080x1080.png",
                html=page(s, s, body), width=s, height=s, scale=1)


def instagram_services():
    s = 1080
    body = f"""
    <div class="canvas bg-ink" style="width:{s}px;height:{s}px;">
      {watermark('ax-mark-mono-white.png', size='720px', bottom='-210px', right='-230px', opacity=0.06)}
      <div class="col" style="height:100%;padding:86px;">
        <div class="row" style="justify-content:space-between;align-items:center;">
          <div class="eyebrow" style="font-size:19px;">What we do</div>
          {logo_img('ax-mark-mono-white.png', height=40)}
        </div>
        <div class="col" style="flex:1;margin:48px 0 40px;">{_service_rows(54)}</div>
        <div class="row" style="gap:18px;align-items:center;">
          <div class="tick" style="width:44px;height:4px;"></div>
          <div class="meta" style="font-size:17px;">{WEB}</div>
        </div>
      </div>
    </div>"""
    return dict(out="social/instagram-02-services-1080x1080.png",
                html=page(s, s, body), width=s, height=s, scale=1)


def instagram_statement():
    s = 1080
    body = f"""
    <div class="canvas bg-magenta" style="width:{s}px;height:{s}px;">
      <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(
           38.4deg, rgba(255,255,255,.085) 0 2px, rgba(255,255,255,0) 2px 30px);"></div>
      {watermark('ax-mark-mono-white.png', size='880px', bottom='-250px', left='-270px', opacity=0.13)}
      <div class="col" style="height:100%;padding:90px;justify-content:space-between;
           align-items:flex-start;">
        <div class="eyebrow" style="font-size:19px;color:rgba(255,255,255,.78);">Our position</div>
        <div class="display" style="font-size:84px;max-width:880px;">
          Design that<br>performs.<br>Not design that<br>just looks good.
        </div>
        <div class="row" style="justify-content:space-between;align-items:flex-end;width:100%;">
          <div class="body" style="font-size:23px;color:rgba(255,255,255,.88);max-width:560px;">
            Every screen we ship is measured against the outcome it was built for.
          </div>
          {logo_img('ax-mark-mono-white.png', height=54)}
        </div>
      </div>
    </div>"""
    return dict(out="social/instagram-03-statement-1080x1080.png",
                html=page(s, s, body), width=s, height=s, scale=1)


def instagram_cta():
    s = 1080
    body = f"""
    <div class="canvas bg-white" style="width:{s}px;height:{s}px;">
      <div class="stripes-dark"></div>
      {wedge('bottom-right', 340)}
      {watermark('ax-mark-mono-white.png', size='260px', bottom='-30px', right='-40px', opacity=0.18)}
      <div class="col" style="height:100%;padding:90px;justify-content:space-between;
           align-items:flex-start;">
        <div class="row" style="width:100%;justify-content:space-between;align-items:flex-start;">
          {logo_img('ax-logo-primary-on-light.png', height=92)}
          <div class="meta meta-dark" style="font-size:16px;margin-top:8px;">{WEB}</div>
        </div>
        <div class="col" style="gap:32px;align-items:flex-start;">
          <div class="eyebrow" style="font-size:19px;">Start a project</div>
          <div class="display" style="font-size:78px;color:{INK};max-width:780px;">
            Let's build your next digital experience.
          </div>
          <div class="body-dark" style="font-size:25px;max-width:600px;">
            Tell us what needs to perform better. We'll tell you what it takes.
          </div>
        </div>
        <div class="pill" style="font-size:25px;padding:24px 42px;">{EMAIL}</div>
      </div>
    </div>"""
    return dict(out="social/instagram-04-cta-1080x1080.png",
                html=page(s, s, body), width=s, height=s, scale=1)


def instagram_process():
    s = 1080
    cards = "".join(f"""
      <div class="col" style="background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);
           padding:36px 32px;gap:12px;justify-content:center;">
        <div class="num accent" style="font-size:28px;font-weight:700;">{n}</div>
        <div class="headline" style="font-size:36px;">{title}</div>
        <div class="body" style="font-size:18px;">{note}</div>
      </div>""" for n, title, note in PROCESS)
    body = f"""
    <div class="canvas bg-ink" style="width:{s}px;height:{s}px;">
      {watermark('ax-mark-mono-white.png', size='660px', top='-190px', left='-210px', opacity=0.05)}
      <div class="col" style="height:100%;padding:80px;gap:42px;">
        <div class="row" style="justify-content:space-between;align-items:center;">
          <div class="col" style="gap:14px;">
            <div class="eyebrow" style="font-size:19px;">How we work</div>
            <div class="headline" style="font-size:50px;">Four steps. No mystery.</div>
          </div>
          {logo_img('ax-mark-mono-white.png', height=40)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;
             gap:22px;flex:1;">{cards}</div>
        <div class="row" style="gap:18px;align-items:center;">
          <div class="tick" style="width:44px;height:4px;"></div>
          <div class="meta" style="font-size:17px;">{WEB}</div>
        </div>
      </div>
    </div>"""
    return dict(out="social/instagram-05-process-1080x1080.png",
                html=page(s, s, body), width=s, height=s, scale=1)


# -------------------------------------------------------------- stories ----

def story_brand():
    w, h = 1080, 1920
    body = f"""
    <div class="canvas bg-gradient" style="width:{w}px;height:{h}px;">
      <div class="stripes"></div>
      {watermark('ax-mark-mono-white.png', size='1050px', top='-150px', right='-380px', opacity=0.07)}
      {blades(900, 760, 520, count=3, thickness=13, gap=42)}
      <!-- content sits inside the 250px top / 250px bottom sticker-safe area -->
      <div class="col" style="height:100%;padding:300px 86px;justify-content:space-between;
           align-items:flex-start;">
        <div class="col" style="gap:34px;align-items:flex-start;">
          <div class="eyebrow" style="font-size:21px;">Digital Experience Studio</div>
          {logo_img('ax-logo-white-on-dark.png', width=500)}
        </div>
        <div class="col" style="gap:30px;">
          <div class="display" style="font-size:76px;max-width:880px;">
            Designing digital experiences that <span class="accent">perform</span>.
          </div>
          <div class="body" style="font-size:27px;max-width:720px;">
            Strategy, interface design and build for brands that need the numbers to move.
          </div>
        </div>
        <div class="col" style="gap:22px;width:100%;">
          <div class="rule" style="width:100%;"></div>
          <div class="row" style="justify-content:space-between;width:100%;">
            <div class="meta" style="font-size:20px;">{WEB}</div>
            <div class="meta" style="font-size:20px;">Tap to see more</div>
          </div>
        </div>
      </div>
    </div>"""
    return dict(out="social/instagram-story-01-brand-1080x1920.png",
                html=page(w, h, body), width=w, height=h, scale=1)


def story_services():
    w, h = 1080, 1920
    items = "".join(f"""
      <div class="row" style="gap:26px;align-items:baseline;padding:26px 0;
           border-top:1px solid rgba(255,255,255,.22);">
        <div class="num" style="font-size:22px;font-weight:700;color:rgba(255,255,255,.6);">{i:02d}</div>
        <div class="headline" style="font-size:46px;">{name}</div>
      </div>""" for i, (name, _) in enumerate(SERVICES, 1))
    body = f"""
    <div class="canvas bg-magenta" style="width:{w}px;height:{h}px;">
      <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(
           38.4deg, rgba(255,255,255,.08) 0 2px, rgba(255,255,255,0) 2px 30px);"></div>
      {watermark('ax-mark-mono-white.png', size='960px', bottom='-200px', left='-310px', opacity=0.12)}
      <div class="col" style="height:100%;padding:300px 86px;justify-content:space-between;
           align-items:flex-start;">
        <div class="col" style="gap:26px;align-items:flex-start;">
          <div class="eyebrow" style="font-size:21px;color:rgba(255,255,255,.78);">What we do</div>
          <div class="display" style="font-size:72px;">Four ways we<br>can help.</div>
        </div>
        <div style="width:100%;">{items}</div>
        <div class="col" style="gap:30px;align-items:flex-start;">
          <div class="pill-outline" style="font-size:25px;padding:22px 40px;
               border-color:rgba(255,255,255,.6);">{EMAIL}</div>
          {logo_img('ax-logo-white-on-dark.png', height=72)}
        </div>
      </div>
    </div>"""
    return dict(out="social/instagram-story-02-services-1080x1920.png",
                html=page(w, h, body), width=w, height=h, scale=1)


# ---------------------------------------------------------- link cards ----

def linkedin_post_tagline():
    w, h = 1200, 627
    body = f"""
    <div class="canvas bg-gradient" style="width:{w}px;height:{h}px;">
      <div class="stripes"></div>
      {watermark('ax-mark-mono-white.png', size='680px', top='-140px', right='-190px', opacity=0.07)}
      {blades(1000, 290, 380, count=3, thickness=10, gap=34)}
      <div class="col" style="height:100%;padding:70px;justify-content:space-between;
           align-items:flex-start;">
        {logo_img('ax-logo-white-on-dark.png', height=76)}
        <div class="col" style="gap:22px;">
          <div class="display" style="font-size:58px;max-width:700px;">
            Your website isn't a brochure. It's your best salesperson.
          </div>
          <div class="body" style="font-size:23px;max-width:620px;">
            We design and build the experience that closes the gap between traffic and revenue.
          </div>
        </div>
        <div class="row" style="justify-content:space-between;align-items:center;width:100%;">
          <div class="meta" style="font-size:16px;">{SERVICE_LINE}</div>
          <div class="meta" style="font-size:16px;">{WEB}</div>
        </div>
      </div>
    </div>"""
    return dict(out="social/linkedin-post-01-tagline-1200x627.png",
                html=page(w, h, body), width=w, height=h, scale=1)


def linkedin_post_capabilities():
    w, h = 1200, 627
    cols = "".join(f"""
      <div class="col" style="gap:12px;flex:1;border-top:2px solid {MAGENTA};padding-top:20px;">
        <div class="headline" style="font-size:26px;">{name}</div>
        <div class="body-dark" style="font-size:17px;">{note}</div>
      </div>""" for name, note in SERVICES)
    body = f"""
    <div class="canvas bg-white" style="width:{w}px;height:{h}px;">
      <div class="stripes-dark"></div>
      {watermark('ax-mark-mono-black.png', size='520px', bottom='-150px', right='-170px', opacity=0.05)}
      <div class="col" style="height:100%;padding:68px;justify-content:space-between;">
        <div class="row" style="justify-content:space-between;align-items:flex-start;">
          <div class="col" style="gap:14px;">
            <div class="eyebrow" style="font-size:16px;">Capabilities</div>
            <div class="headline" style="font-size:44px;color:{INK};">One studio, four disciplines.</div>
          </div>
          {logo_img('ax-logo-primary-on-light.png', height=70)}
        </div>
        <div class="row" style="gap:32px;align-items:stretch;">{cols}</div>
        <div class="row" style="justify-content:space-between;align-items:center;">
          <div class="meta meta-dark" style="font-size:16px;">{EMAIL}</div>
          <div class="meta meta-dark" style="font-size:16px;">{WEB}</div>
        </div>
      </div>
    </div>"""
    return dict(out="social/linkedin-post-02-capabilities-1200x627.png",
                html=page(w, h, body), width=w, height=h, scale=1)


def all_assets():
    return [
        linkedin_personal_banner(), linkedin_company_banner(), x_header(),
        facebook_cover(), youtube_banner(),
        instagram_brand(), instagram_services(), instagram_statement(),
        instagram_cta(), instagram_process(),
        story_brand(), story_services(),
        linkedin_post_tagline(), linkedin_post_capabilities(),
    ]
