document.getElementById('open').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://cyberstore.zabka.pl/market/my-orders' });
  });
  
