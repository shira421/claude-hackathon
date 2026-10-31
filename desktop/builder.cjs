module.exports={
  appId:'org.deckforge.studio',productName:'Deckforge',electronVersion:'45.2.1',
  directories:{output:'release'},
  files:['dist/**/*','desktop/main.cjs','desktop/preload.cjs','desktop/anthropic.cjs','package.json','LICENSE'],
  extraMetadata:{main:'desktop/main.cjs',version:'0.2.0',description:'Offline slide design studio with Claude-powered elements and design agents',author:'Deckforge contributors',dependencies:{}},
  asar:true,npmRebuild:false,
  win:{target:[{target:'nsis',arch:['x64']},{target:'portable',arch:['x64']}],icon:'public/icon-512.png',signAndEditExecutable:false},
  nsis:{oneClick:false,allowToChangeInstallationDirectory:true,artifactName:'Deckforge-Setup-${version}-${arch}.${ext}'},
  portable:{artifactName:'Deckforge-Portable-${version}-${arch}.${ext}'},
};
