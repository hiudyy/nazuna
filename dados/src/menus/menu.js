export default async function menu(prefix, botName = "MeuBot", userName = "Usuário", {
    header = `╭┈⊰ 🌸 『 *${botName}* 』\n┊Olá, #user#!\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`,
    menuTopBorder = "╭┈",
    bottomBorder = "╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯",
    menuTitleIcon = "🍧ฺꕸ▸",
    menuItemIcon = "•.̇𖥨֗🍓⭟",
    separatorIcon = "❁",
    middleBorder = "┊"
} = {}) {
    const formattedHeader = header.replace(/#user#/g, userName);
    return `${formattedHeader}

${menuTopBorder}${separatorIcon} *MENU PRINCIPAL*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}menuia
${middleBorder}${menuItemIcon}${prefix}menudown
${middleBorder}${menuItemIcon}${prefix}menuadm
${middleBorder}${menuItemIcon}${prefix}menubn
${middleBorder}${menuItemIcon}${prefix}menudono
${middleBorder}${menuItemIcon}${prefix}menumemb
${middleBorder}${menuItemIcon}${prefix}ferramentas
${middleBorder}${menuItemIcon}${prefix}menufig
${middleBorder}${menuItemIcon}${prefix}alteradores
${middleBorder}${menuItemIcon}${prefix}menurpg
${middleBorder}${menuItemIcon}${prefix}menuvip
${middleBorder}${menuItemIcon}${prefix}menubuscas
${middleBorder}${menuItemIcon}${prefix}menubs
${bottomBorder}
`;
}