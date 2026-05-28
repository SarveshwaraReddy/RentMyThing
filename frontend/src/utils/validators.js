const isEmail = (value) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const isInstitutionalEmail = (email) => {
  if (!isEmail(email)) {
    return false;
  }

  const lowerEmail = email.toLowerCase();
  return [".edu", ".ac.in"].some((domain) => lowerEmail.endsWith(domain));
};

const validatePassword = (password) => {
  return typeof password === "string" && password.length >= 8;
};

export { isEmail, isInstitutionalEmail, validatePassword };
