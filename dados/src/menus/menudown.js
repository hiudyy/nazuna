export default async function menudown(prefix, botName = "MeuBot", userName = "Usuário", {
    header = `╭┈⊰ 🌸 『 *${botName}* 』\n┊Olá, #user#!\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`,
    menuTopBorder = "╭┈",
    bottomBorder = "╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯",
    menuTitleIcon = "🍧ฺꕸ▸",
    menuItemIcon = "•.̇𖥨֗🍓⭟",
    separatorIcon = "❁",
    middleBorder = "┊",
    searchMenuTitle = "🔍 PESQUISAS & CONSULTAS",
    audioMenuTitle = "🎵 MÚSICA & ÁUDIO", 
    videoMenuTitle = "🎬 VÍDEOS & STREAMING",
    downloadMenuTitle = "📥 DOWNLOADS",
    mediaMenuTitle = "📱 MÍDIAS SOCIAIS",
    gamesMenuTitle = "🎮 GAMING & APPS"
} = {}) {
    const formattedHeader = header.replace(/#user#/g, userName);
    return `${formattedHeader}

${menuTopBorder}${separatorIcon} *${searchMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}google
${middleBorder}${menuItemIcon}${prefix}noticias
${middleBorder}${menuItemIcon}${prefix}apps
${middleBorder}${menuItemIcon}${prefix}dicionario
${middleBorder}${menuItemIcon}${prefix}wikipedia
${bottomBorder}

${menuTopBorder}${separatorIcon} *${audioMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}letra
${middleBorder}${menuItemIcon}${prefix}play
${middleBorder}${menuItemIcon}${prefix}play2

${middleBorder}${menuItemIcon}${prefix}spotify
${middleBorder}${menuItemIcon}${prefix}soundcloud
${middleBorder}${menuItemIcon}${prefix}bandcamp
${bottomBorder}

${menuTopBorder}${separatorIcon} *${videoMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}playvid
${middleBorder}${menuItemIcon}${prefix}vimeo
${middleBorder}${menuItemIcon}${prefix}twitch
${middleBorder}${menuItemIcon}${prefix}reddit
${middleBorder}${menuItemIcon}${prefix}dailymotion
${middleBorder}${menuItemIcon}${prefix}streamable
${bottomBorder}

${menuTopBorder}${separatorIcon} *${downloadMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}alldl
${middleBorder}${menuItemIcon}${prefix}tiktok
${middleBorder}${menuItemIcon}${prefix}instagram
${middleBorder}${menuItemIcon}${prefix}igstory
${middleBorder}${menuItemIcon}${prefix}facebook
${middleBorder}${menuItemIcon}${prefix}gdrive
${middleBorder}${menuItemIcon}${prefix}mediafire
${middleBorder}${menuItemIcon}${prefix}twitter
${bottomBorder}

${menuTopBorder}${separatorIcon} *${mediaMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}pinterest
${bottomBorder}

${menuTopBorder}${separatorIcon} *${gamesMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}mcplugin
${bottomBorder}
`;
}