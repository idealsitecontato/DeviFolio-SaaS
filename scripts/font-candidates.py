from pathlib import Path
import urllib.request,re
root=Path('docs/comparativos/fontes');root.mkdir(parents=True,exist_ok=True)
for name in ['Plus Jakarta Sans','Outfit','Figtree','DM Sans','Manrope']:
    request=urllib.request.Request('https://fonts.googleapis.com/css2?family='+name.replace(' ','+')+':wght@400;600;700&display=swap',headers={'User-Agent':'Mozilla/5.0'})
    css=urllib.request.urlopen(request).read().decode()
    urls=re.findall(r'url\((https[^)]+)\)',css)
    for i,url in enumerate(dict.fromkeys(urls)):
        data=urllib.request.urlopen(url).read();(root/(name.replace(' ','-')+'-'+str(i)+'.font')).write_bytes(data)
    (root/(name.replace(' ','-')+'.css')).write_text(css,encoding='utf-8')
    print(name,len(set(urls)))
