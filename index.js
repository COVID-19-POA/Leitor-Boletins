const pdfjsLib = require("pdfjs-dist");
const fs = require('fs');

const sp_url = (date) => `http://www.saude.sp.gov.br/resources/cve-centro-de-vigilancia-epidemiologica/areas-de-vigilancia/doencas-de-transmissao-respiratoria/coronavirus/coronavirus${date}situacao_epidemiologica.pdf`

// List de todos os boletins, contendo o código (a ser convertido em url), data, e último item da tabela
const boletins_sp = [
  {code: '2503_30', date: '25/03/2020'},
  { code: '2603_31', date: '26/03/2020'},
  { code: '2703_32', date: '27/03/2020'},
  { code: '300320_33', date: '30/03/2020'},
  { code: '310320_34', date: '31/03/2020'},
  { code: '010420_35', date: '01/04/2020'},
  { code: '020420_36', date: '02/04/2020'},
  { code: '030420_37', date: '03/04/2020'},
  { code: '0404_38', date: '04/04/2020'},
  { code: '9', date: '05/04/2020'},
  { code: '060420_40', date: '06/04/2020'},
  { code: '070420_41', date: '07/04/2020'},
  { code: '080420_42', date: '08/04/2020'},
  { code: '090420_43', date: '09/04/2020'},
  { code: '100420_44', date: '10/04/2020'},
  { code: '110420_45', date: '11/04/2020'},
  { code: '120420_46', date: '12/04/2020'},
].map(date => ({
  url: sp_url(date.code),
  last: 'IGNORADO',
  date: date.date
}));

boletins_sp[8].last = 'IGN';
boletins_sp[9] = {
  url: 'http://www.saude.sp.gov.br/resources/cve-centro-de-vigilancia-epidemiologica/areas-de-vigilancia/doencas-de-transmissao-respiratoria/coronavirus/coronavirus_-_situacao_epidemiologica-_39_1.pdf',
  last: 'IGN'
}

boletins_sp[15].last = 'OUTRO PAÍS';
boletins_sp[16].last = 'OUTRO PAÍS';

async function lerBoletim(fileName, last) {
  const pdf = await pdfjsLib.getDocument(fileName).promise;
  const page = await pdf.getPage(1);
  // Lê o conteúdo do pdf
  const content = await page.getTextContent();
  // Cria uma lista com os items
  const items = content.items.map(item => item.str);
  // Identifica onde existe a palavra ÓBITOS -> Inidica o começo da tabela 
  const idx = items.indexOf('ÓBITOS');
  const lastIdx = items.indexOf(last);
  // Pega as palavras entre o começo da tabela e o último item da tabela
  const table = items.slice(idx + 7, lastIdx + 3);
  const res = {};
  // Lista de informações a serem descartadas da tabela
  const ignoreList = ['IGN', 'IGNORADO', 'OUTRO PAIS', 'OUTRO PAÍS', 'OUTRO ESTADO', 'Outro Estado', 'IGNORADO OU EXTERIOR'];
  for (let i = 0; i < table.length; i += 3) {
    // Deixa tudo para maiúsculo para evitar diferença de formatação
    const name = table[i].toUpperCase();
    // Adiciona no dicionario a chave com nome do município, contendo um dicionário com nome, número de confirmados e número de mortes
    if (ignoreList.indexOf(name) === -1) {
      res[table[i]] = {
        name,
        confirmados: table[i+1],
        mortes: table[i+2]
      }
    }
  }
  return res;
}

async function lerTodosBoletins(start = 0, end = boletins_sp.length) {
  res = {};
  const boletins = boletins_sp.slice(start, end);
  for (let i = boletins.length - 1; i >=0; i--) {
    const data = await lerBoletim(boletins[i].url, boletins[i].last);
    res[boletins[i].date] = data;
  }
  return res;
}

// Ler boletins a partir de 06/04 e salva em arquivo JSON
lerTodosBoletins(start=10).then(data => {
  fs.writeFile('output.json', JSON.stringify(data, null, 2), function() {});
})