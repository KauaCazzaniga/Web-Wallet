# Renders the Waltrix bolt to transparent PNGs for use in e-mails (clients strip inline SVG).
# Produces a 3x logo for the header and a small mark, written into front/public/.

import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "front" / "public"

BOLT_PATH = ("M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262"
             "H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237"
             "c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 "
             "1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088"
             ".89 1.83L25.947 44.94z")


def svg(scale):
    w, h = int(48 * scale), int(46 * scale)
    pad = int(8 * scale)
    return f"""
<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{{margin:0;padding:0}}
html,body{{background:transparent}}</style></head><body>
<svg width="{w + pad*2}" height="{h + pad*2}" viewBox="-8 -8 64 62" fill="none"
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="v" x1="2" y1="0" x2="46" y2="46" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#a855f7"/>
      <stop offset="0.5" stop-color="#7e14ff"/>
      <stop offset="1" stop-color="#47bfff"/>
    </linearGradient>
  </defs>
  <path fill="url(#v)" d="{BOLT_PATH}"/>
</svg></body></html>"""


with sync_playwright() as p:
    b = p.chromium.launch()
    for name, scale in [("email-logo.png", 3.0)]:
        page = b.new_page(viewport={"width": 400, "height": 400}, device_scale_factor=1)
        page.set_content(svg(scale))
        page.wait_for_timeout(200)
        el = page.query_selector("svg")
        el.screenshot(path=str(PUBLIC / name), omit_background=True)
        print("wrote", PUBLIC / name)
    b.close()
