/* 193 membros da ONU + Palestina e Vaticano. Códigos ISO 3166-1 alpha-2. */
(function (root) {
  'use strict';
  const rows = `
af|Afeganistão
za|África do Sul
al|Albânia
de|Alemanha
ad|Andorra
ao|Angola
ag|Antígua e Barbuda
sa|Arábia Saudita
dz|Argélia
ar|Argentina
am|Armênia
au|Austrália
at|Áustria
az|Azerbaijão
bs|Bahamas
bh|Bahrein|Barém
bd|Bangladesh
bb|Barbados
be|Bélgica
bz|Belize
bj|Benim|Benin
by|Bielorrússia|Belarus
bo|Bolívia
ba|Bósnia e Herzegovina|Bósnia
bw|Botsuana|Botswana
br|Brasil
bn|Brunei
bg|Bulgária
bf|Burkina Faso|Burquina Faso
bi|Burundi
bt|Butão
cv|Cabo Verde
cm|Camarões
kh|Camboja
ca|Canadá
qa|Catar|Qatar
kz|Cazaquistão
td|Chade
cl|Chile
cn|China|República Popular da China
cy|Chipre
co|Colômbia
km|Comores
cg|República do Congo|Congo|Congo-Brazzaville
cd|República Democrática do Congo|RDC|Congo-Kinshasa
kp|Coreia do Norte|Coréia do Norte
kr|Coreia do Sul|Coréia do Sul
ci|Costa do Marfim
cr|Costa Rica
hr|Croácia
cu|Cuba
dk|Dinamarca
dj|Djibuti|Djibouti
dm|Dominica
eg|Egito
sv|El Salvador
ae|Emirados Árabes Unidos|EAU
ec|Equador
er|Eritreia
sk|Eslováquia
si|Eslovênia
es|Espanha
us|Estados Unidos|EUA|Estados Unidos da América|USA
ee|Estônia
sz|Essuatíni|Eswatini|Suazilândia
et|Etiópia
fj|Fiji
ph|Filipinas
fi|Finlândia
fr|França
ga|Gabão
gm|Gâmbia
gh|Gana
ge|Geórgia
gd|Granada
gr|Grécia
gt|Guatemala
gy|Guiana
gn|Guiné
gq|Guiné Equatorial
gw|Guiné-Bissau|Guiné Bissau
ht|Haiti
hn|Honduras
hu|Hungria
ye|Iêmen|Iémen
mh|Ilhas Marshall
sb|Ilhas Salomão
in|Índia
id|Indonésia
ir|Irã|Irão
iq|Iraque
ie|Irlanda
is|Islândia
il|Israel
it|Itália
jm|Jamaica
jp|Japão
jo|Jordânia
ki|Kiribati|Quiribati
kw|Kuwait|Kuaite
la|Laos
ls|Lesoto
lv|Letônia
lb|Líbano
lr|Libéria
ly|Líbia
li|Liechtenstein|Listenstaine
lt|Lituânia
lu|Luxemburgo
mk|Macedônia do Norte
mg|Madagascar
my|Malásia
mw|Malawi|Maláui
mv|Maldivas
ml|Mali
mt|Malta
ma|Marrocos
mu|Maurício|Maurícia|Ilhas Maurício
mr|Mauritânia
mx|México
fm|Micronésia|Estados Federados da Micronésia
mz|Moçambique
md|Moldávia|Moldova
mc|Mônaco
mn|Mongólia
me|Montenegro
mm|Myanmar|Mianmar|Birmânia
na|Namíbia
nr|Nauru
np|Nepal
ni|Nicarágua
ne|Níger
ng|Nigéria
no|Noruega
nz|Nova Zelândia
om|Omã
nl|Países Baixos|Holanda
pw|Palau
ps|Palestina|Estado da Palestina
pa|Panamá
pg|Papua-Nova Guiné|Papua Nova Guiné
pk|Paquistão
py|Paraguai
pe|Peru
pl|Polônia
pt|Portugal
ke|Quênia|Quénia
kg|Quirguistão|Quirguizistão
gb|Reino Unido|Grã-Bretanha|Grã Bretanha
cf|República Centro-Africana|República Centro Africana
do|República Dominicana
cz|Tchéquia|República Tcheca|Chéquia|República Checa
ro|Romênia
rw|Ruanda
ru|Rússia|Federação Russa
ws|Samoa
sm|San Marino|São Marinho
lc|Santa Lúcia
kn|São Cristóvão e Névis|São Cristóvão e Nevis
st|São Tomé e Príncipe
vc|São Vicente e Granadinas|São Vicente e as Granadinas
sc|Seicheles|Seychelles
sn|Senegal
sl|Serra Leoa
rs|Sérvia
sg|Singapura|Cingapura
sy|Síria
so|Somália
lk|Sri Lanka|Seri Lanca
sd|Sudão
ss|Sudão do Sul
se|Suécia
ch|Suíça
sr|Suriname
tj|Tajiquistão|Tadjiquistão
th|Tailândia
tz|Tanzânia
tl|Timor-Leste|Timor Leste
tg|Togo
to|Tonga
tt|Trinidad e Tobago|Trindade e Tobago
tn|Tunísia
tm|Turcomenistão|Turquemenistão
tr|Turquia|Türkiye
tv|Tuvalu
ua|Ucrânia
ug|Uganda
uy|Uruguai
uz|Uzbequistão
vu|Vanuatu
va|Vaticano|Cidade do Vaticano|Santa Sé
ve|Venezuela
vn|Vietnã|Vietname|Vietnão
zm|Zâmbia
zw|Zimbábue|Zimbabwe|Zimbabué
`.trim();
  const countries = rows.split('\n').map(row => {
    const [code, name, ...aliases] = row.split('|');
    return Object.freeze({ code, name, answers: Object.freeze([...new Set([name, ...aliases])]), flag: `assets/flags/${code}.svg` });
  });
  root.FlagCountries = Object.freeze(countries);
  if (typeof module !== 'undefined' && module.exports) module.exports = root.FlagCountries;
})(globalThis);
