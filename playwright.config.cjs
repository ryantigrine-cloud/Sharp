const {defineConfig,devices}=require('playwright/test');
module.exports=defineConfig({
  testDir:'./tests/browser',timeout:120000,expect:{timeout:6000},workers:2,retries:0,
  reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure',screenshot:'only-on-failure'},
  projects:[{name:'chromium-mobile',use:{browserName:'chromium',viewport:{width:390,height:844},hasTouch:true}},{name:'webkit-mobile',use:{...devices['iPhone 13'],browserName:'webkit'}}],
  webServer:{command:'python3 -m http.server 4173 --bind 127.0.0.1',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI}
});
