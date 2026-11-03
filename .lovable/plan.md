# Editor de vídeo com IA (baseado no ArtCraft)

O ArtCraft é um programa de computador (Rust/Tauri) com editor 3D e várias integrações de IA para imagens. Ele não roda na web como está, então vamos usar apenas o visual e as ideias dele e construir um app web novo focado no seu fluxo.

## Fluxo do usuário

1. **Enviar vídeos** – arrastar vários clipes (com prévia e duração de cada um).
2. **Estilo de edição** – cards para escolher: Fast-paced, Cinematic, Vlog, Storytelling, Highlight/Esportes, Minimalista.
3. **Intenção do vídeo** – texto livre + categorias (Venda, Tutorial, Viagem, Lifestyle, Evento, Humor...).
4. **Plataforma e enquadramento** – TikTok/Reels/Shorts (9:16), YouTube (16:9), Feed (1:1 ou 4:5).
5. **Duração final** – 15s, 30s, 60s, 90s ou personalizada.
6. **Áudio** – usar áudio original OU enviar música (com seletor do trecho: início/fim).
7. **Gerar** – a IA assiste os clipes, escolhe os melhores trechos, define a ordem, cortes, transições, velocidade e zoom conforme o estilo.
8. **Resultado** – linha do tempo mostrando cada trecho escolhido e o motivo, prévia do vídeo final, botão de baixar e opção de "refazer" com ajustes.

## Contas e histórico
Login com e-mail/Google; cada usuário vê seus projetos e vídeos gerados.

## Visual
Interface escura de estúdio, inspirada no ArtCraft (fontes Archivo + Geist Mono do projeto original), passo a passo em formato de assistente.

## Detalhes técnicos
- **Lovable Cloud**: autenticação, armazenamento dos vídeos/músicas (bucket privado) e tabelas `projects` (configurações do assistente, status) e `edit_plans` (lista de cortes em JSON). RLS por usuário.
- **Análise com IA**: server function envia cada clipe ao Gemini (Lovable AI Gateway, entende vídeo) e recebe descrição de cenas com marcações de tempo, energia e momentos-chave. Uma segunda chamada gera o "plano de edição" (JSON: clipe, início, fim, velocidade, transição, zoom, efeito) respeitando duração, estilo, plataforma e batidas da música.
- **Renderização**: feita no navegador com ffmpeg.wasm (cortes, recorte para 9:16/16:9/1:1, velocidade, transições básicas, mixagem da música ou áudio original). Limite inicial sugerido: até ~5 minutos de material total e arquivos até ~200MB, pois o processamento ocorre no computador do usuário.
- **Fora desta primeira versão**: legendas automáticas, efeitos 3D e as integrações de geração de imagem do ArtCraft (podem entrar depois).
