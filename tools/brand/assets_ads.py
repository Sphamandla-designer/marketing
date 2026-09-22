#!/usr/bin/env python3
"""Display advertising at the standard IAB sizes, rendered at exact pixel size.

Four layouts cover the set: a stacked block for rectangles, a tall column for
the half page, a stripped-back column for the 160px skyscraper, and a single
row for leaderboards, billboards and mobile banners. Each size passes its own
scale factor — deriving one from the canvas alone blows the type up on the
wider units.
"""

from __future__ import annotations

from system import (
    INK, MAGENTA, WHITE, WEB, page, logo_img, watermark, blades,
)

HEADLINE = "Design that performs."
SUB = "Websites and interfaces built to convert."
SHORT_SUB = "Websites built to convert."
CTA = "Book a free audit"


def _rectangle(w: int, h: int, out: str, k: float):
    body = f"""
    <div class="canvas bg-gradient" style="width:{w}px;height:{h}px;">
      <div class="stripes"></div>
      {watermark('ax-mark-mono-white.png', size=f'{int(190 * k)}px',
                 top=f'{int(-40 * k)}px', right=f'{int(-50 * k)}px', opacity=0.1)}
      {blades(w * 0.86, h * 0.66, 100 * k, count=3, thickness=4 * k, gap=12 * k)}
      <div class="col" style="height:100%;padding:{20 * k:.0f}px;justify-content:space-between;
           align-items:flex-start;">
        {logo_img('ax-logo-white-on-dark.png', height=28 * k)}
        <div class="col" style="gap:{7 * k:.0f}px;align-items:flex-start;">
          <div class="display" style="font-size:{29 * k:.0f}px;max-width:{w - 40 * k:.0f}px;">{HEADLINE}</div>
          <div class="body" style="font-size:{13 * k:.0f}px;max-width:{w - 105 * k:.0f}px;">{SUB}</div>
        </div>
        <div class="pill" style="font-size:{13 * k:.0f}px;padding:{11 * k:.0f}px {20 * k:.0f}px;">{CTA}</div>
      </div>
    </div>"""
    return dict(out=out, html=page(w, h, body), width=w, height=h, scale=1)


def _half_page(w: int, h: int, out: str, k: float):
    body = f"""
    <div class="canvas bg-gradient" style="width:{w}px;height:{h}px;">
      <div class="stripes"></div>
      {watermark('ax-mark-mono-white.png', size=f'{int(230 * k)}px',
                 top=f'{int(-55 * k)}px', right=f'{int(-65 * k)}px', opacity=0.09)}
      {blades(w * 0.55, h * 0.67, 120 * k, count=3, thickness=5 * k, gap=16 * k)}
      <div class="col" style="height:100%;padding:{26 * k:.0f}px {22 * k:.0f}px;
           justify-content:space-between;align-items:flex-start;">
        {logo_img('ax-logo-white-on-dark.png', height=30 * k)}
        <div class="col" style="gap:{10 * k:.0f}px;align-items:flex-start;">
          <div class="eyebrow" style="font-size:{10 * k:.0f}px;">AX-Channels</div>
          <div class="display" style="font-size:{34 * k:.0f}px;">{HEADLINE}</div>
          <div class="body" style="font-size:{14 * k:.0f}px;">{SUB}</div>
        </div>
        <div class="col" style="gap:{12 * k:.0f}px;align-items:flex-start;width:100%;">
          <div class="pill" style="font-size:{14 * k:.0f}px;padding:{12 * k:.0f}px {22 * k:.0f}px;">{CTA}</div>
          <div class="meta" style="font-size:{10 * k:.0f}px;">{WEB}</div>
        </div>
      </div>
    </div>"""
    return dict(out=out, html=page(w, h, body), width=w, height=h, scale=1)


def _skyscraper(w: int, h: int, out: str):
    """160px is too narrow for the wordmark or a sentence — mark and CTA only."""
    body = f"""
    <div class="canvas bg-gradient" style="width:{w}px;height:{h}px;">
      <div class="stripes"></div>
      {watermark('ax-mark-mono-white.png', size='150px', top='-34px', right='-42px', opacity=0.1)}
      {blades(84, 452, 96, count=3, thickness=4, gap=13)}
      <div class="col" style="height:100%;padding:22px 18px;justify-content:space-between;
           align-items:flex-start;">
        {logo_img('ax-mark-mono-white.png', height=26)}
        <div class="col" style="gap:12px;align-items:flex-start;">
          <div class="display" style="font-size:27px;">Design that performs.</div>
          <div class="body" style="font-size:13px;">{SHORT_SUB}</div>
        </div>
        <div class="col" style="gap:14px;align-items:flex-start;">
          <div class="pill" style="font-size:12px;padding:11px 16px;">Free audit</div>
          <div class="meta" style="font-size:9px;">axchannels.co.za</div>
        </div>
      </div>
    </div>"""
    return dict(out=out, html=page(w, h, body), width=w, height=h, scale=1)


def _row(w: int, h: int, out: str, k: float, *, sub: bool = True):
    body = f"""
    <div class="canvas bg-gradient" style="width:{w}px;height:{h}px;">
      <div class="stripes"></div>
      {watermark('ax-mark-mono-white.png', size=f'{int(150 * k)}px',
                 top=f'{int(-30 * k)}px', right=f'{int(-40 * k)}px', opacity=0.1)}
      <div class="row" style="height:100%;padding:0 {22 * k:.0f}px;gap:{20 * k:.0f}px;">
        {logo_img('ax-logo-white-on-dark.png', height=34 * k)}
        <div style="width:1px;height:{44 * k:.0f}px;background:rgba(255,255,255,.2);"></div>
        <div class="col" style="gap:{5 * k:.0f}px;">
          <div class="display" style="font-size:{25 * k:.0f}px;white-space:nowrap;">{HEADLINE}</div>
          {f'<div class="body" style="font-size:{11 * k:.0f}px;white-space:nowrap;">{SUB}</div>' if sub else ''}
        </div>
        <div class="pill" style="font-size:{13 * k:.0f}px;padding:{10 * k:.0f}px {20 * k:.0f}px;
             margin-left:auto;flex:none;white-space:nowrap;">{CTA}</div>
      </div>
    </div>"""
    return dict(out=out, html=page(w, h, body), width=w, height=h, scale=1)


def all_assets():
    return [
        _rectangle(300, 250, "ads/display-medium-rectangle-300x250.png", k=1.0),
        _rectangle(336, 280, "ads/display-large-rectangle-336x280.png", k=1.1),
        _half_page(300, 600, "ads/display-half-page-300x600.png", k=1.0),
        _skyscraper(160, 600, "ads/display-wide-skyscraper-160x600.png"),
        _row(728, 90, "ads/display-leaderboard-728x90.png", k=1.0),
        _row(970, 250, "ads/display-billboard-970x250.png", k=1.75),
        _row(320, 50, "ads/display-mobile-banner-320x50.png", k=0.55, sub=False),
    ]
