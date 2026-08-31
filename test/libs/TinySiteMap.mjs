import TinySiteMap from '../../dist/v1/libs/tools/TinySiteMap.mjs'; // Ajuste o caminho se necessário
import TinySiteMapStream from '../../dist/v1/libs/tools/TinySiteMapStream.mjs'; // Ajuste o caminho se necessário

const testTinySiteMap = () => {
  // 1. Criamos a instância base que o stream precisa para herdar as configurações
  const baseSiteMap = new TinySiteMap({
    baseUrl: 'https://meusite.com.br',
    type: 'normal',
  });

  // 2. Iniciamos o stream passando as opções que consertamos
  const stream = new TinySiteMapStream(baseSiteMap, {
    xslUrl: '/estilo.xsl',
    lastmodDateOnly: true, // Vai cortar as horas da data
    level: 'warn', // Erros não vão quebrar o app, vão apenas gerar um aviso no console
  });

  // 3. Redirecionamos a saída do stream direto para o terminal para visualização
  stream.pipe(process.stdout);

  // 4. Escrevendo entradas válidas no stream
  stream.write({
    loc: '/home',
    lastmod: '2026-08-31T10:00:00Z',
    changefreq: 'daily',
    priority: 1.0,
  });

  stream.write({
    loc: '/sobre',
    lastmod: '2026-08-30T15:30:00Z',
    priority: 0.8,
  });

  // 5. Escrevendo uma entrada INVÁLIDA para testar a resistência a falhas
  // A prioridade limite é 1.0, então 5.0 deve gerar um RangeError e ser ignorado pelo stream
  stream.write({
    loc: '/erro-proposital',
    priority: 5.0,
  });

  // 6. Fechando o stream (isso avisa que não tem mais dados e o footer do XML deve ser gerado)
  stream.end();
};

export default testTinySiteMap;
