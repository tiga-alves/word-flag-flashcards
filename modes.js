(function (root) {
  'use strict';
  const regions = [
    ['africa', 'Bandeiras da África', 'dz ao bj bw bf bi cv cm cf td km cg cd ci dj eg gq er sz et ga gm gh gn gw ke ls lr ly mg mw ml mr mu ma mz na ne ng rw st sn sc sl so za ss sd tz tg tn ug zm zw'],
    ['asia', 'Bandeiras da Ásia', 'af am az bh bd bt bn kh cn cy ge in id ir iq il jp jo kz kp kr kw kg la lb my mv mn mm np om pk ps ph qa sa sg lk sy tj th tl tr tm ae uz vn ye'],
    ['europe', 'Bandeiras da Europa', 'al ad at by be ba bg hr cz dk ee fi fr de gr va hu is ie it lv li lt lu mt md mc me nl mk no pl pt ro ru sm rs sk si es se ch ua gb'],
    ['north-america', 'Bandeiras da América do Norte', 'ag bs bb bz ca cr cu dm do sv gd gt ht hn jm mx ni pa kn lc vc tt us'],
    ['south-america', 'Bandeiras da América do Sul', 'ar bo br cl co ec gy py pe sr uy ve'],
    ['oceania', 'Bandeiras da Oceania', 'au fj ki mh fm nr nz pw pg ws sb to tv vu']
  ];
  const modes = [Object.freeze({ id: 'random', name: '5 bandeiras aleatórias', count: 5 })];
  for (const [id, name, codes] of regions) modes.push(Object.freeze({ id, name, codes: Object.freeze(codes.split(' ')), count: codes.split(' ').length }));
  modes.push(Object.freeze({ id: 'world', name: 'Todas as bandeiras do mundo', count: 195 }));
  root.FlagModes = Object.freeze(modes);
  if (typeof module !== 'undefined' && module.exports) module.exports = root.FlagModes;
})(globalThis);
