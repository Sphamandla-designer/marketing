#!/usr/bin/env python3
"""Print stationery: business cards, letterhead and the email signature.

Print files are built at 300 dpi with a 1/8in (3.175mm) bleed on every edge.
The trim line and the safe margin are called out in `brand-assets/README.md`.
"""

from __future__ import annotations

from system import (
    INK, MAGENTA, SLATE, WHITE, TAGLINE, WEB, EMAIL, PHONE,
    page, logo_img, watermark, blades, wedge,
)

DPI = 300
BLEED = int(0.125 * DPI)          # 37.5 -> 37px each edge
CARD_W, CARD_H = 1050 + 2 * 37, 600 + 2 * 37   # 3.5x2in trim + bleed

# Placeholder cardholder — swap before ordering a print run.
NAME = "Full Name"
ROLE = "Role / Title"
ADDRESS = "Johannesburg, South Africa"


def business_card_front():
    body = f"""
    <div class="canvas bg-ink" style="width:{CARD_W}px;height:{CARD_H}px;">
      <div class="stripes"></div>
      {watermark('ax-mark-mono-white.png', size='520px', top='-130px', left='-150px', opacity=0.07)}
      {blades(1010, 560, 280, count=3, thickness=9, gap=30)}
      <div class="col" style="height:100%;align-items:center;justify-content:center;gap:26px;">
        {logo_img('ax-logo-white-on-dark.png', width=470)}
        <div class="meta" style="font-size:16px;">{TAGLINE.rstrip('.')}</div>
      </div>
    </div>"""
    return dict(out="stationery/business-card-front-print-1124x674.png",
                html=page(CARD_W, CARD_H, body), width=CARD_W, height=CARD_H, scale=1)


def business_card_back():
    rows = [("M", PHONE), ("E", EMAIL), ("W", WEB), ("A", ADDRESS)]
    lines = "".join(f"""
      <div class="row" style="gap:18px;align-items:center;">
        <div class="num" style="font-size:15px;font-weight:700;color:{MAGENTA};width:16px;">{k}</div>
        <div style="font-size:22px;color:{INK};font-weight:500;">{v}</div>
      </div>""" for k, v in rows)
    body = f"""
    <div class="canvas bg-white" style="width:{CARD_W}px;height:{CARD_H}px;">
      <div class="stripes-dark"></div>
      {wedge('bottom-right', 230)}
      {watermark('ax-mark-mono-white.png', size='170px', bottom='-18px', right='-24px', opacity=0.2)}
      <div class="col" style="height:100%;padding:86px 90px;justify-content:space-between;
           align-items:flex-start;">
        {logo_img('ax-mark-primary-on-light.png', height=58)}
        <div class="col" style="gap:30px;align-items:flex-start;">
          <div class="col" style="gap:8px;align-items:flex-start;">
            <div class="headline" style="font-size:40px;color:{INK};">{NAME}</div>
            <div class="eyebrow" style="font-size:14px;">{ROLE}</div>
          </div>
          <div style="height:2px;width:56px;background:{MAGENTA};"></div>
          <div class="col" style="gap:11px;">{lines}</div>
        </div>
      </div>
    </div>"""
    return dict(out="stationery/business-card-back-print-1124x674.png",
                html=page(CARD_W, CARD_H, body), width=CARD_W, height=CARD_H, scale=1)


# ------------------------------------------------------------ letterhead ----

A4_W, A4_H = 2480, 3508   # A4 at 300 dpi


def _letterhead(body_html: str, out: str):
    contact = "".join(f'<div style="font-size:36px;color:{SLATE};">{v}</div>'
                      for v in (PHONE, EMAIL, WEB))
    html = f"""
    <div class="canvas bg-white" style="width:{A4_W}px;height:{A4_H}px;">
      {watermark('ax-mark-mono-black.png', size='1100px', bottom='-300px', right='-330px', opacity=0.035)}
      {blades(2380, 130, 360, count=3, thickness=12, gap=38)}
      <div class="col" style="height:100%;padding:210px 240px 170px;">
        <div class="row" style="justify-content:space-between;align-items:flex-start;">
          {logo_img('ax-logo-primary-on-light.png', height=168)}
          <div class="col" style="gap:10px;align-items:flex-end;margin-top:16px;">{contact}</div>
        </div>
        <div style="height:3px;background:{MAGENTA};width:190px;margin-top:54px;"></div>
        <div class="col" style="flex:1;padding-top:96px;">{body_html}</div>
        <div style="height:1px;background:rgba(12,12,12,.14);margin-bottom:34px;"></div>
        <div class="row" style="justify-content:space-between;align-items:center;">
          <div class="meta meta-dark" style="font-size:28px;">{TAGLINE}</div>
          <div class="meta meta-dark" style="font-size:28px;">{WEB}</div>
        </div>
      </div>
    </div>"""
    return dict(out=out, html=page(A4_W, A4_H, html), width=A4_W, height=A4_H, scale=1)


def letterhead_blank():
    return _letterhead("", "stationery/letterhead-a4-blank-2480x3508.png")


def letterhead_example():
    para = ("font-size:44px;line-height:1.65;color:rgba(12,12,12,.78);max-width:1760px;")
    body = f"""
      <div style="font-size:38px;color:{SLATE};letter-spacing:.04em;">[Date]</div>
      <div class="headline" style="font-size:72px;color:{INK};margin:52px 0 20px;">
        Proposal: website redesign and conversion programme
      </div>
      <div style="{para}margin-bottom:34px;">Dear [Client name],</div>
      <div style="{para}margin-bottom:30px;">
        Thank you for the brief. This letter sets out how we would approach the work,
        what it costs, and the outcome we would hold ourselves to.
      </div>
      <div style="{para}margin-bottom:30px;">
        [Body copy. Set at 10-11pt with generous leading. Keep the left margin at
        the logo's left edge so the whole page reads off one line.]
      </div>
      <div style="{para}margin-bottom:96px;">
        [Second paragraph.]
      </div>
      <div style="{para}">Kind regards,</div>
      <div class="headline" style="font-size:52px;color:{INK};margin-top:86px;">{NAME}</div>
      <div class="eyebrow" style="font-size:30px;margin-top:14px;">{ROLE}</div>
    """
    return _letterhead(body, "stationery/letterhead-a4-example-2480x3508.png")


# ------------------------------------------------------- email signature ----

def email_signature():
    w, h = 600, 170
    rows = [("Mobile", PHONE), ("Email", EMAIL), ("Web", WEB)]
    lines = "".join(f"""
      <div class="row" style="gap:10px;">
        <div style="font-size:12px;color:{MAGENTA};font-weight:600;width:52px;">{k}</div>
        <div style="font-size:12px;color:{INK};font-weight:500;">{v}</div>
      </div>""" for k, v in rows)
    body = f"""
    <div class="canvas bg-white" style="width:{w}px;height:{h}px;">
      <div class="row" style="height:100%;padding:24px 28px;gap:26px;align-items:stretch;">
        <div class="col" style="justify-content:center;">
          {logo_img('ax-logo-primary-on-light.png', height=62)}
        </div>
        <div style="width:2px;background:{MAGENTA};"></div>
        <div class="col" style="justify-content:center;gap:7px;">
          <div class="headline" style="font-size:19px;color:{INK};">{NAME}</div>
          <div class="eyebrow" style="font-size:9px;">{ROLE}</div>
          <div class="col" style="gap:3px;margin-top:6px;">{lines}</div>
        </div>
      </div>
      <div style="position:absolute;left:0;bottom:0;width:100%;height:4px;background:{MAGENTA};"></div>
    </div>"""
    return dict(out="stationery/email-signature-600x170@2x.png",
                html=page(w, h, body), width=w, height=h, scale=2)


def all_assets():
    return [business_card_front(), business_card_back(),
            letterhead_blank(), letterhead_example(), email_signature()]
