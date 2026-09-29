// @ts-check
/** @param {{name?:string,email?:string,password?:string,confirmation?:string,terms?:boolean}} input */
export function validateSignup(input) {
  if (typeof input.name !== 'string' || input.name.trim().length < 2 || input.name.trim().length > 100) return 'Informe seu nome completo.'
  if (typeof input.email !== 'string' || input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return 'Digite um e-mail válido.'
  if (typeof input.password !== 'string' || input.password.length < 8 || input.password.length > 128 || !/[a-zA-Z]/.test(input.password) || !/[0-9]/.test(input.password)) return 'Use de 8 a 128 caracteres, incluindo letras e números.'
  if (input.confirmation !== input.password) return 'As senhas precisam ser iguais.'
  if (input.terms !== true) return 'Aceite os Termos de Uso e a Política de Privacidade para continuar.'
  return ''
}
