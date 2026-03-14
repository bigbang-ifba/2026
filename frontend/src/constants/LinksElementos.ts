const LINKS_ESPECIFICOS: Record<string, string> = {
    // Padrão "elementos-quimicos-"
    "hidrogenio": "https://crqsp.org.br/elementos-quimicos-hidrogenio",
    "helio": "https://crqsp.org.br/elementos-quimicos-helio/",
    "litio": "https://crqsp.org.br/elementos-quimicos-litio/",
    "boro": "https://crqsp.org.br/elementos-quimicos-boro/",
    "carbono": "https://crqsp.org.br/elementos-quimicos-carbono/",
    "nitrogenio": "https://crqsp.org.br/elementos-quimicos-nitrogenio/",
    "oxigenio": "https://crqsp.org.br/elementos-quimicos-oxigenio/",
    "fluor": "https://crqsp.org.br/elementos-quimicos-fluor/",
    "sodio": "https://crqsp.org.br/elementos-quimicos-sodio/",
    "magnesio": "https://crqsp.org.br/elementos-quimicos-magnesio/",
    "aluminio": "https://crqsp.org.br/elementos-quimicos-aluminio/",
    "silicio": "https://crqsp.org.br/elementos-quimicos-silicio/",
    "fosforo": "https://crqsp.org.br/elementos-quimicos-fosforo/",
    "enxofre": "https://crqsp.org.br/elementos-quimicos-enxofre/",
    "cloro": "https://crqsp.org.br/elementos-quimicos-cloro/",
    "potassio": "https://crqsp.org.br/elementos-quimicos-potassio/",
    "calcio": "https://crqsp.org.br/elementos-quimicos-calcio/",
    "titanio": "https://crqsp.org.br/elementos-quimicos-titanio/",
    "vanadio": "https://crqsp.org.br/elementos-quimicos-vanadio/",
    "ferro": "https://crqsp.org.br/elementos-quimicos-ferro/",
    "niquel": "https://crqsp.org.br/elementos-quimicos-niquel/",
    "cobre": "https://crqsp.org.br/elementos-quimicos-cobre/",
    "zinco": "https://crqsp.org.br/elementos-quimicos-zinco/",
    "germanio": "https://crqsp.org.br/elementos-quimicos-germanio/",
    "zirconio": "https://crqsp.org.br/elementos-quimicos-zirconio/",
    "niobio": "https://crqsp.org.br/elementos-quimicos-niobio/",
    "molibdenio": "https://crqsp.org.br/elementos-quimicos-molibdenio/",
    "prata": "https://crqsp.org.br/elementos-quimicos-prata/",
    "cesio": "https://crqsp.org.br/elementos-quimicos-cesio/",
    "bario": "https://crqsp.org.br/elementos-quimicos-bario/",
    "tungstenio": "https://crqsp.org.br/elementos-quimicos-tungstenio/",
    "ouro": "https://crqsp.org.br/elementos-quimicos-ouro/",
    "mercurio": "https://crqsp.org.br/elementos-quimicos-mercurio/",
    "radonio": "https://crqsp.org.br/elementos-quimicos-radonio/",
    "radio": "https://crqsp.org.br/elementos-quimicos-radio/",

    // Padrão "elemento-quimico-"
    "berilio": "https://crqsp.org.br/elemento-quimico-berilio/",
    "escandio": "https://crqsp.org.br/elemento-quimico-escandio/",
    "cromio": "https://crqsp.org.br/elemento-quimico-cromio/",
    "manganes": "https://crqsp.org.br/elemento-quimico-manganes/",
    "cobalto": "https://crqsp.org.br/elemento-quimico-cobalto/",
    "galio": "https://crqsp.org.br/elemento-quimico-galio/",
    "arsenio": "https://crqsp.org.br/elemento-quimico-arsenio/",
    "rubidio": "https://crqsp.org.br/elemento-quimico-rubidio/",
    "estroncio": "https://crqsp.org.br/elemento-quimico-estroncio/",
    "itrio": "https://crqsp.org.br/elemento-quimico-itrio/",
    "paladio": "https://crqsp.org.br/elemento-quimico-paladio/",
    "indio": "https://crqsp.org.br/elemento-quimico-indio/",
    "antimonio": "https://crqsp.org.br/elemento-quimco-antimonio/",
    "hafnio": "https://crqsp.org.br/elemento-quimico-hafnio/",
    "tantalo": "https://crqsp.org.br/elemento-quimico-tantalo/",
    "osmio": "https://crqsp.org.br/elemento-quimico-osmio/",
    "talio": "https://crqsp.org.br/elemento-quimico-talio/",
    "bismuto": "https://crqsp.org.br/elemento-quimico-bismuto/",
    "polonio": "https://crqsp.org.br/elemento-quimico-polonio/",
    "astato": "https://crqsp.org.br/elemento-quimico-astato/",
    "francio": "https://crqsp.org.br/elemento-quimico-francio/",
    "rutherfordio": "https://crqsp.org.br/elemento-quimico-rutherfordio/",

    // Padrões variados
    "argonio": "https://crqsp.org.br/argonio/",
    "selenio": "https://crqsp.org.br/selenio/",
    "bromo": "https://crqsp.org.br/o-elemento-bromo/",
    "tecnecio": "https://crqsp.org.br/tecnecio/",
    "cadmio": "https://crqsp.org.br/cadmio-util-e-perigoso/",
    "estanho": "https://crqsp.org.br/estanho/",
    "telurio": "https://crqsp.org.br/telurio/",
    "iodo": "https://crqsp.org.br/qv_iodo/",
    "renio": "https://crqsp.org.br/renio/",
    "iridio": "https://crqsp.org.br/iridio-mais-caro-que-ouro/",
    "platina": "https://crqsp.org.br/rara-cara-poderosa-esta-e-a-platina/",
    "chumbo": "https://crqsp.org.br/chumbo/",
    "dubnio": "https://crqsp.org.br/dubnio/",
    "seaborgio": "https://crqsp.org.br/seaborgio/",
    "bohrio": "https://crqsp.org.br/bohrio/",
    "hassio": "https://crqsp.org.br/hassio/",
    "meitnerio": "https://crqsp.org.br/meitnerio/",
    "darmstadtio": "https://crqsp.org.br/darmstadtio/",
    "roentgenio": "https://crqsp.org.br/roentgenio/",
    "copernicio": "https://crqsp.org.br/copernicio/",
    "nihonio": "https://crqsp.org.br/nihonio/",
    "flerovio": "https://crqsp.org.br/flerovio/",
    "moscovio": "https://crqsp.org.br/moscovio/",
    "livermorio": "https://crqsp.org.br/livermorio/"
};

// Famílias que compartilham o mesmo link
const LINK_LANTANIDEOS = "https://crqsp.org.br/lantanideos-por-dentro-das-novas-tecnologias/";
const LISTA_LANTANIDEOS = ["lantanio", "cerio", "praseodimio", "neodimio", "promecio", "samario", "europio", "gadolinio", "terbio", "disprosio", "holmio", "erbio", "tulio", "iterbio", "lutecio"];

const LINK_ACTINIDEOS = "https://crqsp.org.br/radioativos-e-pesados-conheca-os-actinideos/";
const LISTA_ACTINIDEOS = ["actinio", "torio", "protactinio", "uranio", "netunio", "plutonio", "americio", "curio", "berquelio", "californio", "einsteinio", "fermio", "mendelevio", "nobelio", "laurencio"];

const LINK_PADRAO = "https://crqsp.org.br/tabelaperiodica/";

// Exportamos apenas a função que o front-end vai usar
export const obterLinkElemento = (nomeElemento: string): string => {
    if (!nomeElemento) return LINK_PADRAO;

    const nomeNormalizado = nomeElemento
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    if (LINKS_ESPECIFICOS[nomeNormalizado]) {
        return LINKS_ESPECIFICOS[nomeNormalizado];
    }

    if (LISTA_LANTANIDEOS.includes(nomeNormalizado)) {
        return LINK_LANTANIDEOS;
    }

    if (LISTA_ACTINIDEOS.includes(nomeNormalizado)) {
        return LINK_ACTINIDEOS;
    }

    return LINK_PADRAO;
};