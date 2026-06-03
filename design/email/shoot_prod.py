# Screenshots the real production e-mail HTML on the brand void background.
import pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent

with sync_playwright() as p:
    b = p.chromium.launch()
    for src, out in [("_prod_verify.html", "prod-verify.png"), ("_prod_reset.html", "prod-reset.png")]:
        page = b.new_page(viewport={"width": 640, "height": 900}, device_scale_factor=2)
        page.goto((HERE / src).as_uri())
        page.wait_for_timeout(400)
        page.screenshot(path=str(HERE / out), full_page=True)
        print("wrote", out)
    b.close()
