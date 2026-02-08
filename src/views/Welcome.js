export function Welcome(){
  const container = document.createElement('div');
  container.className = 'min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4 py-12';
  
  const section = document.createElement('section');
  section.className = 'w-full max-w-2xl text-center animate-slideUp';
  
  section.innerHTML = `
    <div class="mb-8">
      <h1 class="text-5xl font-bold text-neutral-900 mb-4 leading-tight">
        A Clear, Structured View Of <span class="text-primary-600">Your Child's Learning</span>
      </h1>
      <p class="text-xl text-neutral-600 max-w-lg mx-auto">Aligned With The UK Curriculum. Simple, Transparent Parenting At Your Fingertips.</p>
    </div>
    
    <div class="flex flex-col sm:flex-row gap-3 justify-center mt-10">
      <a href="#/add-child" class="button bg-primary-600 text-white px-8 py-3 text-lg font-semibold rounded-lg hover:bg-primary-700 transition-colors">
        Start with a Student
      </a>
      <a href="#/signin" class="button-secondary px-8 py-3 text-lg font-semibold rounded-lg border-2">
        Sign In to Existing Profile
      </a>
    </div>
    
    <div class="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
      <div class="card">
        <div class="text-3xl mb-2">📚</div>
        <h3 class="font-semibold text-neutral-900 mb-1">UK Curriculum</h3>
        <p class="text-sm text-neutral-600">Aligned With Official Guidelines</p>
      </div>
      <div class="card">
        <div class="text-3xl mb-2">🎯</div>
        <h3 class="font-semibold text-neutral-900 mb-1">Clear Progress</h3>
        <p class="text-sm text-neutral-600">See What They're Learning</p>
      </div>
      <div class="card">
        <div class="text-3xl mb-2">🔒</div>
        <h3 class="font-semibold text-neutral-900 mb-1">Secure & Private</h3>
        <p class="text-sm text-neutral-600">Your Data Is Protected</p>
      </div>
    </div>
  `;
  
  container.appendChild(section);
  return container;
}
