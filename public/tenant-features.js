// OTP & Contacts Logic for Tenant Portal
window.generatedOTPs = {};

function generateOTP(userType) {
  const phoneInput = document.getElementById(`${userType}Phone`);
  if (!phoneInput.value || phoneInput.value.length < 10) {
    if (typeof toast === 'function') {
      toast('Invalid Phone', 'Please enter a valid phone number', 'warning');
    } else {
      alert('Please enter a valid phone number');
    }
    phoneInput.focus();
    return;
  }

  const btn = document.getElementById(`${userType}-generate-btn`);
  const originalText = btn.innerText;
  btn.innerText = 'Sending...';
  btn.disabled = true;

  setTimeout(() => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    window.generatedOTPs[userType] = { code: otp.toString(), verified: false };


    document.getElementById(`${userType}-otp-input-group`).style.display = 'block';
    btn.style.display = 'none';

    alert(`Rentiva OTP Code: ${otp}\nSentinel: Do not share this code.`);
    if (typeof toast === 'function') {
      toast('OTP Sent', 'OTP sent to phone and email', 'success');
    }

    startOTPTimer(userType);
  }, 1500);
}

function startOTPTimer(userType) {
  let timeLeft = 30;
  const timerDisplay = document.getElementById(`${userType}timer`);
  const input = document.getElementById(`${userType}otp-input`);
  const status = document.getElementById(`${userType}otp-status`);

  // Fix IDs for timer, input, and status if they don't exactly match (adding hyphen)
  const timerEl = document.getElementById(`${userType}-timer`) || timerDisplay;
  const inputEl = document.getElementById(`${userType}-otp-input`) || input;
  const statusEl = document.getElementById(`${userType}-otp-status`) || status;

  statusEl.innerText = '';
  inputEl.value = '';
  inputEl.disabled = false;
  inputEl.focus();

  if (window.generatedOTPs[userType].timerId) clearInterval(window.generatedOTPs[userType].timerId);

  window.generatedOTPs[userType].timerId = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(window.generatedOTPs[userType].timerId);

      timerEl.innerText = "Resend OTP";
      timerEl.style.cursor = "pointer";
      timerEl.style.textDecoration = "underline";
      timerEl.onclick = () => generateOTP(userType);
    } else {
      timerEl.innerText = `Resend in 00:${timeLeft < 10 ? '0' : ''}${timeLeft}`;
      timeLeft--;
    }
  }, 1000);

  inputEl.oninput = function () {
    if (this.value.length === 6) {
      verifyOTP(userType, this.value);
    }
  };
}

function verifyOTP(userType, inputCode) {
  const status = document.getElementById(`${userType}-otp-status`);
  const input = document.getElementById(`${userType}-otp-input`);

  if (inputCode === window.generatedOTPs[userType].code) {
    window.generatedOTPs[userType].verified = true;

    status.innerText = '✓ Verified';
    status.style.color = 'var(--primary)';
    input.style.borderColor = 'var(--primary)';
    input.disabled = true;
    clearInterval(window.generatedOTPs[userType].timerId);
    if (typeof toast === 'function') {
      toast('Verified', 'Phone number verified successfully', 'success');
    }
  } else {
    status.innerText = '✗ Invalid OTP';
    status.style.color = 'var(--danger)';
    input.style.borderColor = 'var(--danger)';
    window.generatedOTPs[userType].verified = false;
  }
}


async function syncContacts(inputId) {
  const input = document.getElementById(inputId);
  if ('contacts' in navigator && 'ContactsManager' in window) {
    try {
      const props = ['name', 'tel'];
      const opts = { multiple: false };
      const contacts = await navigator.contacts.select(props, opts);
      if (contacts.length) {
        const contact = contacts[0];
        const number = contact.tel && contact.tel[0] ? contact.tel[0] : '';
        input.value = number;

        if (window.auth && window.auth.currentUser) {
          const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js");
          const cleanNumber = number.replace(/[^0-9]/g, '');
          if (cleanNumber) {
            await setDoc(doc(window.db, 'users', window.auth.currentUser.uid, 'contacts', cleanNumber), {
              name: (contact.name && contact.name.length > 0) ? contact.name[0] : 'Unknown',
              phone: number,
              syncedAt: new Date()
            }, { merge: true });
          }
        }

        if (typeof toast === 'function') {
          const displayName = (contact.name && contact.name.length > 0) ? contact.name[0] : 'Unknown';
          toast('Synced', `Synced: ${displayName}`, 'success');
        }
      }
    } catch (ex) {
      console.error(ex);
      if (ex.name !== 'TypeError') {
        if (typeof toast === 'function') {
          toast('Error', 'Unable to access contacts', 'danger');
        }
      }
    }
  } else {
    if (typeof toast === 'function') {
      toast('Info', 'Contact Sync is only available on Mobile devices', 'warning');
    }
  }
}

function signOut() {
  if (window.signOutUserAction) {
    window.signOutUserAction();
  } else {
    window.location.href = 'landing.html';
  }
}

// Global exposure for event listeners
window.generateOTP = generateOTP;
window.syncContacts = syncContacts;
window.signOut = signOut;
