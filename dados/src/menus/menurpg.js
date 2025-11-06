module.exports = async function menurpg(prefix, botName = "MeuBot", userName = "Usuário", {
    header = `╭┈⊰ ⚔️ 『 *MODO RPG* 』\n┊Olá, #user#!\n╰─┈┈┈┈┈◜⚔️◞┈┈┈┈┈─╯`,
    menuTopBorder = "╭┈",
    bottomBorder = "╰─┈┈┈┈┈◜⚔️◞┈┈┈┈┈─╯",
    menuTitleIcon = "⚔️ฺꕸ▸",
    menuItemIcon = "•.̇𖥨֗✨⭟",
    separatorIcon = "⚔️",
    middleBorder = "┊",
    profileMenuTitle = "👤 PERFIL & STATUS",
    economyMenuTitle = "💰 ECONOMIA & FINANÇAS",
    activitiesMenuTitle = "🎯 ATIVIDADES DIÁRIAS",
    adventureMenuTitle = "🗺️ AVENTURA & EXPLORAÇÃO",
    combatMenuTitle = "⚔️ COMBATE & BATALHAS",
    craftingMenuTitle = "🔨 CRAFTING & EQUIPAMENTOS",
    socialMenuTitle = "💝 SOCIAL & INTERAÇÕES",
    familyMenuTitle = "👨‍👩‍👧‍👦 FAMÍLIA & ADOÇÃO",
    guildMenuTitle = "🏰 CLÃ & COMUNIDADE",
    questMenuTitle = "📜 MISSÕES & CONQUISTAS",
    petsMenuTitle = "🐾 PETS & COMPANHEIROS",
    reputationMenuTitle = "⭐ REPUTAÇÃO & FAMA",
    investmentMenuTitle = "📈 INVESTIMENTOS & BOLSA",
    gamblingMenuTitle = "🎰 CASSINO & APOSTAS",
    evolutionMenuTitle = "🌟 EVOLUÇÃO & PRESTIGE",
    eventsMenuTitle = "🎉 EVENTOS"
} = {}) {
  const h = header.replace(/#user#/g, userName);
    return `‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎
${h}

╭─⊱ 💡 *BEM-VINDO AO MODO RPG!* ⊰─╮
│ Um mundo de aventuras infinitas!
│ Complete missões, batalhe, invista,
│ evolua seu personagem e domine o
│ ranking! Novidades diárias! ⚔️✨
╰────────────────────────────╯

${menuTopBorder}${separatorIcon} *${profileMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}perfilrpg - Ver perfil completo
${middleBorder}${menuItemIcon}${prefix}carteira - Moedas & recursos
${middleBorder}${menuItemIcon}${prefix}toprpg - Ranking de jogadores
${middleBorder}${menuItemIcon}${prefix}inventario - Seus itens
${middleBorder}${menuItemIcon}${prefix}equipamentos - Gerenciar gear
${middleBorder}${menuItemIcon}${prefix}conquistas - Achievements
${bottomBorder}

${menuTopBorder}${separatorIcon} *${evolutionMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}evoluir - Sistema de prestige
${middleBorder}${menuItemIcon}${prefix}streak - Ver série de dias
${middleBorder}${menuItemIcon}${prefix}reivindicar - Pegar recompensas
${bottomBorder}

${menuTopBorder}${separatorIcon} *${economyMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}depositar <valor|all>
${middleBorder}${menuItemIcon}${prefix}sacar <valor|all>
${middleBorder}${menuItemIcon}${prefix}transferir @user <valor>
${middleBorder}${menuItemIcon}${prefix}pix @user <valor>
${middleBorder}${menuItemIcon}${prefix}vagas - Empregos disponíveis
${middleBorder}${menuItemIcon}${prefix}emprego <vaga>
${middleBorder}${menuItemIcon}${prefix}demitir
${bottomBorder}

${menuTopBorder}${separatorIcon} *${investmentMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}investir - Ver mercado
${middleBorder}${menuItemIcon}${prefix}investir <ação> <qtd> - Comprar
${middleBorder}${menuItemIcon}${prefix}vender <ação> <qtd> - Vender
${bottomBorder}

${menuTopBorder}${separatorIcon} *${gamblingMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}dados <valor> - Jogo de dados
${middleBorder}${menuItemIcon}${prefix}coinflip <cara|coroa> <valor>
${middleBorder}${menuItemIcon}${prefix}crash <valor> - Crash game
${bottomBorder}

${menuTopBorder}${separatorIcon} *${activitiesMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}diario - Recompensa diária
${middleBorder}${menuItemIcon}${prefix}trabalhar - Ganhar dinheiro
${middleBorder}${menuItemIcon}${prefix}minerar - Minerar recursos
${middleBorder}${menuItemIcon}${prefix}pescar - Pescar peixes raros
${middleBorder}${menuItemIcon}${prefix}coletar - Coletar materiais
${middleBorder}${menuItemIcon}${prefix}caçar - Caçar monstros
${middleBorder}${menuItemIcon}${prefix}cultivar <planta> - Plantar
${middleBorder}${menuItemIcon}${prefix}cozinhar <receita> - Culinária
${bottomBorder}

${menuTopBorder}${separatorIcon} *${adventureMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}explorar - Explorar o mundo
${middleBorder}${menuItemIcon}${prefix}masmorra - Entrar em dungeons
${middleBorder}${menuItemIcon}${prefix}chefe - Enfrentar boss
${middleBorder}${menuItemIcon}${prefix}eventos - Eventos ativos
${bottomBorder}

${menuTopBorder}${separatorIcon} *${combatMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}duelar @user - Duelo PvP
${middleBorder}${menuItemIcon}${prefix}arena - Arena de batalha
${middleBorder}${menuItemIcon}${prefix}torneio - Ver/participar
${middleBorder}${menuItemIcon}${prefix}assaltar @user - Roubar
${middleBorder}${menuItemIcon}${prefix}crime - Cometer crime
${bottomBorder}

${menuTopBorder}${separatorIcon} *${craftingMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}forjar <item> - Forjar equip
${middleBorder}${menuItemIcon}${prefix}encantar - Melhorar arma
${middleBorder}${menuItemIcon}${prefix}desmontar <item> - Materiais
${middleBorder}${menuItemIcon}${prefix}materiais - Ver recursos
${bottomBorder}

${menuTopBorder}${separatorIcon} *${socialMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}casar @user - Propor
${middleBorder}${menuItemIcon}${prefix}divorciar - Terminar
${middleBorder}${menuItemIcon}${prefix}namorar @user - Pedir namoro
${middleBorder}${menuItemIcon}${prefix}terminar - Acabar namoro
${middleBorder}${menuItemIcon}${prefix}relacionamento - Status
${middleBorder}${menuItemIcon}${prefix}casais - Top casais
${middleBorder}${menuItemIcon}${prefix}abracar @user - Abraçar
${middleBorder}${menuItemIcon}${prefix}beijar @user - Beijar
${middleBorder}${menuItemIcon}${prefix}bater @user - Dar tapa
${middleBorder}${menuItemIcon}${prefix}proteger @user - Proteger
${bottomBorder}

${menuTopBorder}${separatorIcon} *${familyMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}familia - Ver sua família
${middleBorder}${menuItemIcon}${prefix}adotaruser @user - Adotar
${middleBorder}${menuItemIcon}${prefix}arvore - Árvore genealógica
${bottomBorder}

${menuTopBorder}${separatorIcon} *${guildMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}criarcla <nome> - Criar clã
${middleBorder}${menuItemIcon}${prefix}cla - Info do clã
${middleBorder}${menuItemIcon}${prefix}convidar @user
${middleBorder}${menuItemIcon}${prefix}sair - Sair do clã
${bottomBorder}

${menuTopBorder}${separatorIcon} *${questMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}missoes - Ver missões diárias
${middleBorder}${menuItemIcon}${prefix}conquistas - Achievements
${bottomBorder}

${menuTopBorder}${separatorIcon} *${petsMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}pets - Seus companheiros
${middleBorder}${menuItemIcon}${prefix}adotar <pet> - Novo pet
${middleBorder}${menuItemIcon}${prefix}alimentar <nº> - Dar comida
${middleBorder}${menuItemIcon}${prefix}treinar <nº> - Treinar
${middleBorder}${menuItemIcon}${prefix}evoluir <nº> - Evoluir
${middleBorder}${menuItemIcon}${prefix}batalha <nº> - Batalhar
${middleBorder}${menuItemIcon}${prefix}renomearpet <nº> <nome>
${bottomBorder}

${menuTopBorder}${separatorIcon} *${reputationMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}reputacao - Ver sua reputação
${middleBorder}${menuItemIcon}${prefix}votar @user - Dar reputação
${bottomBorder}

${menuTopBorder}${separatorIcon} *${eventsMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}eventos - Ver eventos ativos
${bottomBorder}

${menuTopBorder}${separatorIcon} *💎 SISTEMA DE PROGRESSO DIÁRIO*
${middleBorder}
${middleBorder}🔥 Mantenha seu streak ativo!
${middleBorder}${menuItemIcon}${prefix}diario - Recompensa diária
${middleBorder}${menuItemIcon}${prefix}streak - Veja sua série
${middleBorder}${menuItemIcon}${prefix}reivindicar - Pegue prêmios
${middleBorder}${menuItemIcon}${prefix}missoes - Quests diárias
${middleBorder}${menuItemIcon}${prefix}investir - Mercado muda 24h
${middleBorder}${menuItemIcon}${prefix}torneio - Competições diárias
${middleBorder}
${middleBorder}📈 Evolua continuamente!
${middleBorder}${menuItemIcon}${prefix}evoluir - Sistema de prestige
${middleBorder}${menuItemIcon}${prefix}toprpg - Ranking atualizado
${middleBorder}${menuItemIcon}${prefix}conquistas - Novos objetivos
${bottomBorder}

🎮 *Jogue todos os dias e domine o ranking!* ⚔️
`;
}
