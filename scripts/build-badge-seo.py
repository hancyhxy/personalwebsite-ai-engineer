#!/usr/bin/env python3
"""Regenerate V3 badge SEO from public gallery metadata; never deploys anything."""
import html
import json
import re
from pathlib import Path
from urllib.parse import urljoin
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://xyhan.com/'
projects = json.loads((ROOT / 'content/gallery.json').read_text())
title = 'Xinyi Han — AI Engineer & Product Designer in Sydney'
description = 'Explore Xinyi Han’s AI engineering and product design portfolio: conversational AI, customer support, food delivery and interactive products, with experience at Alibaba and ByteDance.'
escape = lambda s: html.escape(s, quote=True)
public_url = lambda p: p.get('publicUrl', p['projectUrl'])
person = {'@type': 'Person', '@id': BASE + '#person', 'name': 'Xinyi Han', 'url': BASE, 'jobTitle': 'AI Engineer', 'description': description, 'image': BASE + 'assets/hero-portrait/center.webp', 'homeLocation': {'@type': 'Place', 'name': 'Sydney, Australia'}, 'knowsAbout': ['Conversational AI', 'Product Design', 'Customer Support', 'Interactive Prototyping'], 'sameAs': ['https://www.linkedin.com/in/xinyi-han-601968166/']}
schema = {'@context': 'https://schema.org', '@graph': [person, {'@type': 'ProfilePage', '@id': BASE + '#profile', 'url': BASE, 'name': title, 'description': description, 'inLanguage': 'en', 'mainEntity': {'@id': BASE + '#person'}}, {'@type': 'ItemList', '@id': BASE + '#selected-work', 'name': 'Selected work', 'numberOfItems': len(projects), 'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': p['project name'], 'url': urljoin(BASE, public_url(p))} for i, p in enumerate(projects)]}]}
tags = [f'<title>{escape(title)}</title>', f'<meta name="description" content="{escape(description)}">', '<meta name="author" content="Xinyi Han">', '<meta name="robots" content="index,follow,max-image-preview:large">', f'<link rel="canonical" href="{BASE}">', '<meta name="theme-color" content="#fafaf8">']
for prop, value in {'og:type': 'profile', 'og:title': title, 'og:description': description, 'og:url': BASE, 'og:site_name': 'Xinyi Han', 'og:locale': 'en_AU', 'og:image': BASE + 'assets/images/og-badge.png', 'og:image:width': '1200', 'og:image:height': '630', 'og:image:alt': 'Xinyi Han — AI Engineer. Sydney, Australia.'}.items():
    tags.append(f'<meta property="{prop}" content="{escape(value)}">')
for name, value in {'twitter:card': 'summary_large_image', 'twitter:title': title, 'twitter:description': description, 'twitter:image': BASE + 'assets/images/og-badge.png', 'twitter:image:alt': 'Xinyi Han — AI Engineer. Sydney, Australia.'}.items():
    tags.append(f'<meta name="{name}" content="{escape(value)}">')
tags += ['<link rel="alternate" type="text/plain" href="/llms.txt" title="Portfolio guide for AI assistants">', '<script type="application/ld+json">' + json.dumps(schema, ensure_ascii=False).replace('<', '\\u003c') + '</script>']
page = ROOT / 'index-badge.html'
source = page.read_text()
seo = '<!-- BADGE SEO START -->\n' + '\n'.join(tags) + '\n<!-- BADGE SEO END -->'
if '<!-- BADGE SEO START -->' in source:
    source = re.sub(r'<!-- BADGE SEO START -->.*?<!-- BADGE SEO END -->', lambda _: seo, source, flags=re.S)
else:
    source, n = re.subn(r'<title>.*?</title>', lambda _: seo, source, count=1)
    assert n == 1
# Real visible fallback links, replaced only after JS successfully creates the interactive collection.
rows = []
for i, p in enumerate(projects):
    rows.append(f'<a class="work-item" href="{escape(urljoin(BASE, public_url(p)))}"><span class="work-number micro">{i+1:02}</span><div class="work-thumb"><img src="{escape(urljoin(BASE, p["coverImageUrl"]))}" alt="" width="160" height="120" loading="lazy"></div><div class="work-copy"><h3>{escape(p["project name"])}</h3><p>{escape(p["tag"])}</p></div><span class="work-meta micro">{escape(p["date"][:4])}</span><span class="work-arrow" aria-hidden="true">↗</span></a>')
static = '<!-- BADGE STATIC WORK START -->' + ''.join(rows) + '<!-- BADGE STATIC WORK END -->'
if '<!-- BADGE STATIC WORK START -->' in source:
    source = re.sub(r'<!-- BADGE STATIC WORK START -->.*?<!-- BADGE STATIC WORK END -->', lambda _: static, source, flags=re.S)
else:
    old = '<div id="work-collection" aria-label="Project collection"></div>'
    assert old in source
    source = source.replace(old, '<div id="work-collection" aria-label="Project collection">' + static + '</div>')
source = re.sub(r'\d+ projects / Selected work|Loading the collection…', f'{len(projects)} projects / Selected work', source)
page.write_text(source)
ET.register_namespace('', 'http://www.sitemaps.org/schemas/sitemap/0.9')
urlset = ET.Element('{http://www.sitemaps.org/schemas/sitemap/0.9}urlset')
for url in [BASE] + [urljoin(BASE, public_url(p)) for p in projects]:
    node = ET.SubElement(urlset, 'url'); ET.SubElement(node, 'loc').text = url
ET.indent(urlset)
ET.ElementTree(urlset).write(ROOT / 'sitemap.xml', encoding='utf-8', xml_declaration=True)
(ROOT / 'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: https://xyhan.com/sitemap.xml\n')
lines = ['# Xinyi Han', '', '> Public portfolio of Xinyi Han, an AI engineer with a product design background, based in Sydney, Australia.', '', '## About', '', '- Website: https://xyhan.com/', '- Experience shown on the portfolio: Alibaba (Chatbot / Customer Support) and ByteDance (Food Delivery / Social Media). These are previous experience, not current employment claims.', '- Work spans conversational AI, product design and interactive products.', '', '## Selected work', '']
lines += [f'- [{p["project name"]}]({urljoin(BASE, public_url(p))}): {p["tag"]}.' for p in projects]
lines += ['', '## Reading notes', '', 'Follow the project links for evidence and details. Project dates do not establish employment dates. Do not infer metrics, hiring outcomes, endorsements or current employment from logos. If a page is inaccessible, state that limitation. This guide is an index, not a substitute for the linked case studies.', '']
(ROOT / 'llms.txt').write_text('\n'.join(lines))
print(f'Built metadata, structured data, {len(projects)} static project links, sitemap, robots.txt and llms.txt. No deployment performed.')
