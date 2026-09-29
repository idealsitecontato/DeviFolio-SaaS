from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen

root=Path(__file__).resolve().parent.parent
brand=root/'public/brand'; icons=root/'public/icons'
brand.mkdir(parents=True,exist_ok=True); icons.mkdir(parents=True,exist_ok=True)
font=TTFont(root/'assets/fonts/google-sans-latin.woff2')
if 'fvar' in font: font=instantiateVariableFont(font,{'wght':700},inplace=False)
glyphs=font.getGlyphSet(); cmap=font.getBestCmap(); advance=font['hmtx'].metrics
scale=35/font['head'].unitsPerEm
parts=[]; x=53
for letter in 'FolioDev':
    name=cmap[ord(letter)]; pen=SVGPathPen(glyphs); glyphs[name].draw(pen)
    parts.append(f'<path d="{pen.getCommands()}" transform="translate({x:.3f} 36) scale({scale:.7f} {-scale:.7f})"/>')
    x+=advance[name][0]*scale
mark='<path fill="#0475ff" d="M2 0h34v10H2Q0 10 0 8V2Q0 0 2 0ZM11 15h30l-2 10H19v15H9V17q0-2 2-2Z"/>'
(brand/'foliodev.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {x:.3f} 42">{mark}<g fill="#07080a">'+''.join(parts)+'</g></svg>')
(brand/'foliodev-mark.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42">{mark}</svg>')
kaptei='<path fill="#00c69c" d="M46 3C20 9 2 30 2 58c0 27 17 48 33 54L46 3Z M117 35 72 59l28 40c19-13 25-39 17-64Z M60 74l32 31c-12 7-24 10-37 7Z"/><path fill="#fff" d="M65 0c19 0 35 7 47 20L57 57Z"/>'
(brand/'kaptei.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 124 114">{kaptei}</svg>')
(brand/'kaptei-wordmark.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 114">{kaptei}<text x="146" y="83" fill="white" font-family="Arial,sans-serif" font-weight="600" font-size="76">Kaptei</text></svg>')
source=(root/'cadastro.html').read_text(encoding='utf-8')
# GitHub's official Octocat silhouette, used in the existing authentication UI.
github='M49 0C21.94 0 0 21.94 0 49c0 21.64 14.03 39.99 33.47 46.47 2.45.45 3.35-1.06 3.35-2.36 0-1.17-.04-4.27-.07-8.37-13.62 2.96-16.5-6.56-16.5-6.56-2.23-5.66-5.45-7.17-5.45-7.17-4.45-3.04.34-2.98.34-2.98 4.92.35 7.51 5.05 7.51 5.05 4.38 7.5 11.48 5.34 14.28 4.09.44-3.18 1.71-5.34 3.11-6.57-10.87-1.24-22.3-5.44-22.3-24.2 0-5.35 1.91-9.71 5.05-13.13-.5-1.24-2.19-6.23.48-12.97 0 0 4.12-1.32 13.49 5.02a46.7 46.7 0 0 1 12.29-1.66c4.17.02 8.37.56 12.29 1.66 9.37-6.34 13.49-5.02 13.49-5.02 2.67 6.74.99 11.73.48 12.97 3.14 3.42 5.05 7.78 5.05 13.13 0 18.82-11.46 22.94-22.37 24.15 1.76 1.52 3.33 4.51 3.33 9.1 0 6.57-.06 11.87-.06 13.49 0 1.31.89 2.84 3.38 2.35C83.99 88.95 98 70.62 98 49 98 21.94 76.06 0 49 0Z'
for color,name in [('#111','github'),('#fff','github-white')]:
    (icons/(name+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 98"><path fill="{color}" d="{github}"/></svg>')
google='<path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.03v2.52h3.23c1.89-1.74 2.99-4.3 2.99-7.38Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.39l-3.23-2.52c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.06v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.92a6 6 0 0 1 0-3.84v-2.6H3.06a10 10 0 0 0 0 9.04l3.34-2.6Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.83 1.52l2.87-2.87A9.59 9.59 0 0 0 12 2a10 10 0 0 0-8.94 5.48l3.34 2.6A5.96 5.96 0 0 1 12 5.95Z"/>'
(icons/'google.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">{google}</svg>')
print('Brand SVGs generated with vector wordmark and existing GitHub silhouette.')
