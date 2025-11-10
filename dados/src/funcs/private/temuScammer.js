function extractProductId(link) {
    if (typeof link !== 'string') return null;
    try {
        const match = link.match(/-g-(\d+)\.html/);
        return match ? match[1] : null;
    } catch (error) {
        console.error('Erro ao extrair o ID do produto:', error);
        return null;
    }
}

function convertTemuLink(link) {
    const productId = extractProductId(link);
    if (!productId) return null;
    const newLink = "https://www.temu.com/br/bmw.html?subj=downloadable-ads-shopping&tmpl=dn9&_x_ads_sub_channel=shopping&_p_rfs=1&_x_ns_prz_type=-1&_x_ns_sku_id={ID}&goods_id={ID}&sku_id={ID}&_x_gmc_account=5362938519&_x_login_type=Google&_p_jump_id=962&adg_ctx=a-a7937f52~c-df9607e9&locale_override=29~pt~BRL&_x_ns_gid={ID}&mrk_rec=1&_x_ads_channel=google&_bg_fs=1&_x_vst_scene=adg".replaceAll(/{ID}/g, productId);
    return newLink;
}

export {
    extractProductId,
    convertTemuLink
};