export const matrixProtocol = Object.freeze({
  userName: {
    prefix: '@',
    validValues: '[a-z0-9._=-]+',
    domainPattern: ':[a-z0-9.-]+\\.[a-z]{2,}',
  },
  roomName: {
    prefix: '#',
    validValues: '[a-z0-9._=-]+',
    domainPattern: ':[a-z0-9.-]+\\.[a-z]{2,}',
  },
});
