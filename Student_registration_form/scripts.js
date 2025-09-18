document.getElementById("registrationForm").addEventListener("submit", function(event) {
  event.preventDefault();

  let fullname = document.getElementById("fullname").value.trim();
  let email = document.getElementById("email").value.trim();
  let phone = document.getElementById("phone").value.trim();
  let terms = document.getElementById("terms").checked;

  if (fullname === "" || email === "" || phone === "" || !terms) {
    alert("Please fill all fields and accept the terms.");
    return;
  }

  document.getElementById("successMessage").innerText = "✅ Registration Successful!";
  document.getElementById("registrationForm").reset();
});
