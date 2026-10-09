export function portfolioContactMarkup() {
  return `<section class="public-contact" aria-labelledby="contact-title"><div><span>VAMOS CONVERSAR</span><h2 id="contact-title">Gostou do meu trabalho?</h2><p>Envie uma mensagem sobre seu projeto. Seu contato chega diretamente ao meu painel.</p></div><form id="portfolio-contact-form"><label>Nome<input name="name" maxlength="100" minlength="2" required autocomplete="name"></label><label>E-mail<input name="email" type="email" maxlength="254" required autocomplete="email"></label><label class="full">Assunto<input name="subject" maxlength="150" minlength="2" required></label><label class="full">Mensagem<textarea name="message" maxlength="2000" minlength="2" rows="4" required placeholder="Conte um pouco sobre o que você precisa"></textarea></label><label class="contact-honeypot" aria-hidden="true">Site<input name="website" tabindex="-1" autocomplete="off"></label><button class="public-button" type="submit">Enviar mensagem</button><p role="status" aria-live="polite"></p></form></section>`
}

const defaultReadForm = form => Object.fromEntries(new FormData(form))

export async function submitPortfolioContact(form, submit, { readForm = defaultReadForm, reportError = console.error } = {}) {
  if (!form.reportValidity()) return 'invalid'
  const button = form.querySelector('[type="submit"]')
  const message = form.querySelector('[role="status"]')
  if (button.disabled) return 'busy'
  const data = readForm(form)
  if (data.website) return 'spam'

  button.disabled = true
  button.classList.add('is-loading')
  button.setAttribute('aria-busy', 'true')
  message.textContent = 'Enviando formulário...'
  try {
    await submit(data)
    form.reset()
    message.textContent = 'Mensagem enviada com sucesso!'
    return 'success'
  } catch (error) {
    reportError('[WebFolio] Falha ao enviar contato', error)
    message.textContent = 'Não foi possível enviar a mensagem. Verifique sua conexão e tente novamente.'
    return 'error'
  } finally {
    button.disabled = false
    button.classList.remove('is-loading')
    button.removeAttribute('aria-busy')
  }
}

export function bindPortfolioContactForm(form, submit, options) {
  form?.addEventListener('submit', event => {
    event.preventDefault()
    void submitPortfolioContact(form, submit, options)
  })
}
