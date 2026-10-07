export function passwordChecks(password) {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'One number (0-9)', met: /\d/.test(password) },
    { label: 'One special character (!@#$...)', met: /[^A-Za-z0-9]/.test(password) },
  ]
}

export function isStrongPassword(password) {
  return passwordChecks(password).every((check) => check.met)
}

export function getStrength(password) {
  const score = passwordChecks(password).filter((c) => c.met).length

  if (score <= 2) return { label: 'Weak', level: 'weak', percent: 25 }
  if (score === 3) return { label: 'Fair', level: 'fair', percent: 50 }
  if (score === 4) return { label: 'Good', level: 'good', percent: 75 }
  return { label: 'Strong', level: 'strong', percent: 100 }
}