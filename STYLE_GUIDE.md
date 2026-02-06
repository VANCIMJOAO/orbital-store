# ORBITAL ROXA - Guia de Estilo

## Identidade Visual

**Marca:** ORBITAL ROXA
**Slogan:** "STAY IN THE GAME"
**Nicho:** Streetwear Gamer / Underground / Cyber

---

## Paleta de Cores

### Cores Principais
```
Roxo Principal:    #A855F7 (purple-500)
Roxo Claro:        #C084FC (purple-400)
Roxo Escuro:       #6B21A8 (purple-800)
Roxo Violeta:      #7C3AED (violet-600)
```

### Cores de Fundo
```
Preto Principal:   #0A0A0A (quase preto)
Cinza Escuro:      #27272A (bordas, separadores)
```

### Cores de Texto
```
Texto Principal:   #F5F5DC (bege claro/cream)
Texto Secundário:  #A1A1AA (cinza médio)
```

### Cores de Status
```
Verde (disponível):    #22C55E
Amarelo (baixo):       #EAB308
Vermelho (crítico):    #EF4444
```

---

## Tipografia

### Fontes
```css
font-display: 'Orbitron', sans-serif;  /* Títulos - estilo futurista/gamer */
font-mono: 'JetBrains Mono', monospace; /* Labels, tags, código */
font-body: 'Inter', sans-serif;         /* Texto corrido */
```

### Hierarquia
- **H1 (Hero):** font-display, 12rem, tracking-tight
- **H2 (Seções):** font-display, 4xl-5xl
- **H3 (Cards):** font-display, xl-2xl
- **Labels:** font-mono, xs-sm, tracking-widest, uppercase
- **Body:** font-body, base-lg

---

## Efeitos Visuais

### Glow (Brilho Roxo)
```css
.text-glow-intense {
  text-shadow:
    0 0 20px rgba(168, 85, 247, 0.8),
    0 0 40px rgba(168, 85, 247, 0.6),
    0 0 60px rgba(168, 85, 247, 0.4);
}
```

### Scanlines (Efeito CRT/Retro)
```css
.scanline {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.1) 4px
  );
}
```

### Grid Pattern (Fundo)
```css
.grid-pattern {
  background-image:
    linear-gradient(rgba(168, 85, 247, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(168, 85, 247, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}
```

### Gradient Orbs (Esferas Animadas)
- Círculos grandes com blur intenso (100-150px)
- Cores: #A855F7/20, #6B21A8/30, #7C3AED/20
- Animação: movimento suave, escala variável
- Duração: 12-20 segundos, infinito

### Partículas Flutuantes
- Pontos pequenos (1-2px)
- Cor: #A855F7
- Animação: flutuam para cima, opacidade pulsa
- Quantidade: 15-20 partículas

---

## Componentes

### Cards com Cantos Cortados (Chanfrados)
```css
/* Estilo HUD gamer - cortes diagonais nos cantos */
clip-path: polygon(
  20px 0,           /* canto superior esquerdo cortado */
  100% 0,
  100% calc(100% - 20px),
  calc(100% - 20px) 100%,  /* canto inferior direito cortado */
  0 100%,
  0 20px
);
```

### Bordas
- Bordas finas: 1px solid #27272A
- Hover: border-[#A855F7]/50
- Corner accents: linhas roxas nos cantos cortados

### Botões
```
Primário:
- Background: #A855F7
- Texto: #0A0A0A (preto)
- Hover: #C084FC
- Font: mono, bold, tracking-wider, uppercase

Secundário:
- Background: transparent
- Border: #A855F7/50
- Texto: #A855F7
- Hover: bg-[#A855F7]/10
```

### Tags/Labels
```
- Background: #A855F7/5 ou #A855F7/10
- Border: #A855F7/30
- Texto: #A855F7
- Font: mono, xs, tracking-[0.3em], uppercase
```

---

## Animações (Framer Motion)

### Entrada de Elementos
```javascript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}
```

### Hover Scale
```javascript
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}
```

### Efeito Glitch
```javascript
animate={{
  opacity: [1, 0.2, 1, 0.5, 1],
  x: [0, -3, 2, -1, 0],
  scaleX: [1, 1.2, 0.8, 1.1, 1],
}}
transition={{
  duration: 0.8,
  repeat: Infinity,
  repeatDelay: 2,
}}
```

### Crosshair Rotativo
```javascript
animate={{ rotate: 360 }}
transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
```

### Pulse de Opacidade
```javascript
animate={{ opacity: [1, 0.3, 1] }}
transition={{ duration: 1.5, repeat: Infinity }}
```

---

## Elementos de HUD Gamer

### Indicadores de Status
- Círculo pulsante verde: sistema online
- Coordenadas: LAT/LON no canto
- Frequência: "FREQ: 777.7 MHz"

### Barra de Estoque (HP Bar)
```
- Verde (#22C55E): > 50% estoque
- Amarelo (#EAB308): 20-50% estoque
- Vermelho (#EF4444): < 20% estoque
- Background: #27272A
- Height: 6px
```

### Countdown Timer
- Boxes separados para: DIAS | HORAS | MIN | SEG
- Separador: ":"
- Font: display, números grandes
- Labels: mono, xs, embaixo

---

## Ícones e Símbolos

### Crosshair/Mira
- Círculos concêntricos
- Linhas em cruz que pulsam
- Cor: #A855F7
- Rotação contínua lenta

### Separadores
- Linha vertical com gradiente: transparent → #A855F7 → transparent
- Símbolo "|" em roxo
- Corner brackets: [ ]

---

## Padrões de Layout

### Landing Page
- Fundo preto com orbs animados
- Cards lado a lado com separador central
- Logo no topo, copyright embaixo

### Página da Loja
- Hero full-screen com título grande
- Seções com labels numerados (01, 02, 03...)
- Grid de produtos 3-5 colunas
- Footer com links e newsletter

---

## Tom de Voz

### Textos
- Curtos e diretos
- Mistura português com termos gamer em inglês
- Imperativo: "VER DROPS", "ENTRAR"
- Referências a games: "skin", "lobby", "pause"

### Exemplos
- "Streetwear com alma gamer"
- "A vida não tem pause"
- "Seja no lobby ou na rua"
- "STAY IN THE GAME"
- "LIMITED EDITION - NUNCA REPÕE"

---

## Responsividade

### Breakpoints
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

### Adaptações Mobile
- Cards empilham verticalmente
- Fontes reduzem proporcionalmente
- Menu hamburguer
- Touch-friendly (min 44px targets)

---

## Tecnologias Utilizadas

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **Animações:** Framer Motion
- **Fontes:** Google Fonts (Orbitron, JetBrains Mono, Inter)
- **Ícones:** Lucide React
