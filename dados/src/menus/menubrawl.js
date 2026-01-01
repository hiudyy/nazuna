export default async function menuBrawlStars(prefix, botName = "MeuBot", userName = "Usuário", {
    header = `╭┈⊰ 🎮 『 *BRAWL STARS* 』\n┊Olá, #user#!\n╰─┈┈┈┈┈◜⚔️◞┈┈┈┈┈─╯`,
    menuTopBorder = "╭┈",
    bottomBorder = "╰─┈┈┈┈┈◜⚔️◞┈┈┈┈┈─╯",
    menuTitleIcon = "��ฺꕸ▸",
    menuItemIcon = "•.̇𖥨֗🏆⭟",
    separatorIcon = "⚔️",
    middleBorder = "┊"
} = {}) {
    const formattedHeader = header.replace(/#user#/g, userName);
    return `${formattedHeader}

${menuTopBorder}${separatorIcon} *👤 PERFIL & ESTATÍSTICAS*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}bsplayer <tag>
${middleBorder}   📊 Perfil completo do jogador
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}bsmeusbrawlers <tag>
${middleBorder}   👾 Lista todos os brawlers do jogador
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}bsbattlelog <tag>
${middleBorder}   📜 Histórico das últimas batalhas
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}bscompare <tag1> <tag2>
${middleBorder}   ⚖️ Compara dois jogadores
${bottomBorder}

${menuTopBorder}${separatorIcon} *🛡️ CLUBES*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}bsclub <tag>
${middleBorder}   📋 Informações completas do clube
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}bsmembros <tag>
${middleBorder}   👥 Lista todos os membros
${bottomBorder}

${menuTopBorder}${separatorIcon} *👾 BRAWLERS*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}bsbrawlers
${middleBorder}   �� Lista todos os brawlers por raridade
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}bsbrawler <nome>
${middleBorder}   🔍 Detalhes, skills, gadgets e Star Powers
${bottomBorder}

${menuTopBorder}${separatorIcon} *🗺️ MAPAS & MODOS*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}bsevents
${middleBorder}   🎯 Eventos ativos e próximos
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}bsmapas
${middleBorder}   📋 Lista de todos os mapas
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}bsmapa <nome>
${middleBorder}   🔍 Detalhes e melhores brawlers do mapa
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}bsmodos
${middleBorder}   🎮 Lista de modos de jogo
${bottomBorder}

${menuTopBorder}${separatorIcon} *🏆 RANKINGS*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}bsrank [país] [tipo]
${middleBorder}
${middleBorder}📋 *Tipos:* players, clubs, brawlers
${middleBorder}🌍 *Países:* global, br, us, pt, mx...
${middleBorder}
${middleBorder}💡 *Exemplos:*
${middleBorder}   ${prefix}bsrank global players
${middleBorder}   ${prefix}bsrank br clubs
${bottomBorder}

${menuTopBorder}${separatorIcon} *🖼️ EXTRAS*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}bsicons
${middleBorder}   🖼️ Info sobre ícones disponíveis
${bottomBorder}

${menuTopBorder}${separatorIcon} *ℹ️ INFORMAÇÕES*
${middleBorder}
${middleBorder}📌 TAGs sempre com # (ex: #2PP)
${middleBorder}📌 Dados da API oficial do Brawl Stars
${middleBorder}📌 Imagens do CDN oficial Brawlify
${bottomBorder}
`;
}
