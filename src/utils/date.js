export function getDetailedAge(dob){
  const m = String(dob || '').trim().match(/^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/);
  if (!m) return '';
  const day = Number(m[1]);
  const month = Number(m[2]) - 1;
  const year = Number(m[3]);
  if (!day || month < 0 || year < 1900) return '';
  const birth = new Date(year, month, day);
  if (Number.isNaN(birth.getTime())) return '';

  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return '';
  return `${years} Years ${months} Months`;
}
