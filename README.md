# BRASIL — Praça Virtual 3D

Protótipo multiplayer low-poly para navegador, feito com Three.js, Node.js, Express e Socket.IO. Funciona em celular e computador.

## O que já funciona
- Mundo 3D low-poly com avenida, praça, árvores, bancos e construções.
- Personagem controlável em terceira pessoa.
- Multiplayer em tempo real via Socket.IO: posição, entrada/saída de jogadores e texto da bandeira.
- Chat público com mensagens filtradas por tamanho e inseridas como texto seguro.
- Controles WASD/setas no computador e joystick na tela em celulares.
- Layout responsivo e entrada com nome.

## Requisitos
- Node.js 18 ou mais recente.
- Conexão com a internet para carregar Three.js e fontes via CDN.

## Executar no computador
1. Extraia o ZIP.
2. Abra um terminal na pasta `brasil_game`.
3. Execute:
   ```bash
   npm install
   npm start
   ```
4. Abra `http://localhost:3000`.

Para testar multiplayer local, abra o endereço em duas abas ou em dois dispositivos conectados à mesma rede. Para outro dispositivo acessar o servidor local, use o IP local do computador em vez de `localhost` (e permita a porta 3000 no firewall).

## Publicar gratuitamente no Render
1. Crie um repositório GitHub e envie todos os arquivos desta pasta.
2. No Render, escolha **New + → Web Service** e conecte o repositório.
3. Use:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free (se disponível na sua conta/região)
4. Aguarde o deploy e abra o endereço HTTPS criado pelo Render. O Socket.IO usa o mesmo domínio.

## Limitações importantes desta primeira versão
- É um protótipo: sem persistência de conta, banco de dados, inventário, moderação avançada ou proteção contra trapaças.
- O limite de 80 jogadores é apenas um limite básico por processo, não uma promessa de desempenho.
- O servidor aceita posições informadas pelo cliente; para produção, valide velocidade, frequência e colisões no servidor.
- O chat ainda não tem denúncia, bloqueio, filtro de spam ou painel de moderação. Antes de abrir ao público, implemente essas ferramentas.
- O jogo usa recursos CDN externos e precisa de internet para carregar o motor 3D.
- Se o serviço gratuito dormir por inatividade, a primeira conexão pode demorar para acordar.

## Estrutura
```text
brasil_game/
├── package.json
├── server.js
├── README.md
└── public/
    ├── index.html
    ├── style.css
    └── game.js
```
