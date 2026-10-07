import { passwordChecks, getStrength } from '../lib/passwordRules'

export default function PasswordStrength({ password }) {
  if (!password) return null

  const strength = getStrength(password)
  const checks = passwordChecks(password)

  return (
    <div className="password-strength">
      <div className="strength-bar">
        <div
          className={`strength-fill ${strength.level}`}
          style={{ width: `${strength.percent}%` }}
        />
      </div>
      <p className={`strength-label ${strength.level}`}>{strength.label}</p>

      <ul className="password-rules">
        {checks.map((check) => (
          <li key={check.label} className={check.met ? 'met' : ''}>
            {check.met ? '✓' : '○'} {check.label}
          </li>
        ))}
      </ul>
    </div>
  )
}