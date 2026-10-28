"""
Core Pipeline Utilities for Figma Asset Extraction (v2 Standard)
Includes binary search error recovery, SVG deduplication, and asset classification.
"""

import os
import hashlib
import re
import xml.etree.ElementTree as ET

def get_svg_path_hash(svg_path):
    """
    Computes a deterministic hash of all path geometries in an SVG.
    Enables true geometric deduplication regardless of node ID.
    """
    try:
        tree = ET.parse(svg_path)
        root = tree.getroot()
        d_attrs = []
        for elem in root.iter():
            tag = elem.tag.split('}')[-1]
            if tag == 'path' and 'd' in elem.attrib:
                d_attrs.append(re.sub(r'\s+', '', elem.attrib['d']))
            elif tag in ('circle', 'rect', 'ellipse', 'polygon', 'line'):
                geom = "".join(f"{k}:{v}" for k, v in sorted(elem.attrib.items()) if k not in ('fill', 'stroke', 'style', 'class'))
                d_attrs.append(geom)
        if not d_attrs:
            with open(svg_path, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        combined = "|".join(d_attrs).encode('utf-8')
        return hashlib.md5(combined).hexdigest()
    except Exception:
        with open(svg_path, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()

def classify_image_asset(node_name, width, height, path_context=""):
    """
    Classifies an extracted image asset into:
    - 'avatar': Real portraits of people
    - 'logo': Institutional crests, sponsor and brand logos
    - 'banner': Venue maps, hero banners, route graphics, dossier previews
    """
    ctx = f"{path_context} {node_name}".lower()
    
    # 1. Avatar checks
    avatar_keywords = ['avatar', 'portrait', 'photo', 'profile', 'officer', 'delegate', 'speaker', 'vip', 'tan sri', 'gen.', 'puan', 'user', 'attendee', 'team']
    if any(k in ctx for k in avatar_keywords) and not any(b in ctx for b in ['banner', 'map', 'hero', 'logo', 'crest', 'seal']):
        return 'avatar'
    
    # Square/near-square small image in header/profile context
    aspect_ratio = width / height if height > 0 else 1.0
    if 0.75 <= aspect_ratio <= 1.35 and width <= 250 and not any(k in ctx for k in ['logo', 'seal', 'crest']):
        return 'avatar'
        
    # 2. Logo checks
    logo_keywords = ['logo', 'crest', 'seal', 'brand', 'emblem', 'sponsor', 'pdrm', 'kdn', 'aisse']
    if any(k in ctx for k in logo_keywords):
        return 'logo'
        
    # 3. Banner / Map checks
    banner_keywords = ['banner', 'map', 'floorplan', 'route', 'motorcade', 'convoy', 'mitec', 'dossier', 'hero', 'preview', 'cover']
    if any(k in ctx for k in banner_keywords):
        return 'banner'
        
    # Large or wide images default to banner
    if width >= 400 or aspect_ratio >= 1.6:
        return 'banner'
        
    return 'banner'

def sanitize_slug(name):
    """Generates clean slug for files and directories."""
    clean = re.sub(r'[\s\-_·/—\(\)]+', '-', name.strip())
    return clean.strip('-').lower()
