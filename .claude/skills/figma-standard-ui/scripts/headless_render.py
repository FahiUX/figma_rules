"""
Headless Browser SVG-to-PNG Renderer for Figma Frames (v2 Standard)
Bypasses Figma API/MCP rasterization timeouts by exporting frames as SVG
and rendering them via headless Microsoft Edge or Google Chrome.
"""

import os
import sys
import subprocess
import tempfile
import shutil
import xml.etree.ElementTree as ET
from PIL import Image

def find_browser_executable():
    """Finds available Microsoft Edge or Google Chrome executable."""
    candidates = [
        r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
        r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
        'msedge',
        'chrome',
        'chromium'
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None

def get_svg_dimensions(svg_path, default_w=1600, default_h=1050):
    """Extracts width and height from SVG attributes or viewBox."""
    try:
        tree = ET.parse(svg_path)
        root = tree.getroot()
        w = root.attrib.get('width')
        h = root.attrib.get('height')
        if w and h:
            w_val = float(w.replace('px', ''))
            h_val = float(h.replace('px', ''))
            if w_val > 0 and h_val > 0:
                return int(round(w_val)), int(round(h_val))
        viewbox = root.attrib.get('viewBox')
        if viewbox:
            parts = [float(p) for p in viewbox.split()]
            if len(parts) == 4 and parts[2] > 0 and parts[3] > 0:
                return int(round(parts[2])), int(round(parts[3]))
    except Exception as e:
        print(f"[WARN] Error reading SVG dimensions for {svg_path}: {e}")
    return default_w, default_h

def render_svg_to_png(svg_path, output_png_path, width=None, height=None, timeout=45):
    """Renders an SVG file to PNG using a headless browser."""
    browser_exe = find_browser_executable()
    if not browser_exe:
        raise RuntimeError("No headless browser (Edge/Chrome) found on the system.")

    if width is None or height is None:
        width, height = get_svg_dimensions(svg_path)

    os.makedirs(os.path.dirname(os.path.abspath(output_png_path)), exist_ok=True)
    temp_profile = tempfile.mkdtemp()

    cmd = [
        browser_exe,
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        f'--user-data-dir={temp_profile}',
        f'--screenshot={output_png_path}',
        f'--window-size={width},{height}',
        '--default-background-color=00000000',
        os.path.abspath(svg_path)
    ]

    try:
        subprocess.run(cmd, capture_output=True, timeout=timeout)
        if os.path.exists(output_png_path):
            try:
                img = Image.open(output_png_path)
                if img.size != (width, height):
                    img = img.crop((0, 0, width, height))
                    img.save(output_png_path)
            except Exception:
                pass
            print(f"[OK] Rendered {os.path.basename(output_png_path)} ({width}x{height})")
            return True
        else:
            print(f"[ERROR] Output PNG not generated for {svg_path}")
            return False
    except Exception as e:
        print(f"[ERROR] Failed to render {svg_path}: {e}")
        return False
    finally:
        shutil.rmtree(temp_profile, ignore_errors=True)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python headless_render.py <input.svg> <output.png> [width] [height]")
        sys.exit(1)
    svg_in = sys.argv[1]
    png_out = sys.argv[2]
    w = int(sys.argv[3]) if len(sys.argv) > 3 else None
    h = int(sys.argv[4]) if len(sys.argv) > 4 else None
    render_svg_to_png(svg_in, png_out, w, h)
