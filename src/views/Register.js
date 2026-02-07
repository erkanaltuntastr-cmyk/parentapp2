import { registerUser, mockGoogleSignIn, getActiveUser, setLegalConsent } from '../usecases/auth.js';
import { setFamilyName } from '../usecases/family.js';
import { attachPasswordToggles } from '../utils/passwordToggle.js';
import { toast } from '../utils/toast.js';

export function Register(){
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = `
    <h1 class="h1">Create New Profile</h1>
    <p class="subtitle">Set up a local parent profile.</p>

    <form class="form">
      <div class="field">
        <label for="familyName">Family Name</label>
        <input id="familyName" name="familyName" type="text" autocomplete="off" required value="Blackwood" />
      </div>
      <div class="field">
        <label for="regUsername">Username</label>
        <input id="regUsername" name="regUsername" type="text" autocomplete="off" minlength="5" required />
      </div>

      <div class="field password-field">
        <label for="regPassword">Password (min 5 characters)</label>
        <div class="password-wrap">
          <input id="regPassword" name="regPassword" type="password" required />
          <button type="button" class="password-toggle" data-password-toggle="regPassword" aria-label="Show password" aria-pressed="false"></button>
        </div>
      </div>

      <div class="field password-field">
        <label for="regConfirm">Confirm Password</label>
        <div class="password-wrap">
          <input id="regConfirm" name="regConfirm" type="password" required />
          <button type="button" class="password-toggle" data-password-toggle="regConfirm" aria-label="Show password" aria-pressed="false"></button>
        </div>
      </div>

      <div class="field">
        <p class="help">
          No Liability: Oakwood provides guidance based on information you enter. We do not guarantee outcomes,
          assume responsibility for decisions you make, or accept liability for any direct or indirect loss.
        </p>
        <p class="help">A copy of this agreement will be sent to your email. (Mock)</p>
        <label>
          <input id="regConsent" type="checkbox" required />
          I accept the legal terms and confirm I understand the limitations.
        </label>
      </div>

      <div class="field">
        <label for="regMethod">Verification Method (Mock)</label>
        <select id="regMethod" name="regMethod">
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </div>
      <div class="field verification-row">
        <button type="button" class="button-secondary" data-role="send-code">Send Verification Code</button>
        <input id="regCode" name="regCode" type="text" placeholder="Enter code" autocomplete="off" />
      </div>

      <div class="actions-row" style="margin-top: var(--space-3);">
        <button type="submit" class="button">Create Profile</button>
        <a class="button-secondary" href="#/signin">Back to sign in</a>
      </div>
    </form>

    <div class="actions-row" style="margin-top: var(--space-3);">
      <button type="button" class="button-secondary" data-role="google-mock">Sign in with Google</button>
    </div>
  `;

  const form = section.querySelector('form');
  let verificationCode = '';
  let codeSent = false;
  const sendBtn = section.querySelector('[data-role="send-code"]');
  sendBtn.addEventListener('click', () => {
    verificationCode = '84920';
    codeSent = true;
    toast.info(`Verification code: ${verificationCode}`);
  });
  attachPasswordToggles(section);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const username = form.regUsername.value;
    const password = form.regPassword.value;
    const confirm = form.regConfirm.value;
    const consent = form.regConsent.checked;
    const familyName = (form.familyName.value || '').trim();

    if (password !== confirm) {
      alert('Passwords do not match.');
      return;
    }
    if (!familyName) {
      alert('Family name is required.');
      return;
    }
    if (!consent) {
      alert('You must accept the legal terms to continue.');
      return;
    }
    if (!codeSent) {
      toast.error('Send a verification code before continuing.');
      return;
    }
    if (form.regCode.value.trim() !== verificationCode) {
      toast.error('Verification code does not match.');
      return;
    }

    try {
      await registerUser(username, password);
      setFamilyName(familyName);
      setLegalConsent(true);
      location.hash = '#/family-hub';
    } catch (err) {
      alert(err.message || 'Registration failed.');
    }
  });

  const googleBtn = section.querySelector('[data-role="google-mock"]');
  googleBtn.addEventListener('click', async () => {
    try {
      await mockGoogleSignIn();
      const user = getActiveUser();
      toast.success(`Signed in as ${user?.username || 'Parent'}.`);
      const fam = (form.familyName.value || '').trim();
      if (fam) setFamilyName(fam);
      setLegalConsent(true);
      location.hash = '#/family-hub';
    } catch (err) {
      alert(err.message || 'Google sign-in failed.');
    }
  });

  return section;
}
