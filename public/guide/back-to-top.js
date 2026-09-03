const topBtn = document.getElementById('topBtn');
window.addEventListener('scroll', () => {
  if (window.scrollY > 500) topBtn.classList.add('show');
  else topBtn.classList.remove('show');
});
topBtn.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
