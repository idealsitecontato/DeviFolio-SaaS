import { renderPlanCards } from './plans.js'
import { documentPreview, projectCardMarkup } from './src/ui/components.js'
import { portfolioModels } from './src/lib/portfolio-models.js'

// Local examples use the product components; this page never loads user data.
const exampleProfile={name:'Ana Ribeiro',username:'ana-ribeiro',role:'Desenvolvedora frontend',bio:'Interfaces acessíveis. Projetos com contexto. Software feito com cuidado.'}
const exampleProjects=[{id:1,name:'Atlas — Dashboard',description:'Uma interface para acompanhar operações e tomar decisões com contexto.',tech:'React, TypeScript',github:'ana/atlas',status:'published'},{id:2,name:'Notas',description:'Um editor simples para registrar ideias e organizar documentos.',tech:'JavaScript, CSS',github:'ana/notas',status:'progress'}]
document.getElementById('hero-product-preview').innerHTML=documentPreview({profile:exampleProfile,projects:exampleProjects})
document.getElementById('landing-project-preview').innerHTML=projectCardMarkup(exampleProjects[0])
document.getElementById('landing-public-preview').innerHTML=documentPreview({profile:exampleProfile,projects:exampleProjects,compact:true})
document.getElementById('landing-models').innerHTML=portfolioModels.filter(model=>model.available).slice(0,3).map(model=>`<a class="landing-model-card" href="cadastro.html#cadastro" aria-label="Escolher modelo ${model.name}">${documentPreview({profile:exampleProfile,projects:exampleProjects,model,compact:true})}<span>${model.name} →</span></a>`).join('')
document.getElementById('landing-plans-grid').innerHTML=renderPlanCards()
document.getElementById('copyright-year').textContent=String(new Date().getFullYear())
const referralCode=new URLSearchParams(location.search).get('ref')?.trim().toLowerCase()||''
if(/^[a-z0-9._-]{1,80}$/.test(referralCode)){document.querySelectorAll('a[href^="cadastro.html"]').forEach(link=>{const target=new URL(link.getAttribute('href'),location.href);target.searchParams.set('ref',referralCode);link.href=target.toString()})}
const landingPath=location.pathname
if(landingPath.startsWith('/portfolio/')){let username=landingPath.slice('/portfolio/'.length);try{username=decodeURIComponent(username)}catch{}location.replace('/portfolio.html?username='+encodeURIComponent(username))}
else if(landingPath!=='/'&&landingPath!=='/index.html')location.replace('/404.html')
const menuToggle=document.querySelector('.menu-toggle'),mobileMenu=document.getElementById('mobile-menu')
const closeMenu=()=>{mobileMenu.hidden=true;menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Abrir menu')}
menuToggle.addEventListener('click',()=>{const open=mobileMenu.hidden;mobileMenu.hidden=!open;menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu')})
mobileMenu.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu))
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!mobileMenu.hidden){closeMenu();menuToggle.focus()}})
document.querySelectorAll('.faq-question').forEach(button=>button.addEventListener('click',()=>{const item=button.closest('.faq-item'),open=!item.classList.contains('is-open');document.querySelectorAll('.faq-item').forEach(other=>{const active=other===item&&open;other.classList.toggle('is-open',active);other.querySelector('button').setAttribute('aria-expanded',String(active));other.querySelector('.faq-answer').setAttribute('aria-hidden',String(!active));other.querySelector('i').textContent=active?'−':'+'})}))
const githubInput=document.getElementById('github-link-input'),githubNext=document.getElementById('github-next'),githubStatus=document.getElementById('github-link-status')
const syncGithubNext=()=>githubNext.setAttribute('aria-disabled',String(!githubInput.value.trim()))
document.getElementById('paste-github').addEventListener('click',async()=>{try{githubInput.value=(await navigator.clipboard.readText()).trim();githubStatus.textContent=githubInput.value?'Endereço colado. Agora continue.':'Nenhum endereço na área de transferência.';syncGithubNext()}catch{githubStatus.textContent='Cole o endereço manualmente no campo.';githubInput.focus()}})
githubInput.addEventListener('input',()=>{githubStatus.textContent=githubInput.value.trim()?'Endereço pronto. Agora continue.':'Cole o endereço para continuar.';syncGithubNext()})
githubNext.addEventListener('click',event=>{if(!githubInput.value.trim()){event.preventDefault();githubStatus.textContent='Primeiro, cole o endereço do seu GitHub.';githubInput.focus()}})
syncGithubNext()
const reviewTrack=document.getElementById('review-track'),originalReviews=[...reviewTrack.children].map(card=>card.cloneNode(true))
let reviewRepetitions=0
function fillReviews(){const cardWidth=matchMedia('(max-width:640px)').matches?300:360,gap=24,groupWidth=originalReviews.length*(cardWidth+gap),repetitions=Math.max(1,Math.ceil((innerWidth+cardWidth)/groupWidth));if(repetitions!==reviewRepetitions){reviewRepetitions=repetitions;reviewTrack.replaceChildren();for(let group=0;group<repetitions*2;group++)originalReviews.forEach(card=>{const copy=card.cloneNode(true);if(group>0)copy.setAttribute('aria-hidden','true');reviewTrack.append(copy)})}reviewTrack.style.setProperty('--review-distance',`${groupWidth*repetitions}px`)}
fillReviews();window.addEventListener('resize',fillReviews,{passive:true})
document.getElementById('pause-reviews').addEventListener('click',event=>{const paused=reviewTrack.classList.toggle('is-paused');event.currentTarget.setAttribute('aria-pressed',String(paused));event.currentTarget.textContent=paused?'Retomar avaliações':'Pausar avaliações'})
const video=document.querySelector('.final-video'),reduced=matchMedia('(prefers-reduced-motion: reduce)')
new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting&&!reduced.matches)video.play().catch(()=>{});else video.pause()})},{rootMargin:'100px'}).observe(video)
reduced.addEventListener('change',()=>{if(reduced.matches)video.pause()})
window.addEventListener('offline',()=>{if(document.querySelector('.offline-notice'))return;const notice=document.createElement('div');notice.className='offline-notice';notice.setAttribute('role','status');notice.textContent='Você está sem conexão. Os links voltam a funcionar quando a conexão retornar.';document.getElementById('site-header').append(notice)})
window.addEventListener('online',()=>document.querySelector('.offline-notice')?.remove())
