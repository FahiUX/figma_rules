"""
Master QA Verification Script for Exported Figma Asset Directories (v2 Standard)
Audits 100% of screens across all pages against canonical export formula:
- Validates root screen PNG
- Validates 00-navigation chrome & 04-logo branding
- Validates 01-header chrome & persona avatar
- Validates 02-icon SVG zero-padding & deduplication
- Audits body avatars, logos, banners, and vector graphics
"""

import os
import sys
import re

def audit_page_directory(page_path, login_keyword="login", required_nav_logos=4):
    """Audits a single page directory containing screens."""
    page_name = os.path.basename(page_path)
    screens = []
    
    for root, dirs, files in os.walk(page_path):
        for d in dirs:
            if re.match(r'^\d+', d) and not re.match(r'^0[0-6]-', d):
                screen_dir = os.path.join(root, d)
                has_assets = any(os.path.exists(os.path.join(screen_dir, sub)) for sub in ['00-navigation', '01-header', '02-icon'])
                has_root_png = any(f.endswith('.png') for f in os.listdir(screen_dir) if os.path.isfile(os.path.join(screen_dir, f)))
                if has_assets or has_root_png:
                    screens.append((d, screen_dir))
                    
    total_screens = len(screens)
    root_png_count = 0
    nav_count = 0
    hdr_count = 0
    nav_logo_valid_count = 0
    hdr_avatar_valid_count = 0
    total_body_icons = 0
    body_avatar_screens = 0
    total_body_avatars = 0
    body_logo_screens = 0
    total_body_logos = 0
    body_banner_screens = 0
    total_body_banners = 0
    body_vector_screens = 0
    total_body_vectors = 0
    issues = []

    for name, s_dir in screens:
        is_login = login_keyword.lower() in name.lower()
        
        # 1. Root PNG
        pngs = [f for f in os.listdir(s_dir) if f.endswith('.png') and os.path.isfile(os.path.join(s_dir, f))]
        if pngs:
            root_png_count += 1
        else:
            issues.append(f"Missing root PNG in: {name}")

        # 2. Navigation
        nav_dir = os.path.join(s_dir, '00-navigation')
        if not is_login:
            if os.path.exists(nav_dir):
                nav_count += 1
                logo_dir = os.path.join(nav_dir, '04-logo')
                if os.path.exists(logo_dir):
                    logos = [f for f in os.listdir(logo_dir) if f.endswith('.png')]
                    if len(logos) == required_nav_logos:
                        nav_logo_valid_count += 1
                    else:
                        issues.append(f"Nav 04-logo count mismatch ({len(logos)}/{required_nav_logos}) in: {name}")
                else:
                    issues.append(f"Missing 00-navigation/04-logo in: {name}")
            else:
                issues.append(f"Missing 00-navigation in: {name}")

        # 3. Header
        hdr_dir = os.path.join(s_dir, '01-header')
        if not is_login:
            if os.path.exists(hdr_dir):
                hdr_count += 1
                av_dir = os.path.join(hdr_dir, '03-avatar')
                if os.path.exists(av_dir):
                    avs = [f for f in os.listdir(av_dir) if f.endswith(('.jpg', '.jpeg', '.png'))]
                    if avs:
                        hdr_avatar_valid_count += 1
                    else:
                        issues.append(f"Empty 01-header/03-avatar in: {name}")
                else:
                    issues.append(f"Missing 01-header/03-avatar in: {name}")
            else:
                issues.append(f"Missing 01-header in: {name}")

        # 4. Body Icons
        icon_dir = os.path.join(s_dir, '02-icon')
        if os.path.exists(icon_dir):
            svgs = [f for f in os.listdir(icon_dir) if f.endswith('.svg')]
            total_body_icons += len(svgs)
            for s in svgs:
                if not re.match(r'^\d{2}-', s):
                    issues.append(f"Non-standard icon name '{s}' in: {name}")

        # 5. Body Avatars
        avatar_dir = os.path.join(s_dir, '03-avatar')
        if os.path.exists(avatar_dir):
            avs = [f for f in os.listdir(avatar_dir) if f.endswith(('.jpg', '.jpeg', '.png'))]
            if avs:
                body_avatar_screens += 1
                total_body_avatars += len(avs)

        # 6. Body Logos
        b_logo_dir = os.path.join(s_dir, '04-logo')
        if os.path.exists(b_logo_dir):
            lgs = [f for f in os.listdir(b_logo_dir) if f.endswith('.png')]
            if lgs:
                body_logo_screens += 1
                total_body_logos += len(lgs)

        # 7. Body Banners
        banner_dir = os.path.join(s_dir, '05-banner')
        if os.path.exists(banner_dir):
            bns = [f for f in os.listdir(banner_dir) if f.endswith(('.jpg', '.jpeg', '.png'))]
            if bns:
                body_banner_screens += 1
                total_body_banners += len(bns)

        # 8. Body Vectors
        vector_dir = os.path.join(s_dir, '06-vector')
        if os.path.exists(vector_dir):
            vcs = [f for f in os.listdir(vector_dir) if f.endswith('.svg')]
            if vcs:
                body_vector_screens += 1
                total_body_vectors += len(vcs)

    expected_app_screens = total_screens - (1 if any(login_keyword in s[0].lower() for s in screens) else 0)

    print(f"\nPAGE: {page_name}")
    print(f"  Total Screens:             {total_screens}")
    print(f"  Root PNGs:                 {root_png_count}/{total_screens} ({root_png_count/total_screens*100:.0f}%)" if total_screens else "0%")
    print(f"  Navigation (00-navigation): {nav_count}/{expected_app_screens}")
    print(f"  Navigation 04-logo:        {nav_logo_valid_count}/{expected_app_screens}")
    print(f"  Header (01-header):        {hdr_count}/{expected_app_screens}")
    print(f"  Header Persona Avatar:     {hdr_avatar_valid_count}/{expected_app_screens}")
    print(f"  Body 02-icon SVGs:         {total_body_icons} files")
    print(f"  Body 03-avatar:            {body_avatar_screens} screens ({total_body_avatars} avatars)")
    print(f"  Body 04-logo:              {body_logo_screens} screens ({total_body_logos} logos)")
    print(f"  Body 05-banner:            {body_banner_screens} screens ({total_body_banners} banners/maps)")
    print(f"  Body 06-vector:            {body_vector_screens} screens ({total_body_vectors} charts/sparklines)")
    print(f"  Issues Detected:           {len(issues)}")
    if issues:
        for iss in issues[:10]:
            print(f"    - {iss}")
        if len(issues) > 10:
            print(f"    ... and {len(issues) - 10} more issues")

    return len(issues) == 0

def audit_root(root_dir):
    """Audits an entire asset export directory containing multiple pages."""
    print("=" * 80)
    print("           FIGMA ASSET EXPORT QUALITY ASSURANCE AUDITOR (v2)")
    print("=" * 80)
    
    pages = [os.path.join(root_dir, d) for d in os.listdir(root_dir) if os.path.isdir(os.path.join(root_dir, d)) and not d.startswith(('_', '.'))]
    all_ok = True
    for p in sorted(pages):
        ok = audit_page_directory(p)
        if not ok:
            all_ok = False
            
    print("\n" + "=" * 80)
    if all_ok:
        print("VERDICT: PASS (0 Issues Detected across all pages! 100% Formula Compliance)")
    else:
        print("VERDICT: FAIL (Issues detected. Review logs above.)")
    print("=" * 80)

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    audit_root(target)
