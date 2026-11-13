import os
from playwright.sync_api import sync_playwright

def record_formats():
    video_dir = os.path.abspath('social/videos')
    os.makedirs(video_dir, exist_ok=True)
    html_path = os.path.abspath('C:/Users/shann/.gemini/antigravity/brain/760a5e42-6895-4c9b-8e19-4019afc3d683/motion_product_showcase.html').replace('\\', '/')

    formats = [
        ('1x1', 1080, 1080, 'anusandhan_motion_1x1.webm'),
        ('16x9', 1920, 1080, 'anusandhan_motion_16x9.webm')
    ]

    with sync_playwright() as p:
        browser = p.chromium.launch()
        for name, w, h, fname in formats:
            ctx = browser.new_context(
                record_video_dir=video_dir,
                record_video_size={'width': w, 'height': h},
                viewport={'width': w, 'height': h}
            )
            page = ctx.new_page()
            page.goto('file:///' + html_path)
            page.wait_for_timeout(2500)
            page.evaluate("selectCyberNode('iisc')")
            page.wait_for_timeout(2000)
            page.evaluate("switchScene('gauge')")
            page.wait_for_timeout(2500)
            page.evaluate("switchScene('synthesizer')")
            page.evaluate("runTypewriterEffect()")
            page.wait_for_timeout(5000)
            v = page.video
            ctx.close()
            if v:
                target_path = os.path.join(video_dir, fname)
                v.save_as(target_path)
                print(f"Saved {name} to {target_path}")

        browser.close()

if __name__ == '__main__':
    record_formats()
