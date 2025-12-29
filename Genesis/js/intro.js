const scene = document.querySelector('#scene');
const vrButton = document.querySelector('#vrButton');
const ui = document.querySelector('#ui');

const veritas = document.querySelector('#veritas');
const gameTitle = document.querySelector('#gameTitle');
const narration = document.querySelector('#narration');
const genesis = document.querySelector('#genesis');
const playerPrompt = document.querySelector('#playerPrompt');
const audio = document.querySelector('#audio');

let vrActive = false;

// VR BUTTON
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

// INTRO SEQUENCE
function startIntro() {

  // VERITAS
  veritas.setAttribute('visible', true);

  setTimeout(() => {
    veritas.setAttribute('visible', false);
    gameTitle.setAttribute('visible', true);
  }, 3000);

  // THE GAME OF LIFE
  setTimeout(() => {
    gameTitle.setAttribute('visible', false);
    narration.setAttribute('visible', true);
    narration.setAttribute('text', 'value: NO PRINCÍPIO, EXISTIA APENAS O INOMINÁVEL...');
    audio.components.sound.playSound();
  }, 6000);

  // NARRAÇÃO CONTINUA
  setTimeout(() => {
    narration.setAttribute(
      'text',
      'value: DA VONTADE SURGIU A LUZ. E QUANDO A VIDA DESPERTOU, O JOGO COMEÇOU.'
    );
  }, 10000);

  // GENESIS
  setTimeout(() => {
    narration.setAttribute('visible', false);
    genesis.setAttribute('visible', true);
  }, 15000);

  // IDENTIFICAÇÃO DO JOGADOR
  setTimeout(() => {
    genesis.setAttribute('visible', false);
    playerPrompt.setAttribute('visible', true);
  }, 18000);
}

// INICIAR AUTOMATICAMENTE
window.addEventListener('load', startIntro);
