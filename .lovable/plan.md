
# Ajuste para o poster não parecer cortado no mobile

## Diagnóstico
Pelo código atual, o poster já usa `object-contain`, então o problema agora não é só “corte” da imagem. O que está prejudicando a visualização no mobile é a combinação de:
- altura fixa relativamente baixa (`h-[280px]`)
- conteúdo sobreposto em cima do poster
- gradiente escuro cobrindo boa parte da arte
- poster vertical dentro de uma área horizontal, o que reduz muito a imagem visível

## Melhor solução
Vou mudar o card mobile para um layout mais legível:

```text
[ poster visível inteiro ]
[ badge ]
[ título ]
[ descrição ]
[ botões ]
```

Em vez de manter texto e botões por cima da imagem, no mobile o poster fica sozinho no topo e o conteúdo desce para uma área separada abaixo. Isso elimina a sensação de corte.

## O que implementar em `src/components/public/NovidadesCard.tsx`

### 1. Remover a sobreposição no mobile
- tirar o bloco mobile com `absolute bottom-0`
- parar de colocar badge, título e botões sobre a arte no mobile

### 2. Criar um poster mobile dedicado
- usar uma área maior para o poster, por exemplo `h-[320px]` ou `aspect-[3/4]`
- manter `object-contain`
- centralizar a imagem com `object-center`

### 3. Melhorar o fundo do poster
- manter fundo escuro do card
- opcionalmente adicionar um fundo desfocado atrás da imagem para preencher laterais sem cortar:
  - camada de fundo com `object-cover blur`
  - camada principal por cima com `object-contain`

Isso dá aparência premium sem esconder a arte.

### 4. Separar desktop e mobile com clareza
- mobile: poster em cima + conteúdo abaixo
- desktop: manter layout lateral atual

## Resultado esperado
- a imagem aparece inteira no mobile
- o poster fica maior e mais fácil de enxergar
- o conteúdo não cobre mais a arte
- o card continua bonito, mas mais funcional

## Detalhe técnico
A estrutura mobile ideal fica assim:

```text
card
 ├─ poster wrapper
 │   ├─ fundo blur opcional
 │   └─ img principal com object-contain
 └─ content wrapper
     ├─ badge
     ├─ title
     ├─ overview
     └─ buttons
```

## Observação
Se você quiser priorizar “ver a arte inteira”, essa é a melhor abordagem. Se quiser priorizar “visual mais cheio”, aí daria para voltar ao `object-cover`, mas sempre haverá corte em alguns posters verticais.
