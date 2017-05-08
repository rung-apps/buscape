const { create } = require('rung-sdk');
const { Money, String: Text } = require('rung-sdk/dist/types');
const Bluebird = require('bluebird');
const agent = require('superagent');
const promisifyAgent = require('superagent-promise');
const { head, map, pipe, prop } = require('ramda');

const request = promisifyAgent(agent, Bluebird);

const token = '<<<YOUR TOKEN HERE>>>';
const sourceId = '<<<YOUR SOURCE ID HERE>>>';
const server = `http://sandbox.buscape.com.br/service/findProductList/lomadee/${token}/BR/?sourceId=${sourceId}&app-token=${token}&format=json&program=lomadee`;
// See more in http://developer.buscape.com.br/portal/lomadee/api-de-ofertas/recursos#lista-de-produtos

function createAlert({ productshortname, productname, pricemin, links, thumbnail }) {
    const { url } = head(links).link;
    const { url: picture } = thumbnail;

    return {
        title: `${productshortname} no preço mínimo de R$ ${pricemin}`,
        comment: `
            ### ${productname}

            **R$ ${pricemin}**

            [Clique aqui para abrir no Buscapé](${url})

            ![${productname}](${picture})
        `
    };
}

function main(context, done) {
    const { item, value } = context.params;

    return request.get(`${server}&keyword=${item}&priceMax=${value}`)
        .then(({ body }) => {
            const products = body.product || [];
            const alerts = map(pipe(prop('product'), createAlert), products);
            done(alerts);
        })
        .catch(() => done([]));
}

const params = {
    item: {
        description: 'Informe o produto que você está procurando (Ex: TV)',
        type: Text,
        default: 'TV'
    },
    value: {
        description: 'O valor do produto deve ser inferior a',
        type: Money,
        default: 500
    }
};

const app = create(main, { params });

module.exports = app;
