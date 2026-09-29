from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np
import json

root = Path(__file__).resolve().parent.parent
docs = root / 'docs' / 'comparativos'
docs.mkdir(parents=True, exist_ok=True)
hero = Image.open(root / 'docs/referencias/referencia-hero.webp').convert('RGB')
login = Image.open(root / 'docs/referencias/referencia-login.png').convert('RGB')
measurements = {}
for name, image, regions in [
    ('hero', hero, {'corner':(0,0,160,160), 'center':(1600,650,1750,850), 'navbar':(700,110,1000,210), 'below':(0,1890,120,2150), 'green':(3440,1950,3520,2050)}),
    ('login', login, {'panel':(3300,500,3800,1700), 'background':(50,50,300,300)})
]:
    measurements[name] = {'size':image.size, 'colors':{key:'#' + ''.join(f'{int(v):02X}' for v in np.median(np.asarray(image.crop(box)).reshape(-1,3), axis=0)) for key,box in regions.items()}}
hero.resize((1512,801), Image.Resampling.LANCZOS).save(docs / 'hero-referencia.png')
login.resize((1456,816), Image.Resampling.LANCZOS).save(docs / 'login-referencia.png')
for label, image, box in [
    ('hero-navbar',hero,(360,70,3730,300)),('hero-copy',hero,(350,510,1800,1740)),
    ('hero-photo-cards',hero,(1920,380,3940,1870)),('login-form',login,(390,300,1700,2040)),
    ('login-panel',login,(2150,300,3300,1280))
]:
    image.crop(box).save(docs / (label+'.png'))

# Only the woman is exported. Blue backdrop and status-card rectangles become alpha.
box = (1940,430,3140,1858)
rgb = np.asarray(hero.crop(box)).astype(float)
blue = (rgb[:,:,2] > 110) & (rgb[:,:,2] > rgb[:,:,0]*1.45) & (rgb[:,:,2]-rgb[:,:,1] > 48)
alpha = np.where(blue,0,255).astype(np.uint8)
# Reference status cards overlap the shoulder; matching live cards cover those occluded regions.
for card in [(2964,700,3880,888),(2964,908,3880,1098),(2964,1118,3880,1308),(2964,1328,3880,1518)]:
    x1,y1,x2,y2 = card
    alpha[max(0,y1-box[1]):max(0,y2-box[1]),max(0,x1-box[0]):min(box[2]-box[0],x2-box[0])] = 0
alpha = np.asarray(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(.45)))
rgba = np.dstack([rgb.astype(np.uint8),alpha])
portrait = Image.fromarray(rgba)
target = root / 'public/hero'
target.mkdir(parents=True,exist_ok=True)
for width in [480,880,1200]:
    portrait.resize((width,round(portrait.height*width/portrait.width)),Image.Resampling.LANCZOS).save(target / f'mulher-portfolio-{width}.webp',quality=93,method=6)
(docs/'medidas.json').write_text(json.dumps(measurements,indent=2),encoding='utf-8')
print(json.dumps(measurements,indent=2))
