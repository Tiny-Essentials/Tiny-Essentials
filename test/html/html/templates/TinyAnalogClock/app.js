import { TinyAnalogClock } from '/src/v1/libs/html/templates/TinyAnalogClock.mjs';

// 1. Initialize the clock
const myClock = new TinyAnalogClock({ borderColor: '#ff0055' });
window.myClock = myClock;

// 2. Append the generated HTML to your page
document.getElementById('clock-wrapper').appendChild(myClock.element);
