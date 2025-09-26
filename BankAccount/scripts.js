let accounts = [];
let currentUser = null;

function goHome() {
  hideAll();
  document.getElementById("main-menu").classList.remove("hidden");
}

function hideAll() {
  document.getElementById("main-menu").classList.add("hidden");
  document.getElementById("create-account").classList.add("hidden");
  document.getElementById("login").classList.add("hidden");
  document.getElementById("dashboard").classList.add("hidden");
}

function showCreateAccount() {
  hideAll();
  document.getElementById("create-account").classList.remove("hidden");
}

function showLogin() {
  hideAll();
  document.getElementById("login").classList.remove("hidden");
}

function showAccountCount() {
  alert("Total accounts created: " + accounts.length);
}

function createAccount() {
  const fullName = document.getElementById("fullName").value.trim();
  const dob = document.getElementById("dob").value.trim();
  const accType = document.getElementById("accType").value;
  const password = document.getElementById("password").value;
  const pin = document.getElementById("pin").value;

  if (!fullName || !dob || !password || !pin) {
    document.getElementById("create-msg").innerText = "All fields are required!";
    return;
  }

  if (!isValidPassword(password)) {
    document.getElementById("create-msg").innerText = "Password must be 8+ chars with upper, lower, digit, special.";
    return;
  }

  if (!/^\d{4}$/.test(pin)) {
    document.getElementById("create-msg").innerText = "PIN must be exactly 4 digits.";
    return;
  }

  const accNumber = Date.now(); // simple unique id
  const account = {
    accNumber,
    fullName,
    dob,
    accType,
    password,
    pin,
    balance: 0,
    transactions: [`Account created on ${new Date().toLocaleString()}`]
  };

  accounts.push(account);
  document.getElementById("create-msg").style.color = "green";
  document.getElementById("create-msg").innerText = "Account created! Account No: " + accNumber;
}

function login() {
  const accNum = document.getElementById("loginAcc").value.trim();
  const pwd = document.getElementById("loginPwd").value;
  const pin = document.getElementById("loginPin").value;

  const account = accounts.find(a => a.accNumber.toString() === accNum);
  if (!account) {
    document.getElementById("login-msg").innerText = "Account not found.";
    return;
  }

  if (account.password === pwd && account.pin === pin) {
    currentUser = account;
    currentUser.transactions.push("Successful login");
    hideAll();
    document.getElementById("dashboard").classList.remove("hidden");
    document.getElementById("welcome").innerText = "Welcome, " + currentUser.fullName.split(" ")[0];
    document.getElementById("output").innerHTML = "";
  } else {
    document.getElementById("login-msg").innerText = "Invalid password or PIN.";
  }
}

function logout() {
  currentUser = null;
  goHome();
}

function deposit() {
  const amt = parseFloat(prompt("Enter amount to deposit:"));
  if (isNaN(amt) || amt <= 0) return alert("Invalid amount");
  currentUser.balance += amt;
  currentUser.transactions.push(`Deposited ₹${amt.toFixed(2)}`);
  showOutput(`Deposited ₹${amt.toFixed(2)}. New balance: ₹${currentUser.balance.toFixed(2)}`);
}

function withdraw() {
  const amt = parseFloat(prompt("Enter amount to withdraw:"));
  if (isNaN(amt) || amt <= 0) return alert("Invalid amount");
  if (currentUser.accType === "Savings" && currentUser.balance - amt < 500) {
    return alert("Withdrawal denied. Min balance ₹500 required.");
  }
  if (currentUser.accType === "Current" && currentUser.balance - amt < -5000) {
    return alert("Overdraft limit exceeded (₹5000).");
  }
  currentUser.balance -= amt;
  currentUser.transactions.push(`Withdrew ₹${amt.toFixed(2)}`);
  showOutput(`Withdrew ₹${amt.toFixed(2)}. New balance: ₹${currentUser.balance.toFixed(2)}`);
}

function checkBalance() {
  showOutput(`Current Balance: ₹${currentUser.balance.toFixed(2)}`);
  currentUser.transactions.push("Balance inquiry");
}

function changePassword() {
  const newPass = prompt("Enter new password:");
  if (!isValidPassword(newPass)) return alert("Password must be 8+ chars with upper, lower, digit, special.");
  currentUser.password = newPass;
  currentUser.transactions.push("Password changed");
  showOutput("Password updated successfully.");
}

function changePin() {
  const newPin = prompt("Enter new 4-digit PIN:");
  if (!/^\d{4}$/.test(newPin)) return alert("PIN must be 4 digits.");
  currentUser.pin = newPin;
  currentUser.transactions.push("PIN changed");
  showOutput("PIN updated successfully.");
}

function viewDetails() {
  let info = `
  Account No: ${currentUser.accNumber}<br>
  Name: ${currentUser.fullName}<br>
  DOB: ${currentUser.dob}<br>
  Type: ${currentUser.accType}<br>
  Balance: ₹${currentUser.balance.toFixed(2)}
  `;
  showOutput(info);
}

function viewTransactions() {
  const lastTxns = currentUser.transactions.slice(-5).join("<br>");
  showOutput("Last Transactions:<br>" + lastTxns);
}

function applyInterest() {
  if (currentUser.accType !== "Savings") return alert("Interest only for Savings Accounts.");
  const years = parseInt(prompt("Enter number of years:"));
  if (isNaN(years) || years <= 0) return alert("Invalid years");
  const interest = (currentUser.balance * 4 * years) / 100;
  currentUser.balance += interest;
  currentUser.transactions.push(`Interest ₹${interest.toFixed(2)} applied for ${years} year(s)`);
  showOutput(`Interest ₹${interest.toFixed(2)} added. New balance: ₹${currentUser.balance.toFixed(2)}`);
}

function showOutput(msg) {
  document.getElementById("output").innerHTML = msg;
}

function isValidPassword(pwd) {
  return /[A-Z]/.test(pwd) &&
         /[a-z]/.test(pwd) &&
         /\d/.test(pwd) &&
         /[^A-Za-z0-9]/.test(pwd) &&
         pwd.length >= 8;
}
