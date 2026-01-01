export default async function menuBuscas(prefix, botName = "MeuBot", userName = "Usuário", {
    header = `╭┈⊰ 🌸 『 *${botName}* 』\n┊Olá, #user#!\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`,
    menuTopBorder = "╭┈",
    bottomBorder = "╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯",
    menuTitleIcon = "🍧ฺꕸ▸",
    menuItemIcon = "•.̇𖥨֗🍓⭟",
    separatorIcon = "❁",
    middleBorder = "┊",
    cpfMenuTitle = "🆔 CONSULTAS POR CPF",
    nomeMenuTitle = "👤 CONSULTAS POR NOME",
    telefoneMenuTitle = "📱 CONSULTAS POR TELEFONE",
    veiculoMenuTitle = "🚗 CONSULTAS DE VEÍCULOS",
    empresaMenuTitle = "🏢 CONSULTAS DE EMPRESAS",
    localizacaoMenuTitle = "📍 CONSULTAS DE LOCALIZAÇÃO",
    outrosMenuTitle = "📋 OUTRAS CONSULTAS"
} = {}) {
    const formattedHeader = header.replace(/#user#/g, userName);
    return `${formattedHeader}

${menuTopBorder}${separatorIcon} *${cpfMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}cpf <cpf>
${middleBorder}${menuItemIcon}${prefix}vizinhos <cpf>
${middleBorder}${menuItemIcon}${prefix}proprietario <cpf>
${middleBorder}${menuItemIcon}${prefix}empregos <cpf>
${middleBorder}${menuItemIcon}${prefix}vacinas <cpf>
${middleBorder}${menuItemIcon}${prefix}beneficios <cpf>
${middleBorder}${menuItemIcon}${prefix}internet <cpf>
${middleBorder}${menuItemIcon}${prefix}parentes <cpf>
${middleBorder}${menuItemIcon}${prefix}enderecos <cpf>
${middleBorder}${menuItemIcon}${prefix}obito <cpf>
${middleBorder}${menuItemIcon}${prefix}score <cpf>
${middleBorder}${menuItemIcon}${prefix}compras <cpf>
${middleBorder}${menuItemIcon}${prefix}cnh <cpf>
${bottomBorder}

${menuTopBorder}${separatorIcon} *${nomeMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}nome <nome>
${middleBorder}${menuItemIcon}${prefix}pai <nome>
${middleBorder}${menuItemIcon}${prefix}mae <nome>
${bottomBorder}

${menuTopBorder}${separatorIcon} *${telefoneMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}telefone <telefone>
${middleBorder}${menuItemIcon}${prefix}tel <telefone>
${bottomBorder}

${menuTopBorder}${separatorIcon} *${veiculoMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}placa <placa>
${middleBorder}${menuItemIcon}${prefix}chassi <chassi>
${bottomBorder}

${menuTopBorder}${separatorIcon} *${empresaMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}cnpj <cnpj>
${middleBorder}${menuItemIcon}${prefix}funcionarios <cnpj>
${bottomBorder}

${menuTopBorder}${separatorIcon} *${localizacaoMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}cep <cep>
${bottomBorder}

${menuTopBorder}${separatorIcon} *${outrosMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}email <email>
${middleBorder}${menuItemIcon}${prefix}titulo <titulo>
${bottomBorder}
`;
}

