import { registerUser, mockGoogleSignIn, getActiveUser, setLegalConsent } from '../usecases/auth.js';
import { setFamilyName } from '../usecases/family.js';
import { attachPasswordToggles } from '../utils/passwordToggle.js';
import { toast } from '../utils/toast.js';

function toProperCase(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function Register(){
  const container = document.createElement('div');
  container.className = 'min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4 py-8';
  
  const section = document.createElement('section');
  section.className = 'w-full max-w-md bg-white rounded-xl p-7 shadow-lg border border-neutral-100 animate-slideUp';
  
  section.innerHTML = `
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-neutral-900 mb-2">Create Profile</h1>
      <p class="text-neutral-600 text-sm">Set Up A Local Parent Account</p>
    </div>

    <form class="form space-y-4">
      <div class="field">
        <label for="familyName" class="block text-sm font-semibold text-neutral-900 mb-1.5">Family Name</label>
        <input id="familyName" name="familyName" type="text" autocomplete="off" required value="Blackwood" class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>
      
      <div class="field">
        <label for="regUsername" class="block text-sm font-semibold text-neutral-900 mb-1.5">Username</label>
        <input id="regUsername" name="regUsername" type="text" autocomplete="off" minlength="5" required class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      <div class="field password-field">
        <label for="regPassword" class="block text-sm font-semibold text-neutral-900 mb-1.5">Password</label>
        <div class="password-wrap relative">
          <input id="regPassword" name="regPassword" type="password" required class="w-full px-3 py-2.5 pr-10 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <button type="button" class="password-toggle absolute right-3 top-2.5 w-5 h-5" data-password-toggle="regPassword" aria-label="Show password"></button>
        </div>
      </div>

      <div class="field password-field">
        <label for="regConfirm" class="block text-sm font-semibold text-neutral-900 mb-1.5">Confirm Password</label>
        <div class="password-wrap relative">
          <input id="regConfirm" name="regConfirm" type="password" required class="w-full px-3 py-2.5 pr-10 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <button type="button" class="password-toggle absolute right-3 top-2.5 w-5 h-5" data-password-toggle="regConfirm" aria-label="Show password"></button>
        </div>
      </div>

      <div class="field bg-primary-50 p-3 rounded-lg border border-primary-200">
        <p class="text-xs text-neutral-700 mb-2">
          <strong>Liability Disclaimer:</strong> Oakwood provides guidance based on your input. We do not guarantee outcomes or accept liability for decisions you make.
        </p>
        <label class="flex items-start gap-2 text-sm">
          <input id="regConsent" type="checkbox" required class="mt-1 w-4 h-4" />
          <span class="text-neutral-700">I accept the legal terms and understand the limitations</span>
        </label>
      </div>

      <div class="field">
        <label for="regMethod" class="block text-sm font-semibold text-neutral-900 mb-1.5">Verification Method</label>
        <select id="regMethod" name="regMethod" class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </div>

      <div class="flex gap-2">
        <button type="button" class="flex-1 button-secondary py-2.5 text-sm font-medium" data-role="send-code">Send Code</button>
        <input id="regCode" name="regCode" type="text" placeholder="Code" autocomplete="off" class="flex-1 px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
      </div>

      <button type="submit" class="w-full button bg-primary-600 text-white py-2.5 mt-6">Create Profile</button>
    </form>

    <div class="flex gap-2 mt-4">
      <a href="#/signin" class="flex-1 button-secondary py-2 text-sm">Back to Sign In</a>
    </div>

    <div class="relative my-4">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-neutral-200"></div>
      </div>
      <div class="relative flex justify-center text-xs">
        <span class="px-2 bg-white text-neutral-600">Or Create With</span>
      </div>
    </div>

    <button type="button" class="w-full button-secondary py-2.5 text-sm font-medium" data-role="google-mock">Create With Google</button>
  `;

  container.appendChild(section);

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

  return container;
}
