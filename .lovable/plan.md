# Editor de vídeo com IA (baseado no ArtCraft)

O ArtCraft é um programa de computador (Rust/Tauri) com editor 3D e várias integrações de IA para imagens. Ele não roda na web como está, então vamos usar apenas o visual e as ideias dele e construir um app web novo focado no seu fluxo.

## Fluxo do usuário

1. **Enviar vídeos** – arrastar vários clipes (com prévia e duração de cada um).
2. **Estilo de edição** – cards: Fast-paced, Cinematic, Vlog, Storytelling, Highlight/Esportes, Minimalista.
3. **Intenção do vídeo** – texto livre + categorias (Venda, Tutorial, Viagem, Lifestyle, Evento, Humor...).
4. **Plataforma e enquadramento** – TikTok/Reels/Shorts (9:16), YouTube (16:9), Feed (1:1 ou 4:5).
5. **Duração final** – 15s, 30s, 60s, 90s ou personalizada.
6. **Áudio** – usar o áudio original OU enviar uma música (com seletor do trecho: início/fim).
7. **Gerar** – a IA assiste os clipes, escolhe os melhores trechos, define ordem, cortes, transições, velocidade e zoom conforme o estilo.
8. **Resultado** – linha do tempo com cada trecho escolhido e o motivo, prévia do vídeo final, baixar e "refazer" com ajustes.

## Contas e histórico
Login com e-mail; cada usuário vê seus projetos e vídeos gerados.

## Visual
Interface escura de estúdio inspirada no ArtCraft (fontes Archivo + Geist Mono do original), em formato de assistente passo a passo.

## Hospedagem: seu Supabase + GitHub Pages

- **Supabase próprio**: você conecta em **Configurações do projeto → General → External Supabase → Connect**. Isso precisa ser feito por você antes de eu criar as tabelas.
- **GitHub Pages só hospeda páginas estáticas** (sem servidor). Por isso, todo o "backend" ficará no seu Supabase:
  - banco de dados, login e armazenamento dos vídeos/músicas;
  - **Edge Functions do Supabase** para chamar a IA que analisa os vídeos.
- **Chave de IA**: fora da Lovable, a IA embutida não funciona; será preciso uma chave do Google Gemini (Google AI Studio → Get API key), guardada como segredo no seu Supabase. Eu peço no momento certo, de forma segura.
- **Publicação**: um workflow do GitHub Actions gera o site e publica no GitHub Pages a cada alteração. Você conecta o GitHub em **Configurações → GitHub** e ativa Pages no repositório (Settings → Pages → Source: GitHub Actions).
- O botão Publicar da Lovable continua funcionando também, se quiser um segundo endereço.

## Detalhes técnicos
- App como SPA estática (modo SPA do TanStack Start / pré-renderização), sem server functions; todo acesso via `supabase-js` com RLS por usuário. `base` do Vite ajustado ao caminho do repositório no Pages + fallback `404.html`.
- Tabelas: `projects` (configurações do assistente, status), `clips`, `edit_plans` (lista de cortes em JSON). Bucket privado `media`. RLS `auth.uid() = user_id`.
- Edge Function `analyze-clips`: valida o usuário, envia cada clipe ao Gemini (entende vídeo) e retorna cenas com tempos, energia e momentos-chave. Edge Function `build-edit-plan`: gera o JSON (clipe, início, fim, velocidade, transição, zoom) respeitando duração, estilo, plataforma e música.
- Renderização no navegador com ffmpeg.wasm (cortes, recorte 9:16/16:9/1:1, velocidade, transições, mixagem de áudio). Limite inicial sugerido: ~5 min de material total e arquivos até ~200MB.
- Fora da 1ª versão: legendas automáticas, efeitos 3D e as integrações de imagem do ArtCraft.
