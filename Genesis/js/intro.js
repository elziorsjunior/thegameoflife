const scene = document.querySelector('#scene');
const vrButton = document.querySelector('#vrButton');
const ui = document.querySelector('#ui');

const veritas = document.querySelector('#veritas');
const gameTitle = document.querySelector('#gameTitle');

let vrActive = false;

vrButton.addEventListener('click', () => {
  if (!vrActive) {
    scene.enterVR();
    vrButton.innerText = 'Sair do VR';
    vrActive = true;
    setTimeout(() => ui.style.display = 'none', 500);
  } else {
    scene.exitVR();
    vrButton.innerText = 'Entrar em VR';
    vrActive = false;
    ui.style.display = 'block';
  }
});

function animateVeritas() {
  veritas.setAttribute('visible', true);

  veritas.setAttribute('animation__in_opacity', {
    property: 'material.opacity',
    from: 0,
    to: 1,
    dur: 2000
  });

  veritas.setAttribute('animation__in_position', {
    property: 'position',
    from: '0 1.6 -6',
    to: '0 1.6 -4',
    dur: 2000
  });

  setTimeout(() => {
    veritas.setAttribute('animation__out_opacity', {
      property: 'material.opacity',
      from: 1,
      to: 0,
      dur: 2000
    });
  }, 3000);

  setTimeout(() => {
    veritas.setAttribute('visible', false);
  }, 5200);
}

function animateGameTitle() {
  gameTitle.setAttribute('visible', true);

  gameTitle.setAttribute('animation__in_opacity', {
    property: 'material.opacity',
    from: 0,
    to: 1,
    dur: 2500
  });

  gameTitle.setAttribute('animation__in_position', {
    property: 'position',
    from: '0 1.6 -6',
    to: '0 1.6 -4',
    dur: 2500
  });

  setTimeout(() => {
    gameTitle.setAttribute('animation__out_opacity', {
      property: 'material.opacity',
      from: 1,
      to: 0,
      dur: 2000
    });
  }, 3500);

  setTimeout(() => {
    gameTitle.setAttribute('visible', false);
  }, 6000);
}

window.addEventListener('load', () => {
  animateVeritas();
  setTimeout(animateGameTitle, 6000);
});
