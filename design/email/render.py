# Renders the "Charged Quiet" Waltrix email design to a high-res PNG mockup.
# The email card itself is email-client-safe (tables + inline styles); the surrounding
# frame, fonts, grid and reference markers exist only for the museum-quality presentation.

import pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
FONTS = pathlib.Path(r"C:/Users/kaua.silvestre/.claude/skills/canvas-design/canvas-fonts")


def f(name):
    return (FONTS / name).as_uri()


# Authentic Waltrix bolt — exact path from front/public/favicon.svg, recolored with the
# voltage gradient and given a soft electric glow.
BOLT = """
<svg width="44" height="42" viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="volt" x1="2" y1="2" x2="46" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#a855f7"/>
      <stop offset="0.5" stop-color="#7e14ff"/>
      <stop offset="1" stop-color="#47bfff"/>
    </linearGradient>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="3.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <path filter="url(#glow)" fill="url(#volt)" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
</svg>
"""

# A small standalone bolt glyph used as a quiet motif in the code module.
MINI_BOLT = """
<svg width="13" height="13" viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill="#47bfff" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
</svg>
"""

CODE = "284 913"

# ── The email card (this block is the deliverable HTML — table-based, inline styles) ──
EMAIL = f"""
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"
       style="width:560px;background:#0b0f1c;background-image:linear-gradient(180deg,#0e1426 0%,#0a0e1a 100%);
              border:1px solid #1e2740;border-radius:22px;overflow:hidden;
              box-shadow:0 40px 90px rgba(0,0,0,.55),0 0 0 1px rgba(126,20,255,.05);">

  <!-- Header -->
  <tr><td style="padding:38px 44px 0 44px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="vertical-align:middle;width:52px;">{BOLT}</td>
      <td style="vertical-align:middle;padding-left:14px;">
        <div style="font-family:'Bricolage';font-weight:800;font-size:25px;letter-spacing:-1px;
                    color:#ffffff;line-height:1;">Waltrix</div>
        <div style="font-family:'Outfit';font-size:10px;letter-spacing:3.5px;text-transform:uppercase;
                    color:#5b6685;margin-top:5px;">Controle&nbsp;Financeiro</div>
      </td>
      <td style="vertical-align:middle;text-align:right;">
        <span style="font-family:'Geist';font-size:10px;letter-spacing:1px;color:#3f4a68;">VFY&nbsp;·&nbsp;001</span>
      </td>
    </tr></table>
  </td></tr>

  <!-- Charged hairline -->
  <tr><td style="padding:30px 44px 0 44px;">
    <div style="height:2px;border-radius:2px;
                background:linear-gradient(90deg,#7e14ff 0%,#9b51ff 35%,#47bfff 100%);
                box-shadow:0 0 18px rgba(126,20,255,.5);"></div>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:34px 44px 0 44px;">
    <div style="font-family:'Bricolage';font-weight:700;font-size:23px;color:#ffffff;
                letter-spacing:-.4px;line-height:1.25;">Confirme seu acesso</div>
    <div style="font-family:'Outfit';font-size:15px;color:#9aa6c4;line-height:1.65;margin-top:12px;">
      Olá, <span style="color:#e6ebf7;font-weight:600;">Kauã</span>. Sua conta está quase pronta.
      Use o código abaixo para confirmar seu e-mail e ativar o Waltrix.
    </div>
  </td></tr>

  <!-- Code module -->
  <tr><td style="padding:28px 44px 0 44px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background:#070a14;border:1px solid #1d2640;border-radius:16px;">
      <tr><td style="padding:26px 24px;text-align:center;">
        <div style="font-family:'Geist';font-size:10px;letter-spacing:3px;text-transform:uppercase;
                    color:#5b6685;margin-bottom:16px;">
          {MINI_BOLT}&nbsp;&nbsp;Código de verificação
        </div>
        <div style="font-family:'Geist';font-weight:700;font-size:42px;letter-spacing:14px;
                    color:#ffffff;text-shadow:0 0 26px rgba(126,20,255,.55);padding-left:14px;">{CODE}</div>
      </td></tr>
    </table>
  </td></tr>

  <!-- Expiry chip -->
  <tr><td style="padding:22px 44px 0 44px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td
        style="background:rgba(71,191,255,.08);border:1px solid rgba(71,191,255,.18);border-radius:999px;
               padding:8px 16px;font-family:'Outfit';font-size:12.5px;color:#86b9e8;">
      ⏳&nbsp; Expira em <span style="color:#cfe4f8;font-weight:600;">24 horas</span>
    </td></tr></table>
  </td></tr>

  <!-- Security note -->
  <tr><td style="padding:20px 44px 0 44px;">
    <div style="font-family:'Outfit';font-size:12.5px;color:#5f6a87;line-height:1.6;">
      Se você não criou esta conta, ignore este e-mail com segurança — nenhuma ação é necessária.
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:30px 44px 36px 44px;">
    <div style="height:1px;background:#161d33;margin-bottom:20px;"></div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="font-family:'Outfit';font-size:11px;color:#454f6e;line-height:1.7;">
        © 2026 Waltrix · waltrix.com.br<br/>
        E-mail automático — por favor, não responda.
      </td>
      <td style="text-align:right;font-family:'Geist';font-size:11px;letter-spacing:.5px;">
        <a href="#" style="color:#7e8bb0;text-decoration:none;">Ajuda</a>
        <span style="color:#2a3350;">&nbsp;·&nbsp;</span>
        <a href="#" style="color:#7e8bb0;text-decoration:none;">Privacidade</a>
      </td>
    </tr></table>
  </td></tr>

</table>
"""

# ── Presentation frame (mockup only) ──
HTML = f"""
<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  @font-face {{ font-family:'Bricolage'; src:url('{f("BricolageGrotesque-Bold.ttf")}'); font-weight:700 900; }}
  @font-face {{ font-family:'Outfit'; src:url('{f("Outfit-Regular.ttf")}'); font-weight:400; }}
  @font-face {{ font-family:'Outfit'; src:url('{f("Outfit-Bold.ttf")}'); font-weight:600 800; }}
  @font-face {{ font-family:'Geist'; src:url('{f("GeistMono-Regular.ttf")}'); font-weight:400; }}
  @font-face {{ font-family:'Geist'; src:url('{f("GeistMono-Bold.ttf")}'); font-weight:700; }}
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  html,body {{ width:1100px; }}
  .stage {{
    position:relative; width:1100px; min-height:1180px; overflow:hidden;
    background:
      radial-gradient(ellipse 60% 50% at 18% 12%, rgba(126,20,255,.16), transparent 60%),
      radial-gradient(ellipse 55% 45% at 84% 86%, rgba(71,191,255,.10), transparent 58%),
      linear-gradient(180deg, #05070f 0%, #070a14 50%, #04060d 100%);
    display:flex; align-items:center; justify-content:center;
  }}
  /* faint engineering grid */
  .grid {{
    position:absolute; inset:0;
    background-image:
      linear-gradient(rgba(126,150,220,.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(126,150,220,.045) 1px, transparent 1px);
    background-size:44px 44px;
    -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, #000 35%, transparent 78%);
            mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, #000 35%, transparent 78%);
  }}
  .tick {{ position:absolute; font-family:'Geist'; font-size:10px; letter-spacing:2px;
          color:#2f3a5a; text-transform:uppercase; }}
  .crop {{ position:absolute; width:26px; height:26px; border:1px solid rgba(126,150,220,.28); }}
</style></head>
<body><div class="stage">
  <div class="grid"></div>

  <!-- clinical reference markers -->
  <div class="tick" style="top:40px; left:48px;">Waltrix · Sistema Transacional</div>
  <div class="tick" style="top:40px; right:48px;">Pl. 01 — E-mail / Verificação</div>
  <div class="tick" style="bottom:42px; left:48px; letter-spacing:3px;">Charged&nbsp;Quiet</div>
  <div class="tick" style="bottom:42px; right:48px;">#7E14FF → #47BFFF</div>

  <!-- corner crop marks -->
  <div class="crop" style="top:30px; left:30px; border-right:0; border-bottom:0;"></div>
  <div class="crop" style="top:30px; right:30px; border-left:0; border-bottom:0;"></div>
  <div class="crop" style="bottom:30px; left:30px; border-right:0; border-top:0;"></div>
  <div class="crop" style="bottom:30px; right:30px; border-left:0; border-top:0;"></div>

  {EMAIL}
</div></body></html>
"""

prev = HERE / "_preview.html"
prev.write_text(HTML, encoding="utf-8")

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 1100, "height": 1180}, device_scale_factor=2)
    page.goto(prev.as_uri())
    page.wait_for_timeout(600)
    stage = page.query_selector(".stage")
    stage.screenshot(path=str(HERE / "waltrix-email.png"))
    b.close()

print("rendered ->", HERE / "waltrix-email.png")
