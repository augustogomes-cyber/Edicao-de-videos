# Edição real dos vídeos

## O que será feito
- Substituir a reprodução sequencial simples por uma prévia composta que aplique efeitos visuais do estilo escolhido, zoom/movimento animado e transições entre os trechos.
- Adicionar exportação do vídeo editado no navegador, com os cortes, enquadramento e áudio escolhidos, exibindo o andamento e permitindo baixar o arquivo final.
- Manter o app estático no GitHub Pages e processar os arquivos localmente no navegador; sem enviar os vídeos a um serviço externo.
- Testar as regras da linha do tempo e verificar a prévia e o fluxo de exportação.

## Detalhes técnicos
Usar canvas para compor cada quadro e MediaRecorder para gravar a saída, escolhendo um formato de vídeo realmente suportado pelo navegador (normalmente WebM). A prévia e o arquivo exportado devem usar os mesmos parâmetros. MP4 universal não será prometido; suporte a codecs depende do navegador.
